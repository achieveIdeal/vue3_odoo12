import {parseDomain} from "../tools";
import {useTypeStore} from "../store";
import {searchFieldSelection} from './index'

const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const is2Many = typeStore.is2Many;


export const setFormAttribute = (formData, formFieldsOption, extras) => {
    if (!!Object.keys(formFieldsOption || {}).length) {
        let attributes = extras?.attributes;
        for (const field of Object.keys(formFieldsOption || {})) {  // 自定义属性 readonly 和invisible等
            formFieldsOption[field]['readonly'] = (extras.readonly || []).indexOf(field) !== -1;
            formFieldsOption[field]['invisible'] = (extras.invisible || []).indexOf(field) !== -1;
            formFieldsOption[field]['required'] = (extras.required || []).indexOf(field) !== -1;
            let extraOptions = attributes[field];
            for (const attribute of Object.keys(extraOptions || {})) {
                if (attribute === 'fields') continue;
                if (['boolean', 'number', 'string'].indexOf(typeof extraOptions[attribute]) !== -1 || attribute === 'domain') {
                    formFieldsOption[field][attribute] = extraOptions[attribute];
                    continue
                }
                formFieldsOption[field][attribute] = parseDomain(extraOptions[attribute], formData);
            }
        }
    }
}
export const initFormData = async (extras, formData, formFieldsOption, noloadField) => {
    for (let field of formData ? Object.keys(formData || {}) : []) {   // 初始化下拉选项值
        let value = formData[field]
        if (formFieldsOption[field]?.type !== 'boolean' && !value) {
            formData[field] = ''
        } else if (typeof formFieldsOption[field]?.type === 'number' && !value) {
            formData[field] = 0
            continue
        }
        if (noloadField.indexOf(field) !== -1 || !(value instanceof Array) || formFieldsOption[field]?.type === 'boolean') {
            continue;
        }
        if (is2Many(formFieldsOption[field].type)) {
            await searchFieldSelection(formFieldsOption[field], '', [['id', 'in', formData[field]]])
        }
        !formFieldsOption[field].selection ? formFieldsOption[field].selection = [] : null;
        let sameFlag = false
        if (formFieldsOption[field].type === 'many2one') {  // 保证选项唯一
            for (let i of formFieldsOption[field].selection) {
                if (i[0] === value[0] && i[1] === value[1]) {
                    sameFlag = true;
                }
            }
            if (!sameFlag && value) {
                formFieldsOption[field].selection.push(value)
            }
            formData[field] = value[0]
        }
    }
    setFormAttribute(formData, formFieldsOption, extras);
    return {formFieldsOption, formData}
}
export const setTreeAttribute = (lineData, formData, treeFieldsOption, extras) => {
    let attributes = extras.attributes ? extras.attributes[treeField]?.fields : {};
    for (const field of Object.keys(treeFieldsOption[treeField] || {})) { // 设置自定义的属性
        treeFieldsOption[treeField][field]['readonly'] = (attributes.readonly || []).indexOf(field) !== -1;
        treeFieldsOption[treeField][field]['invisible'] = (attributes.invisible || []).indexOf(field) !== -1;
        treeFieldsOption[treeField][field]['required'] = (attributes.required || []).indexOf(field) !== -1;
        let extraOptions = attributes[field];
        for (const attribute of Object.keys(extraOptions || {})) {
            if (['boolean', 'number', 'string'].indexOf(typeof extraOptions[attribute]) !== -1 || attribute === 'domain') {
                treeFieldsOption[treeField][field][attribute] = extraOptions[attribute];
                continue
            }
            treeFieldsOption[treeField][field][attribute] = parseDomain(extraOptions[attribute], {treeField: lineData, ...formData})
        }
    }
}
export const initTreeData = async (extras, treeData, treeFieldsOption, formData) => {
    for (let treeField of Object.keys(treeData || {})) {
        let lineDatas = treeData[treeField]
        for (let lineData of !!lineDatas.length ? lineDatas : []) {
            for (let field of Object.keys(lineData || {})) {
                let value = lineData[field]
                if (fieldTypeMap[treeFieldsOption[treeField][field]?.type] === 'number' && !value) {
                    lineData[field] = 0
                    continue
                } else if (treeFieldsOption[treeField][field]?.type !== 'boolean' && !value) {
                    lineData[field] = ''
                }
                if (field === 'id' || !(value instanceof Array) || treeFieldsOption[treeField][field]?.type === 'boolean') {
                    continue;
                }
                let sameFlag = false
                if (treeFieldsOption[treeField][field].type === 'many2one') {
                    !treeFieldsOption[treeField][field]['curSelect'] ? treeFieldsOption[treeField][field]['curSelect'] = [] : null;
                    for (let i of treeFieldsOption[treeField][field]['curSelect']) {
                        if (i[0] === value[0] && i[1] === value[1]) {
                            sameFlag = true;
                        }
                    }
                    if (!sameFlag && value) {
                        treeFieldsOption[treeField][field]['curSelect'].push(value)
                    }
                    treeFieldsOption[treeField][field].selection = treeFieldsOption[treeField][field]['curSelect'];
                    lineData[field] = value[0]
                }
                if (is2Many(treeFieldsOption[treeField][field].type)) {
                    await searchFieldSelection(treeFieldsOption[treeField][field], '', [['id', 'in', lineDatas[field]]])
                }
            }
            setTreeAttribute(lineData, formData, treeFieldsOption, extras)
        }
    }
    return {treeData, treeFieldsOption}
}
export const initListData = async (extras, listDatas, fieldsOption) => {
    for (let lineData of listDatas && listDatas.length ? listDatas : []) {
        for (let field of Object.keys(lineData || {})) {
            let value = lineData[field]
            if (fieldsOption[field]?.type === 'selection') {
                value = fieldsOption[field].selection.find((val) => {
                    return val[0] === value
                })
            } else if (fieldsOption[field]?.type !== 'boolean' && !value) {
                lineData[field] = ''
                continue
            } else if (field === 'id' || !(value instanceof Array) || fieldsOption[field]?.type === 'boolean') {
                continue;
            }
            if (is2Many(fieldsOption[field].type)) {
                await searchFieldSelection(fieldsOption[field], '', [['id', 'in', lineData[field]]])
                lineData[field] = fieldsOption[field].selection.map(r => r[1]).join(',')
                continue
            }
            lineData[field] = value && value[1] || ''
        }
    }
    let searchOptions = {}
    for (let field of Object.keys(extras.search_fields || {})) {
        searchOptions[field] = {...fieldsOption[field], domain: extras.search_fields[field].domain}
    }
    return {listDatas, fieldsOption, searchOptions}
}
export const initButton = (extras, formData, viewType) => {
    let buttons = JSON.parse(JSON.stringify(extras.buttons || []));
    for (const button of buttons) {
        for (const attribute of Object.keys(button.attributes || {})) {
            if (['boolean', 'number', 'string'].indexOf(typeof button.attributes[attribute]) !== -1 || attribute === 'domain') {
                button.attributes[attribute] = button.attributes[attribute];
                continue;
            }
            button.attributes[attribute] = parseDomain(button.attributes[attribute], formData)
        }
        if (!!button.needRow && viewType==='list') {
            button.attributes.invisible = true;
        }
    }
    return buttons;
}
export const initEmptyTreeData = (emptyDatas, treeFieldsOption) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {  // 设置空数据
        emptyDatas[treeField] = {};
        for (let field of Object.keys(treeFieldsOption[treeField] || {})) {
            if (fieldTypeMap[treeFieldsOption[treeField][field]?.type] === 'number') {
                emptyDatas[treeField][field] = 0;
                continue
            }
            emptyDatas[treeField][field] = '';
        }
    }
}