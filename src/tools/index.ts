import {callFields, callNames, callOnchange, callParseDomain} from "../service/module/call";
import {ElMessage} from "element-plus";
import {initTreeData} from "./init";
import axios from "axios";
import mitt from "mitt";

const eventBus = mitt()

const appElement = document.getElementById('app');
const supplier_id = parseInt(appElement.dataset['supplier_id'] || 0)


const buildOnchangeSpecs = function (fieldsInfo, treeOption, fields) {
    var specs = {};
    generateSpecs(fieldsInfo, fields);

    // recursively generates the onchange specs for fields in fieldsInfo,
    // and their subviews
    function generateSpecs(fieldsInfo, fields, prefix) {
        prefix = prefix || '';
        for (const name of fields) {
            var field = fieldsInfo[name];
            var key = prefix + name;
            specs[key] = (field.on_change) || "";
            if ((treeOption || {})[name]) {
                generateSpecs(treeOption[name], Object.keys(treeOption[name] || {}), key + '.');
            }
        }
    }

    return specs;
}

const onchangeField = async (params: OnchangeParamsType, checkAll) => {
    let options = params.options;
    let field = params.field;
    let treeField = params.treeField;
    if (!!options[field].on_change) {
        let attributes = params.attributes
        let treeOptions = params.treeOptions;
        let datas = params.datas
        let treeData = params.treeData;
        let formOptions = params.formOptions;
        let treeDataCopy = JSON.parse(JSON.stringify(treeData || {}))
        let paramsDatas = JSON.parse(JSON.stringify(datas))
        if (!treeField) {
            for (const treeField of Object.keys(treeDataCopy || {})) {
                paramsDatas[treeField] = []
                for (const data of treeDataCopy[treeField]) {
                    for (const field of Object.keys(data || {})) {
                        if (field === 'id') continue
                        if (treeOptions[treeField][field]?.type === 'many2one') {
                            data[field] = (data[field] || [])[0]
                        }
                    }
                    const dataId = data.id;
                    if (dataId) {
                        delete data['id'];  // 更新数据时，不能传id
                        paramsDatas[treeField].push([1, dataId, data]);
                    } else {
                        paramsDatas[treeField].push([0, 0, data])
                    }
                }
            }
        }
        let onchangeSpecs: { [prop: string]: '' | '1' };
        let changedData: { [prop: string]: Multiple } = {}
        for (let field of Object.keys(paramsDatas || {})) {
            if (field === 'id') continue;
            if (!Object.keys(options || {}).includes(field)) continue;
            changedData[field] = paramsDatas[field];
            if (options[field].type === 'many2one') {
                changedData[field] = (paramsDatas[field] || [false])[0];
            } else if (treeData[field]?.length) {
                changedData[field] = paramsDatas[field]
            }
        }
        if (!!treeField.length) {
            changedData[formOptions[treeField].relation_field] = datas
        }
        onchangeSpecs = buildOnchangeSpecs(options, treeOptions, Object.keys(options || {}))
        const model = params.model;
        let request: RequestParamsType = {
            model: model,
            method: 'onchange',
            args: [[datas.id || 0], changedData, field, onchangeSpecs, {
                'lang': 'zh_CN',
                'tz': false,
                'uid': 1,
                front: true,
                supplier_id
            }],
            path: model + '/onchange'
        }
        const result = await callOnchange(request)
        const domain = result.domain;
        const value = result.value;
        if (result.warning) {
            ElMessage({
                message: result.warning.message,
                type: 'error'
            });
        }
        if (result.max) {
            for (const field of Object.keys(result.max)) {
                options[field].max = result.max[field];
            }
        }
        for (let changedField of Object.keys(domain || {})) {
            options[changedField].domain = (attributes[changedField]?.domain || []).concat(domain[changedField]);
            options[changedField].selection = [];
            if (datas[changedField] instanceof Array) {
                datas[changedField] = [];
                checkAll.value = false;
                continue
            }
            datas[changedField] = '';
        }
        for (let changedField of Object.keys(value || {})) {
            if (options[changedField].type !== 'boolean' && !value) {  // 处理抬头或某一行数据
                datas[changedField] = '';
                if (['float', 'integer'].indexOf(options[changedField].type) !== -1) {
                    datas[changedField] = 0;
                }
            } else if (Object.keys(treeData || {}).includes(changedField)) {  // 除以一对多，多对多
                const changeLines = [];
                datas[changedField] = [];
                const newLines = value[changedField];
                for (let index = 1; index < newLines.length; index++) {
                    newLines[index][2].id = newLines[index][1] || 0;
                    changeLines.push(newLines[index][2]);
                    for (const field of Object.keys(newLines[index][2])) {
                        if (field === 'id') continue;
                        const value = newLines[index][2][field];
                        if (!value && ['float', 'integer'].includes(treeOptions[changedField][field].type)) {
                            newLines[index][2][field] = 0;
                        } else if (!value && treeOptions[changedField][field].type !== 'boolean') {
                            newLines[index][2][field] = '';
                        }
                        params.field = field;
                        params.treeField = changedField;
                        params.index = index - 1;
                        params.options = treeOptions[changedField];
                        params.datas = newLines[index][2];
                        eventBus.emit('fieldOnchange', params);
                    }
                }
                treeData[changedField] = changeLines;
                initTreeData({}, treeData, treeOptions, datas);
                continue
            } else {
                datas[changedField] = value[changedField];  // 其他字段
            }
            params.field = changedField;
            params.treeField = treeField;
            params.options = treeField ? treeOptions[treeField] : formOptions;
            params.datas = datas;
            eventBus.emit('fieldOnchange', params);
        }
    }
    if (!!treeField.length && params.formOptions[treeField].on_change) {
        params.field = treeField
        params.treeField = ''
        params.model = params.formModel;
        params.datas = params.formData;
        params.options = params.formOptions;
        onchangeField(params)
    }
}

const selectionMap = {}
const searchFieldSelection = async (field, option: FieldOptionType, query: string, domain = [], limit, datas) => {
    let selection = [];
    let domains = [];
    if (!!option.domain?.length) {
        domains = JSON.parse(JSON.stringify(await callParseDomain(option?.domain) || []))
    }
    for (const domain of domains || []) {
        if (typeof domain[2] === 'string') {
            let self_value = domain[2].split('.');
            if (self_value.length < 2) continue;
            for (const valField of self_value) {
                if (valField === 'self') {
                    domain[2] = datas
                } else {
                    domain[2] = domain[2] ? domain[2][valField] || false : false
                }
            }
        }
    }
    const searchDomain = domain.length ? domain : domains.concat(domain) || []
    const searchUnique = field + query + searchDomain;
    if (selectionMap[searchUnique]?.length) {
        return selectionMap[searchUnique];
    }
    const result = await callNames({
        model: option.relation,
        args: [],
        kwargs: {
            'name': query.trim(),
            'args': searchDomain,
            'operator': 'ilike',
            'limit': limit || 10,
        }
    })
    if (selection?.length && ['many2many', 'one2many'].includes(option.type)) {
        const sameSelectId = [];
        const sameSelect = [];
        for (const select of (result || []).concat(selection)) {
            if (!sameSelectId.includes(select[0])) {
                sameSelectId.push(select[0])
                sameSelect.push(select)
            }
        }
        selection = sameSelect
    } else {
        selection = result || [];
    }
    selectionMap[searchUnique] = selection;
    return selection;
}

//  文件处理
const contentTypeMap: Map<string, string> = new Map([
    ['.html', 'text/html'],
    ['.css', 'text/css'],
    ['.js', 'application/javascript'],
    ['.json', 'application/json'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.gif', 'image/gif'],
    ['.bmp', 'image/bmp'],
    ['.svg', 'image/svg+xml'],
    ['.ico', 'image/x-icon'],
    ['.pdf', 'application/pdf'],
    ['.mp3', 'audio/mpeg'],
    ['.wav', 'audio/wav'],
    ['.mp4', 'video/mp4'],
    ['.zip', 'application/zip'],
    ['.rar', 'application/x-rar-compressed'],
    ['.exe', 'application/x-msdownload'],
    ['.cab', 'application/vnd.ms-cab-compressed'],
    ['.ttf', 'font/ttf'],
    ['.otf', 'font/otf'],
    ['.doc', 'application/msword'],
    ['.xls', 'application/vnd.ms-excel'],
    ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
]);
const getFileType = (filename: string): string | undefined => {
    const extension = '.' + filename.split('.').pop();
    return contentTypeMap.get(extension.toLowerCase());
};
const base64ToBlobUrl = (base64: string, filename: string): Promise<string> => {
    if (!base64.length) {
        throw new Error('The base64 string is empty.');
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const binary = new Uint8Array(arrayBuffer);
            const fileType = getFileType(filename);
            const blob = new Blob([binary], {type: fileType});
            const url = URL.createObjectURL(blob);
            resolve(url);
        };
        reader.onerror = (event) => {
            reject(event.target?.error);
        };
        const byteArray = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
        reader.readAsArrayBuffer(new Blob([byteArray]));
    });
};
const downLoadFile = (base64File: string, filename: string) => async () => {
    if (base64File.length) {
        try {
            // 获取 Blob URL
            const href = await base64ToBlobUrl(base64File, filename);
            // 创建下载链接
            const downloadElement = document.createElement('a');
            downloadElement.href = href;
            downloadElement.download = filename; //下载后文件名
            document.body.appendChild(downloadElement);
            downloadElement.click(); //点击下载
            document.body.removeChild(downloadElement); //下载完成移除元素
            URL.revokeObjectURL(href); //释放掉blob对象
        } catch (e) {
            console.error(e);
        }
    }
};
const encodeFileToBase64 = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = function (error) {
            reject(error);
        };
    });
}

// 解析domain
const getDomainVal = (domains, data) => {
    let domainsCopy = JSON.parse(JSON.stringify(domains))
    for (let index = 0; index < domainsCopy.length; index++) {
        let domain = domainsCopy[index]
        if (domain.length === 3) {
            const field = domain[0];
            const operator = domain[1];
            const value = domain[2];
            let fieldVal = data[field]
            if (field.includes('.')) {
                const fields = field.split('.');
                let value = data
                for (let field of fields) {
                    if (!isNaN(field)) {
                        field = parseInt(field)
                    }
                    value = value[field];
                }
                fieldVal = value;
            }
            let expr = '';
            switch (operator) {
                case '=':
                    expr = fieldVal == value;
                    break;
                case '!=':
                    expr = fieldVal != value;
                    break;
                case '>':
                    expr = fieldVal > value;
                    break;
                case '>=':
                    expr = fieldVal >= value;
                    break;
                case '<':
                    expr = fieldVal < value;
                    break;
                case '<=':
                    expr = fieldVal <= value;
                    break;
                case 'in':
                    expr = Array.isArray(value) && value.includes(fieldVal);
                    break;
                case 'not in':
                    expr = Array.isArray(value) && !value.includes(fieldVal);
                    break;
                case 'ilike':
                    expr = fieldVal.toString().toLowerCase().includes(value.toLowerCase());
                    break;
                case 'child_of':
                    expr = fieldVal.some(id => id === value || data[id] && fieldVal.includes(data[id].parent_id));
                    break;
            }
            domainsCopy[index] = expr
        }
    }
    return domainsCopy
}
const parseDomain = (domains, data) => {
    if (!(domains instanceof Array && domains.length
        && (['|', '&'].indexOf(domains[0]) !== -1 || domains[0].length === 3))) return domains
    let domainStack = getDomainVal(domains, data);
    const length = domainStack.length
    for (let index = length - 1; index >= 0; index--) {
        let domain = domainStack[index];
        if (domain === '|') {
            if (typeof domainStack[index + 1] !== 'undefined' && typeof domainStack[index + 2] !== 'undefined') {
                domain = domainStack[index + 1] || domainStack[index + 2];
                domainStack.splice(index + 1, 1);
                domainStack.splice(index + 1, 1);
                domainStack[index] = domain
            } else {
                throw Error('domain不合法!')
            }
        }
        if (domain === '&') {
            if (typeof domainStack[index + 1] !== 'undefined' && typeof domainStack[index + 2] !== 'undefined') {
                domain = domainStack[index + 1] && domainStack[index + 2];
                domainStack.splice(index + 1, 1);
                domainStack.splice(index + 1, 1);
                domainStack[index] = domain
            } else {
                throw Error('domain不合法!')
            }
        }
    }
    return domainStack.every(item => Boolean(item));
}


const dateFtt = (fmt, date) => {
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        S: date.getMilliseconds(), //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(
            RegExp.$1,
            (date.getFullYear() + "").substr(4 - RegExp.$1.length)
        );
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length == 1
                    ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length)
            );
    return fmt;
}


const getDateTypeValue = (type) => {
    let date = new Date();
    let startDate = ''
    let endDate = ''
    // 今天
    if (type == 'today') {
        startDate = date
        endDate = startDate;
    } else if (type == 'yesterday') {
        // 昨天
        date.setDate(date.getDate() - 1);
        startDate = date
        endDate = startDate;
    } else if (type == 'last_3_days') {
        // 近三天
        endDate = new Date();
        date.setDate(date.getDate() - 2);
        startDate = date
    } else if (type == 'this_week') {
        // 本周
        const week = date.getDay()
        //一天的毫秒数
        const millisecond = 1000 * 60 * 60 * 24
        //减去的天数
        const minusDay = week != 0 ? week - 1 : 6
        //本周 周一
        startDate = new Date(date.getTime() - minusDay * millisecond)
        //本周 周日
        endDate = new Date(date.getTime() + (7 - minusDay - 1) * millisecond)

    } else if (type == 'last_week') {
        // 上周
        let weekNum = date.getDay()
        weekNum = weekNum == 0 ? 7 : weekNum
        endDate = new Date(date.getTime() - weekNum * 24 * 60 * 60 * 1000)
        startDate = new Date(date.getTime() - (weekNum + 6) * 24 * 60 * 60 * 1000)
    } else if (type == 'last_7_days') {
        // 近7天
        endDate = new Date()
        date.setDate(date.getDate() - 6);
        startDate = date
    } else if (type == 'last_14_days') {
        // 近14天
        endDate = new Date()
        date.setDate(date.getDate() - 13);
        startDate = date
    } else if (type == 'last_30_days') {
        // 近30天
        endDate = new Date()
        date.setDate(date.getDate() - 30);
        startDate = date
    } else if (type == 'last_365_days') {
        // 近365
        endDate = new Date()
        date.setDate(date.getDate() - 365);
        startDate = date
    } else if (type == 'this_month') {
        // 本月
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    } else if (type == 'last_month') {
        // 上月
        endDate = new Date(date.getFullYear(), date.getMonth(), 0)
        startDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)

    } else if (type == 'this_quarter') {
        // 本季
        let month = date.getMonth() + 1;//getMonth返回0-11
        let year = date.getFullYear();
        if (month >= 1 && month <= 3) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 3, 0);
        } else if (month >= 4 && month <= 6) {
            startDate = new Date(year, 3, 1);
            endDate = new Date(year, 6, 0);
        } else if (month >= 7 && month <= 9) {
            startDate = new Date(year, 6, 1);
            endDate = new Date(year, 9, 0);
        } else {
            startDate = new Date(year, 9, 1);
            endDate = new Date(year, 12, 0);
        }
    } else if (type == 'last_quarter') {
        // 上季
        let month = date.getMonth() + 1;//getMonth返回0-11
        let year = date.getFullYear();
        if (month >= 1 && month <= 3) {
            startDate = new Date(year - 1, 9, 1);
            endDate = new Date(year - 1, 12, 0);
        } else if (month >= 4 && month <= 6) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 3, 0);
        } else if (month >= 7 && month <= 9) {
            startDate = new Date(year, 3, 1);
            endDate = new Date(year, 6, 0);
        } else {
            startDate = new Date(year, 6, 1);
            endDate = new Date(year, 9, 0);
        }
    } else if (type == 'this_year') {
        // 本年
        let year = date.getFullYear();
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 12, 0);
    } else if (type == 'last_year') {
        // 上年
        let year = date.getFullYear();
        startDate = new Date(year - 1, 0, 1);
        endDate = new Date(year - 1, 12, 0);
    }
    return [startDate, endDate]
}


const downLoadFileBold = async (bold, filename, fileType) => {
    const blob = new Blob([bold])
    const downloadElement = document.createElement('a');
    const href = window.URL.createObjectURL(blob); //创建下载的链接
    downloadElement.href = href;
    downloadElement.download = filename + '.' + fileType; //下载后文件名
    document.body.appendChild(downloadElement);
    await downloadElement.click(); //点击下载
    document.body.removeChild(downloadElement); //下载完成移除元素
    window.URL.revokeObjectURL(href); //释放掉blob对象
}

const loadActiveAction = (menu) => {
    if (!!menu.action) {
        const action = menu.action.split(',');
        return action[1];
    } else if (menu.children.length) {
        loadActiveAction(menu.children[0]);
    }
}

const jsonifyStr = (str) => {
    if (!str) {
        return 'false'
    }
    return str.replaceAll("'", '"').replaceAll("(", '[').replaceAll(")", ']').replaceAll("False", 'false').replaceAll("True", 'true');
}

const parseElementToJSON = (element) => {
    const obj = {};
    // 处理元素节点
    if (element.nodeType === Node.ELEMENT_NODE) {
        obj.tag = element.nodeName;
        obj.attrs = {};

        // 处理属性节点
        if (element.hasAttributes()) {
            for (let i = 0; i < element.attributes.length; i++) {
                const attribute = element.attributes[i];
                if (attribute.nodeName === 'name') {
                    obj.name = attribute.nodeValue;
                } else if (attribute.nodeName === 'model') {
                    obj.model = attribute.nodeValue;
                } else if (attribute.nodeName === 'attrs') {
                    const attrsObj = JSON.parse(jsonifyStr(attribute.nodeValue));
                    obj.attrs = {...obj.attrs, ...attrsObj};
                } else {
                    obj.attrs[attribute.nodeName] = attribute.nodeValue;
                }
            }
        }

        // 处理子节点
        obj.children = [];
        if (element.hasChildNodes()) {
            for (let childNode of element.childNodes) {
                if (childNode.nodeType === Node.ELEMENT_NODE) {
                    const childElement = parseElementToJSON(childNode);
                    obj.children.push(childElement);
                } else if (childNode.nodeType === Node.TEXT_NODE) {
                    const text = childNode.nodeValue.trim();
                    if (text.length) {
                        obj.text = childNode.nodeValue.trim();
                    }
                }
            }
        }
    }
    return obj;
}

const readFile = async (filePath) => {
    const doc = await axios.get('src/xml_views/' + filePath)
    var parsedXML = new DOMParser().parseFromString(doc.data, "text/xml");
    const jsonXml = parseElementToJSON(parsedXML.documentElement);
    return jsonXml.children.map(child => {
        if (child.tag === "record") {
            const {children: recordChildren} = child;
            const nameField = recordChildren.find(c => c.name === "name");
            const modelField = recordChildren.find(c => c.name === "model");
            const archField = recordChildren.find(c => c.name === "arch");
            const res_modelField = recordChildren.find(c => c.name === "res_model");
            const view_modeField = recordChildren.find(c => c.name === "view_mode");
            const contextField = recordChildren.find(c => c.name === "context");
            const domainField = recordChildren.find(c => c.name === "domain");
            child.model = modelField?.text || res_modelField?.text.trim();
            child.name = nameField?.text || '';
            child.children = archField?.children || [];
            child.view_mode = view_modeField?.text.trim() || 'list,form';
            child.context = JSON.parse(jsonifyStr(contextField?.text.trim())) || {};
            child.domain = JSON.parse(jsonifyStr(domainField?.text.trim())) || [];
            child.view_type = child.children[0]?.tag || 'action';
        }
        return child;
    });
}

const formatArch = (archRoot) => {
    if (archRoot.attrs?.modifiers) {
        archRoot.attrs = {
            ...archRoot.attrs,
            ...JSON.parse(archRoot.attrs.modifiers),
            name: archRoot.attrs.name || archRoot.name,
        }
        delete archRoot.attrs.modifiers
        delete archRoot.attrs.attrs
    }
    if (['tree', 'form'].includes(archRoot.tag)) {
        archRoot.attrs.create = JSON.parse(archRoot.attrs.create || 'false');
        archRoot.attrs.edit = JSON.parse(archRoot.attrs.edit || 'false');
        archRoot.attrs.delete = JSON.parse(archRoot.attrs.delete || 'false');
        archRoot.attrs.import = JSON.parse(archRoot.attrs.import || 'false');
    }
    if (archRoot.children?.length) {
        for (const children of archRoot.children) {
            formatArch(children)
        }
    }
}

const parseXMlToJson = (xml_data) => {
    var parsedXML = new DOMParser().parseFromString(xml_data, "text/xml");
    const arch = parseElementToJSON(parsedXML.documentElement);
    formatArch(arch)
    return arch;
}


const generateFormArch = (fields, tables) => {
    const group = {
        tag: 'group',
        attrs: {},
        children: []
    }
    const header = {
        tag: 'header',
        attrs: {},
        children: [{
            tag:'button',
            attrs:{states:'隐藏该按钮'},
        }]
    }
    if (fields.includes('state')) {
        header.children.push({
            tag: 'field',
            attrs: {name: 'state'},
            children: []
        })
    }
    const arch = {
        tag: 'form',
        attrs: {},
        children: [header, group]
    };

    function generate(arch, fields, tables) {
        if (fields.length) {
            for (const field of fields) {
                if (Object.keys(tables || {}).includes(field)) continue;
                if (field === 'state') continue;
                arch.children.push({
                    tag: 'field',
                    attrs: {name: field},
                    children: []
                })
            }
        }
        if (Object.keys(tables || {}).length) {
            const notebook = {
                tag: 'notebook',
                attrs: {},
                children: []
            }
            for (const treeField of Object.keys(tables || {})) {
                notebook.children.push({
                    tag: 'page',
                    attrs: {string: tables[treeField].title || ''},
                    children: [{
                        tag: 'field',
                        attrs: {name: treeField},
                        children: [{
                            tag: 'tree',
                            attrs: {},
                            children: generateTreeArch(tables[treeField].fields)
                        }]
                    }]
                })
            }
            arch.children.push(notebook)
        }
    }

    generate(group, fields, tables)
    return arch
}

const generateTreeArch = (fields) => {
    const arch = {
        tag: 'tree',
        attrs: {},
        children: []
    };
    if (fields.length) {
        for (const field of fields) {
            arch.children.push({
                tag: 'field',
                attrs: {name: field},
                children: []
            })
        }
    }
    return arch
}

export const generateFormView = async (params) => {
    const options = await callFields({
        model: params.model,
        args: [0, params.fields.concat(Object.keys(params.tables || {}))]
    })
    for (const treeField of Object.keys(params.tables || {})) {
        !options[treeField].views ? options[treeField].views = {} : null;
        options[treeField].views.form = await generateFormView(params.tables[treeField])
        options[treeField].views.tree = await generateTreeView(params.tables[treeField])
    }

    return {
        viewFields: options,
        fields: options,
        res_model: params.model,
        base_model: params.model,
        arch: generateFormArch(params.fields, params.tables)
    }
}


export const generateTreeView = async (params) => {
    const options = await callFields({
        model: params.model,
        args: [0, params.fields.concat(Object.keys(params.tables || {}))]
    })
    return {
        viewFields: options,
        fields: options,
        res_model: params.model,
        base_model: params.model,
        arch: await generateTreeArch(params.fields, params.tables)
    }
}


export const generateViews = async (params) => {
    const formViewInfo = await generateFormView(params);
    const treeViewInfo = await generateTreeView(params);
    return {
        formViewInfo,
        treeViewInfo
    }
}

export {
    searchFieldSelection, onchangeField, getDateTypeValue,
    getFileType, loadFormData, dateFtt, downLoadFileBold,
    base64ToBlobUrl, loadListData, readFile, parseXMlToJson,
    downLoadFile, getFieldOption, formatArch,
    encodeFileToBase64, eventBus,
    parseDomain, loadActiveAction
}


