import {parseDomain} from "../tools";
import {useTypeStore} from "../store";
import {searchFieldSelection} from './index'
import {ElMessage} from "element-plus";

const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const is2Many = typeStore.is2Many;


export const setFormAttribute = (formData, formFieldsOption, extras) => {
    if (!!Object.keys(formFieldsOption || {}).length) {
        let attributes = extras?.attributes || {};
        for (const field of Object.keys(formFieldsOption || {})) {  // 自定义属性 readonly 和invisible等
            if (['readonly', 'invisible', 'listInvisible', 'required'].indexOf(field) !== -1) continue
            formFieldsOption[field]['readonly'] = (extras?.readonly || []).indexOf(field) !== -1;
            formFieldsOption[field]['invisible'] = (extras?.invisible || []).indexOf(field) !== -1;
            formFieldsOption[field]['listInvisible'] = (extras?.listInvisible || []).indexOf(field) !== -1;
            formFieldsOption[field]['required'] = (extras?.required || []).indexOf(field) !== -1;
            let extraOptions = attributes[field];
            for (const attribute of Object.keys(extraOptions || {})) {
                if (attribute === 'fields') continue;
                formFieldsOption[field][attribute] = extraOptions[attribute];
            }
        }
    }
}
export const initFormData = async (extras, formData, formFieldsOption, noloadField) => {
    for (let field of formData ? Object.keys(formFieldsOption || {}) : []) {   // 初始化下拉选项值
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
            for (let i of formFieldsOption[field]?.selection) {
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
export const setTreeAttribute = (treeField, lineData, formData, treeFieldsOption, extras) => {
    let attributes = extras.attributes ? extras.attributes[treeField]?.fields : {};
    if (!attributes) return
    for (const field of Object.keys(treeFieldsOption[treeField] || {})) { // 设置自定义的属性
        treeFieldsOption[treeField][field]['readonly'] = (attributes.readonly || []).indexOf(field) !== -1;
        treeFieldsOption[treeField][field]['invisible'] = (attributes.invisible || []).indexOf(field) !== -1;
        treeFieldsOption[treeField][field]['required'] = (attributes.required || []).indexOf(field) !== -1;
        let extraOptions = attributes[field];
        for (const attribute of Object.keys(extraOptions || {})) {
            treeFieldsOption[treeField][field][attribute] = extraOptions[attribute];
        }
    }
}
export const initTreeData = async (extras, treeData, treeFieldsOption, formData) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {
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
            if (extras) {
                setTreeAttribute(treeField, lineData, formData, treeFieldsOption, extras)
                if (extras[treeField]) {
                    extras[treeField].buttons = initButton((extras[treeField] || {}), formData)
                }
            }
        }
    }
    return {treeData, treeFieldsOption}
}
export const initListData = async (extras, listData, fieldsOption, noloadField) => {
    for (let lineData of listData && listData.length ? listData : []) {
        for (let field of Object.keys(fieldsOption || {})) {
            let value = lineData[field]
            if (noloadField.indexOf(field) !== -1) {
                continue;
            }
            fieldsOption[field]['listInvisible'] = (extras.listInvisible || []).indexOf(field) !== -1;
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
    setFormAttribute({}, fieldsOption, extras);
    return {listData, fieldsOption}
}
export const initSearchBar = (extras, fieldsOption) => {
    let searchOptions = {}
    for (let field of Object.keys(extras.search_fields || {}).concat(extras.groupby)) {
        searchOptions[field] = {
            ...fieldsOption[field],
            domain: extras.search_fields[field]?.domain,
            default: extras.search_fields[field]?.default,
            limit: extras.search_fields[field]?.limit,
            noSelect: extras.search_fields[field]?.noSelect,
            multiple: extras.search_fields[field]?.multiple || false,
        }
        console.log(searchOptions[field],field);
        console.log(extras.search_fields[field]);
    }
    return searchOptions
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
        if (!!button.needRow && viewType === 'list') {
            button.attributes.invisible = true;
        }
    }
    return buttons;
}
export const initEmptyTreeData = (emptyData, treeFieldsOption) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {  // 设置空数据
        emptyData[treeField] = {};
        for (let field of Object.keys(treeFieldsOption[treeField] || {})) {
            if (fieldTypeMap[treeFieldsOption[treeField][field]?.type] === 'number') {
                emptyData[treeField][field] = 0;
                continue
            }
            emptyData[treeField][field] = '';
        }
    }
}

export const formatData = function (datas, dataCopy, options): Object {  // 数据修改和保存格式化处理 发送给后端
    let updated = {}
    for (let field of Object.keys(datas.formData || {})) {
        if (datas.formData[field] !== dataCopy.formData[field]) {
            updated[field] = datas.formData[field];
            if (datas.formData[field] instanceof Array) {
                updated[field] = [[6, 0, datas.formData[field]]];
            }
        }
    }
    for (const treeField of Object.keys(datas.treeData || {})) {
        let isChanged = false;
        let delFlag = {};
        let addFlag = false;
        let updatedLineCopy = JSON.parse(JSON.stringify(updated[treeField] || {}))
        updated[treeField] = []
        for (const treeCopyId of dataCopy.formData[treeField] || []) {
            if (updatedLineCopy.indexOf(treeCopyId) === -1 && !delFlag[treeCopyId]) {  //  处理删除行
                isChanged = true;
                delFlag[treeCopyId] = true;
                updated[treeField].push([2, treeCopyId, false]);
            }
        }
        for (const treeData of datas.treeData[treeField]) {
            let index = 0;
            let changedField = {};
            for (const field of Object.keys(treeData || {})) {  // 处理修改行， !dataCopy.treeData[treeField][index]: 为处理新增行
                if (field === 'id') continue;
                if (!dataCopy.treeData[treeField] || !dataCopy.treeData[treeField][index]
                    || treeData[field] !== dataCopy.treeData[treeField][index][field]) {
                    isChanged = true;
                    changedField[field] = treeData[field];
                }
            }
            index++;  // 行索引
            if (isChanged && treeData.id && !delFlag[treeData.id]) {  // 更新
                updated[treeField].push([1, treeData.id, changedField])
            } else if (isChanged && !delFlag[treeData.id]) {  // 新增
                updated[treeField].push([0, 0, changedField]);
                addFlag = true;
            }
        }
        if (!isChanged) {  // 未发生修改或新增的数据不处理
            delete updated[treeField]
        }
        if (options.formFieldsOption[treeField].required && (!datas.treeData[treeField].length && !addFlag)) {  // 行数据非空约束
            ElMessage({
                message: params.tables[treeField].title + '不能为空！',
                type: 'error'
            })
            return false
        }
    }
    return updated
}
