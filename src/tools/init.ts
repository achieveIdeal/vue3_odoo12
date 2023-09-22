import {useTypeStore} from "../store";

const typeStore = useTypeStore();
const isBool = typeStore.isBool;


export const setFormAttribute = (extras, formFieldsOption) => {
    if (!!Object.keys(formFieldsOption || {}).length) {
        let attributes = extras?.attributes || {};
        for (const field of Object.keys(formFieldsOption || {})) {  // 自定义属性 readonly 和invisible等
            if (['readonly', 'invisible', 'listInvisible', 'required'].indexOf(field) !== -1) continue;
            formFieldsOption[field]['readonly'] = (extras?.readonly || []).indexOf(field) !== -1 || extras?.readonly === '_all_' || formFieldsOption[field]['readonly'];
            formFieldsOption[field]['invisible'] = (extras?.invisible || []).indexOf(field) !== -1 || extras?.invisible === '_all_' || formFieldsOption[field]['invisible'];
            formFieldsOption[field]['listInvisible'] = (extras?.listInvisible || []).indexOf(field) !== -1 || extras?.listInvisible === '_all_' || formFieldsOption[field]['listInvisible'];
            formFieldsOption[field]['required'] = (extras?.required || []).indexOf(field) !== -1 || extras?.required === '_all_' || formFieldsOption[field]['required'];
            formFieldsOption[field]['sort'] = (extras?.sort || []).indexOf(field) !== -1 || extras?.sort === '_all_' || formFieldsOption[field]['sort'];
            let extraOptions = attributes[field];
            for (const attribute of Object.keys(extraOptions || {})) {
                if (attribute === 'fields') continue;
                formFieldsOption[field][attribute] = extraOptions[attribute];
            }
        }
    }
}
export const setTreeAttribute = (treeField, extras, treeFieldsOption) => {
    let attributes = extras.attributes && extras.attributes[treeField] ? extras.attributes[treeField]?.fields : {};
    if (!attributes) return
    for (const field of Object.keys(treeFieldsOption[treeField] || {})) { // 设置自定义的属性
        treeFieldsOption[treeField][field]['invisible'] = (attributes.invisible || []).indexOf(field) !== -1 || attributes.invisible === '_all_' || treeFieldsOption[treeField][field]['invisible'];
        treeFieldsOption[treeField][field]['readonly'] = (attributes.readonly || []).indexOf(field) !== -1 || attributes.readonly === '_all_' || treeFieldsOption[treeField][field]['readonly'];
        treeFieldsOption[treeField][field]['required'] = (attributes.required || []).indexOf(field) !== -1 || attributes.required === '_all_' || treeFieldsOption[treeField][field]['required'];
        let extraOptions = attributes[field];
        for (const attribute of Object.keys(extraOptions || {})) {
            treeFieldsOption[treeField][field][attribute] = extraOptions[attribute];
        }
    }
}

export const initFormData = (formData, formFieldsOption) => {
    for (let field of formData ? Object.keys(formFieldsOption || {}) : []) {   // 初始化下拉选项值
        let value = formData[field];
        if (!isBool(formFieldsOption[field]?.type) && !value) {
            formData[field] = 0;
        }
    }
    return formData
}
export const initTreeData = async (treeData, treeFieldsOption) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {
        !treeData[treeField] ? treeData[treeField] = [] : null;
        let lineDatas = treeData[treeField] || [];
        for (let lineData of !!lineDatas.length ? lineDatas : []) {
            for (let field of Object.keys(lineData || {})) {
                let value = lineData[field];
                if (isBool(treeFieldsOption[treeField][field]?.type) && !value) {
                    lineData[field] = 0
                }
            }
        }
    }
    return treeData
}
export const initListData = async (listData, fieldsOption) => {
    for (let lineData of listData && listData.length ? listData : []) {
        for (let field of Object.keys(fieldsOption || {})) {
            let value = lineData[field];
            if (!isBool(fieldsOption[field]?.type) && !value) {
                lineData[field] = 0
            }
        }
    }
    return listData
}

export const initSearchBar = (extras, fieldsOption) => {
    let searchOptions = {}
    for (let field of Object.keys(extras.search_fields || {}).concat(extras.groupby || [])) {
        searchOptions[field] = {
            ...fieldsOption[field],
        }
        for (const attribute of Object.keys(extras.search_fields[field] || {})) {
            searchOptions[field][attribute] = extras.search_fields[field][attribute];
        }
    }
    return searchOptions
}

export const initButton = (extras, viewType) => {
    let buttons = JSON.parse(JSON.stringify(extras.buttons || []));
    for (const button of buttons) {
        for (const attribute of Object.keys(button.attributes || {})) {
            button.attributes[attribute] = button.attributes[attribute]
        }
        if (!!button.needRow && viewType === 'list') {
            button.attributes.invisible = true;
        }
    }
    return buttons;
}

export const data2OdooFormat = (data) => {
    const formatData = {};
    for (const field of Object.keys(data || {})) {
        if (data[field] instanceof Array) {
            data[field] = data[field].filter(r => !!r);
        }
        if (data[field] instanceof Array && (typeof data[field][0]) !== 'object') {
            formatData[field] = [[6, 0, data[field]]]
        } else if (data[field] instanceof Array && (typeof data[field][0]) === 'object' && !Array.isArray(data[field][0])) {
            formatData[field] = [];
            for (const line of data[field]) {
                if (line[0] === 2) {
                    formatData[field].push(data[field])
                } else if (line.id) {
                    const lineCopy = JSON.parse(JSON.stringify(line))
                    delete lineCopy.id
                    formatData[field].push([
                        1, line.id, lineCopy
                    ])
                } else {
                    formatData[field].push([
                        0, 0, line
                    ])
                }
            }
        } else {
            formatData[field] = data[field];
        }
    }
    for (const field of Object.keys(data['deleteFieldMap'] || {})) {
        !formatData[field] ? formatData[field] = [] : null;
        formatData[field] = formatData[field].concat(data['deleteFieldMap'][field])
    }
    return formatData
}
