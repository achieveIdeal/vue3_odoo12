import Request from "../index";


const appElement = document.getElementById('app');
const supplier_id = parseInt(appElement.dataset['supplier_id'] || 0)

export function callButton(data) {
    data.args.push({'front': true})
    return Request.post({
        url: '/front/dataset/call_button',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                method: data.method,
                args: data.args,
            }
        }
    })
}


export function callFields(data) {
    return Request.post({
        url: '/front/dataset/fields_get',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                method: 'fields_get',
                args: data.args,
                kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true, supplier_id}}
            }
        }
    })
}

export function callKw(data) {
    data.kwargs = {
        ...data.kwargs,
        'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true, supplier_id, ...data.kwargs?.context}
    }
    return Request.post({
        url: '/front/dataset/call_kw/',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                method: data.method,
                args: data.args,
                kwargs: data.kwargs
            }
        }
    })
}


export function callNames(data) {
    return callKw({
        model: data.model,
        method: 'name_search',
        args: data.args,
        kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true, supplier_id}}
    })
}

export function callOnchange(data) {
    return callKw({
        model: data.model,
        method: 'onchange',
        args: data.args,
        kwargs: data.kwargs || {}
    })
}


export function callRead(data) {
    return callKw({
        model: data.model,
        method: 'read',
        args: data.args,
        kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true, supplier_id}}
    })
}


export function callSearchRead(data) {
    return Request.post({
        url: '/front/dataset/search_read/',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                fields: data.fields,
                offset: data.offset,
                limit: data.limit,
                domain: data.domain,
                sort: data.sort
            }
        }
    })
}

export function callReadGroup(data) {
    return callKw({
        model: data.model,
        method: 'read_group',
        args: [],
        kwargs: {
            context:
                {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true, supplier_id},
            domain: data.domain,
            fields: data.fields,
            groupby: data.groupby,
            lazy: true,
            orderby: data.order_by || 'id desc'
        }
    })
}

export function callFile(data) {
    window.open('/front/report/' + data.converter.split('-')[1] + '/' + data.reportname + '/' + data.docids, '_blank')
}

export const callMethod = async (params) => {   // 处理非创建和编辑按钮点击
    await callKw({
        model: params.model,
        method: params.method,
        args: params.args
    }).then(async result => {
        if (!!result.report_file) {  // 如果是文件，请求下载
            await callFile({
                reportname: result.report_file,
                docids: result?.context?.active_ids,
                converter: result.report_type,
                name: result.name
            },)
        }
    })
}

export function callWrite(params, data) {
    return callKw({
        model: params.model,
        method: 'write',
        args: [params.id, data]
    })
}

export function callCreate(params, data) {
    return callKw({
        model: params.model,
        method: 'create',
        args: [data]
    })
}

const compact = (array) => {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
        var value = array[index];
        if (value) {
            result[resIndex++] = value;
        }
    }
    return result;
}

const xml_to_json = (node, strip_whitespace) => {
    switch (node.nodeType) {
        case 9:
            return xml_to_json(node.documentElement, strip_whitespace);
        case 3:
        case 4:
            return (strip_whitespace && node.data.trim() === '') ? undefined : node.data;
        case 1:
            var attrs = {};

            var attributes = node.attributes;
            for (var i = 0, l = attributes.length; i < l; i++) {
                var attr = attributes.item(i);
                attrs[attr.name] = attr.value;
            }

            for (const key of ['domain', 'filter_domain', 'context', 'default_get']) {
                if (attrs[key]) {
                    try {
                        attrs[key] = JSON.parse(attrs[key]);
                    } catch (e) {
                    }
                }
            }
            const nodeArray = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                nodeArray[i] = xml_to_json(node.childNodes[i], strip_whitespace);
            }
            return {
                tag: node.tagName.toLowerCase(),
                attrs: attrs,
                children: compact(nodeArray),
            };
    }
}

export const callViews = (model, views) => {
    return callKw({
        model: model,
        method: 'load_views',
        kwargs: {
            options: {
                toolbar: true,
                load_filters: true
            },
            views: views,
            context: {}
        },
        args: []
    }).then(result => {
        const fvs = [];
        const fieldsViews = result.fields_views;
        for (const fieldsViewName of Object.keys(fieldsViews)) {
            const fieldsView = fieldsViews[fieldsViewName];
            var fv = {...fieldsView};
            var parsedXML = new DOMParser().parseFromString(fieldsView.arch, "text/xml");
            var doc = parsedXML.documentElement
            var stripWhitespaces = doc.nodeName.toLowerCase() !== 'kanban';
            fv.arch = xml_to_json(doc, stripWhitespaces);
            fv.viewFields = {...fv.viewFields, ...fv.fields};
            fvs.push(fv)
        }
        return fvs
    })
}

export const callAction = (action_id) => {
    return Request.post({
        url: '/front/action/load',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                action_id: action_id,
            }
        }
    })
}

export const loadMenus = (parent_id) => {
    return callKw({
        model: 'ir.ui.menu',
        method: 'load_menus',
        args: [parent_id || false],
        kwargs: {
            context: {
                front: true
            }
        }
    })
}


export const callParseDomain = (domain) => {
    return Request.post({
        url: '/front/dataset/parse_domain',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                domain,
            }
        }
    })
}