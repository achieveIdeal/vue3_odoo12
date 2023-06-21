# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import json
import logging
from typing import Mapping

import werkzeug
import werkzeug.exceptions
import werkzeug.utils
import werkzeug.wrappers
import werkzeug.wsgi

from odoo.api import split_context, downgrade, Params

from odoo import http, exceptions
from odoo.http import request
from odoo.models import check_method_name

_logger = logging.getLogger(__name__)


def clean_action(action):
    action.setdefault('flags', {})
    action_type = action.setdefault('type', 'ir.actions.act_window_close')
    if action_type == 'ir.actions.act_window':
        return fix_view_modes(action)
    return action


def generate_views(action):
    view_id = action.get('view_id') or False
    if isinstance(view_id, (list, tuple)):
        view_id = view_id[0]

    # providing at least one view mode is a requirement, not an option
    view_modes = action['view_mode'].split(',')

    if len(view_modes) > 1:
        if view_id:
            raise ValueError('Non-db action dictionaries should provide '
                             'either multiple view modes or a single view '
                             'mode and an optional view id.\n\n Got view '
                             'modes %r and view id %r for action %r' % (
                                 view_modes, view_id, action))
        action['views'] = [(False, mode) for mode in view_modes]
        return
    action['views'] = [(view_id, view_modes[0])]


def fix_view_modes(action):
    if not action.get('views'):
        generate_views(action)

    if action.pop('view_type', 'form') != 'form':
        return action

    if 'view_mode' in action:
        action['view_mode'] = ','.join(
            mode if mode != 'tree' else 'list'
            for mode in action['view_mode'].split(','))
    action['views'] = [
        [id, mode if mode != 'tree' else 'list']
        for id, mode in action['views']
    ]

    return action


def _call_kw_model(method, self, args, kwargs):
    context, args, kwargs = split_context(method, args, kwargs)
    context['uid'] = request.env.uid
    recs = self.with_context(context or {})
    if context.get('front'):
        recs = self.with_context(context or {}).sudo()
    _logger.debug("call %s.%s(%s)", recs, method.__name__, Params(args, kwargs))
    result = method(recs, *args, **kwargs)
    return downgrade(method, result, recs, args, kwargs)


def _call_kw_model_create(method, self, args, kwargs):
    # special case for method 'create'
    context, args, kwargs = split_context(method, args, kwargs)
    if context:
        context['uid'] = request.env.uid
    recs = self.with_context(context or {})
    if context.get('front'):
        recs = self.with_context(context or {}).sudo()
    _logger.debug("call %s.%s(%s)", recs, method.__name__, Params(args, kwargs))
    result = method(recs, *args, **kwargs)
    return result.id if isinstance(args[0], Mapping) else result.ids


def _call_kw_multi(method, self, args, kwargs):
    ids, args = args[0], args[1:]
    context, args, kwargs = split_context(method, args, kwargs)
    model_obj = self.with_context(context or {})
    context['uid'] = request.env.uid
    if context.get('front'):
        model_obj = self.with_context(context or {}).sudo()
    recs = model_obj.browse(ids)
    if isinstance(ids, list) and len(ids) and ids[0] != 0 and not recs.exists():
        raise exceptions.Warning('该记录不存在!')
    _logger.debug("call %s.%s(%s)", recs, method.__name__, Params(args, kwargs))
    result = method(recs, *args, **kwargs)
    return downgrade(method, result, recs, args, kwargs)


def call_kw(model, name, args, kwargs):
    """ Invoke the given method ``name`` on the recordset ``model``. """
    method = getattr(type(model), name)
    api = getattr(method, '_api', None)
    if api == 'model':
        return _call_kw_model(method, model, args, kwargs)
    elif api == 'model_create':
        return _call_kw_model_create(method, model, args, kwargs)
    else:
        return _call_kw_multi(method, model, args, kwargs)


class FrontView(http.Controller):
    # todo:
    @http.route(['/front_index'], type='http', auth='public', website=True)
    def qweb_teaching_plan(self, **kwargs):
        user_rec = request.env.user
        if request.env.context.get('front'):
            user_rec = request.env['res.users'].browse(request.env.context.get('uid'))
        supplier_rec = request.env['e2yun.supplier.info'].sudo().search([('login_name', '=', user_rec.login)], limit=1)
        partner_rec = request.env['res.partner'].sudo().search([('origin', '=', supplier_rec.id)], limit=1)
        return request.render(
            "base_front_view.base_front_view", {'supplier_id': partner_rec.id}
        )


class FrontDataSet(http.Controller):

    @http.route(['/front/dataset/fields_get'], type='json', auth='public', csrf=False)
    def fields_get(self, model, method, args, kwargs):
        ids, args = args[0], args[1:]
        model = request.env[model]
        method = getattr(type(model), method)
        context, args, kwargs = split_context(method, args, kwargs)
        recs = model.with_context(context or {}).browse(ids)
        fields = recs.fields_get(args[0])
        for key in fields.keys():
            model_field = model._fields[key]
            hasOnchange = recs._has_onchange(model_field, []) or bool(model._field_triggers._map.get(model_field))
            fields[key]['onchange'] = hasOnchange and '1' or ''
            fields[key]['readonly'] = False
        return fields

    @http.route('/front/dataset/search_read', type='json', auth="public")
    def search_read(self, model, fields=False, offset=0, limit=False, domain=None, sort=None):
        return self.do_search_read(model, fields, offset, limit, domain, sort)

    def do_search_read(self, model, fields=False, offset=0, limit=False, domain=None
                       , sort=None):
        Model = request.env[model].sudo()

        records = Model.search_read(domain, fields,
                                    offset=offset or 0, limit=limit or False, order=sort or False)
        if not records:
            return {
                'length': 0,
                'records': []
            }
        if limit and len(records) == limit:
            length = Model.search_count(domain)
        else:
            length = len(records) + (offset or 0)
        return {
            'length': length,
            'records': records
        }

    def call_common(self, model, method, args, domain_id=None, context_id=None):
        return self._call_kw(model, method, args, {})

    def _call_kw(self, model, method, args, kwargs):
        check_method_name(method)
        return call_kw(request.env[model], method, args, kwargs)

    @http.route(['/front/dataset/call_kw', '/front/dataset/call_kw/<path:path>'], type='json', auth="public")
    def call_kw(self, model, method, args, kwargs, path=None):
        return self._call_kw(model, method, args, kwargs)

    @http.route('/front/dataset/call_button', type='json', auth="public")
    def call_button(self, model, method, args, domain_id=None, context_id=None):
        action = self._call_kw(model, method, args, {})
        if isinstance(action, dict) and action.get('type') != '':
            return clean_action(action)
        return False


class FrontReportController(http.Controller):

    @http.route([
        '/front/report/<converter>/<reportname>',
        '/front/report/<converter>/<reportname>/<docids>',
    ], type='http', auth='public', website=True)
    def report_routes(self, reportname, docids=None, converter=None, **data):
        request.env.uid = 1
        report = request.env['ir.actions.report']._get_report_from_name(reportname)
        context = dict(request.env.context)

        if docids:
            docids = [int(i) for i in docids.split(',')]
        if data.get('options'):
            data.update(json.loads(data.pop('options')))
        if data.get('context'):
            # Ignore 'lang' here, because the context in data is the one from the webclient *but* if
            # the user explicitely wants to change the lang, this mechanism overwrites it.
            data['context'] = json.loads(data['context'])
            if data['context'].get('lang'):
                del data['context']['lang']
            context.update(data['context'])
        if converter == 'html':
            html = report.with_context(context).render_qweb_html(docids, data=data)[0]
            return request.make_response(html)
        elif converter == 'pdf':
            pdf = report.with_context(context).render_qweb_pdf(docids, data=data)[0]
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        elif converter == 'text':
            text = report.with_context(context).render_qweb_text(docids, data=data)[0]
            texthttpheaders = [('Content-Type', 'text/plain'), ('Content-Length', len(text))]
            return request.make_response(text, headers=texthttpheaders)
        else:
            raise werkzeug.exceptions.HTTPException(description='Converter %s not implemented.' % converter)
