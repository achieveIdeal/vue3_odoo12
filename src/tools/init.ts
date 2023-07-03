import {parseDomain} from "../tools";
import {useTypeStore} from "../store";
import {searchFieldSelection} from './index'
import {ElMessage} from "element-plus";

const typeStore = useTypeStore();
const is2Many = typeStore.is2Many;
const isDigit = typeStore.isDigit;
const is2One = typeStore.is2One;
const isSelection = typeStore.isSelection;
const isBool = typeStore.isBool;


export const setFormAttribute = (formData, formFieldsOption, extras) => {
    if (!!Object.keys(formFieldsOption || {}).length) {
        let attributes = extras?.attributes || {};
        for (const field of Object.keys(formFieldsOption || {})) {  // 自定义属性 readonly 和invisible等
            if (['readonly', 'invisible', 'listInvisible', 'required'].indexOf(field) !== -1) continue
            formFieldsOption[field]['readonly'] = (extras?.readonly || []).indexOf(field) !== -1 || extras?.readonly === '_all_';
            formFieldsOption[field]['invisible'] = (extras?.invisible || []).indexOf(field) !== -1 || extras?.invisible === '_all_';
            formFieldsOption[field]['listInvisible'] = (extras?.listInvisible || []).indexOf(field) !== -1 || extras?.listInvisible === '_all_';
            formFieldsOption[field]['required'] = (extras?.required || []).indexOf(field) !== -1 || extras?.required === '_all_';
            let extraOptions = attributes[field];
            for (const attribute of Object.keys(extraOptions || {})) {
                if (attribute === 'fields') continue;
                formFieldsOption[field][attribute] = extraOptions[attribute];
            }
        }
    }
}
export const initFormData = async (extras, formData, formFieldsOption) => {
    for (let field of formData ? Object.keys(formFieldsOption || {}) : []) {   // 初始化下拉选项值
        let attributes = extras.attributes || {};
        let extraOptions = attributes[field];
        formData[field] = formData[field] || extraOptions?.default;
        let value = formData[field]
        if (!isBool(formFieldsOption[field]?.type) && !value) {
            formData[field] = ''
        } else if (isDigit(formFieldsOption[field]?.type) && !value) {
            formData[field] = 0
            continue
        }
        if (is2Many(formFieldsOption[field]?.type)) {
            await searchFieldSelection(formFieldsOption[field], '', [['id', 'in', formData[field]]], formData[field].length)
        }
        !formFieldsOption[field]?.selection ? formFieldsOption[field].selection = [] : null;
        let sameFlag = false
        if (is2One(formFieldsOption[field]?.type)) {  // 保证选项唯一
            if (!value) continue;
            for (let i of formFieldsOption[field]?.selection) {
                if (i[0] === value[0] && i[1] === value[1]) {
                    sameFlag = true;
                }
            }
            if (!sameFlag && value) {
                formFieldsOption[field]?.selection.push(value)
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
        treeFieldsOption[treeField][field]['invisible'] = (attributes.invisible || []).indexOf(field) !== -1 || attributes.invisible === '_all_';
        treeFieldsOption[treeField][field]['readonly'] = (attributes.readonly || []).indexOf(field) !== -1 || attributes.readonly === '_all_';
        treeFieldsOption[treeField][field]['required'] = (attributes.required || []).indexOf(field) !== -1 || attributes.required === '_all_';
        let extraOptions = attributes[field];
        lineData[field] = lineData[field] || extraOptions?.default
        for (const attribute of Object.keys(extraOptions || {})) {
            treeFieldsOption[treeField][field][attribute] = extraOptions[attribute];
        }
    }
}
export const initTreeData = async (extras, treeData, treeFieldsOption, formData) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {
        !treeData[treeField] ? treeData[treeField] = [] : null;
        let lineDatas = treeData[treeField] || [];
        if (!lineDatas.length) {
            setTreeAttribute(treeField, {}, formData, treeFieldsOption, extras);
        }
        for (let lineData of !!lineDatas.length ? lineDatas : []) {
            for (let field of Object.keys(lineData || {})) {
                let attributes = extras.attributes ? extras.attributes[treeField]?.fields : {};
                let extraOptions = attributes[field];
                 lineData[field] =  lineData[field] ||  extraOptions?.default;
                let value = lineData[field]
                if (isDigit(treeFieldsOption[treeField][field]?.type) && !value) {
                    lineData[field] = 0
                } else if (!isBool(treeFieldsOption[treeField][field]?.type) && !value) {
                    lineData[field] = ''
                }
                let sameFlag = false
                if (is2One(treeFieldsOption[treeField][field]?.type)) {
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
                    lineData[field] = value[0];
                }
                if (is2Many(treeFieldsOption[treeField][field]?.type)) {
                    await searchFieldSelection(treeFieldsOption[treeField][field], '', [['id', 'in', lineDatas[field]]], lineDatas[field].length)
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


export const initListData = async (extras, listData, fieldsOption) => {
    for (let lineData of listData && listData.length ? listData : []) {
        setFormAttribute(lineData, fieldsOption, extras)
        for (let field of Object.keys(fieldsOption || {})) {
            let value = lineData[field]
            fieldsOption[field]['listInvisible'] = (extras.listInvisible || []).indexOf(field) !== -1;
            if (isSelection(fieldsOption[field]?.type)) {
                lineData[field] = fieldsOption[field].selection.find((val) => {
                    return val[0] === value
                })[1]
            } else if (isBool(fieldsOption[field]?.type)) {
                // 跳过
            } else if (is2One(fieldsOption[field]?.type)) {
                lineData[field] = lineData[field] ? lineData[field][1] : ''
            } else if (isDigit(fieldsOption[field]?.type)) {
                lineData[field] = (lineData[field] || 0).toFixed(fieldsOption[field]?.precision
                    || fieldsOption[field]?.digits?.length && fieldsOption[field]?.digits[1])
            } else if (!isBool(fieldsOption[field]?.type) && !value) {
                lineData[field] = ''
            } else if (is2Many(fieldsOption[field]?.type) && !fieldsOption[field]?.listInvisible) {
                await searchFieldSelection(fieldsOption[field], '', [['id', 'in', lineData[field]]], lineData[field].length)
                lineData[field] = fieldsOption[field].selection.map(r => r[1]).join(',')
            } else {
                lineData[field] = value || ''
            }
        }
    }
    return {listData, fieldsOption}
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
            if (isDigit(treeFieldsOption[treeField][field]?.type)) {
                emptyData[treeField][field] = treeFieldsOption[treeField][field]?.default || 0;
                continue
            }
            emptyData[treeField][field] = treeFieldsOption[treeField][field]?.default || 0;
        }
    }
}

export const formatData = function (datas, dataCopy, options): Object {  // 数据修改和保存格式化处理 发送给后端
    let updated = {}
    for (let field of Object.keys(datas.formData || {})) {
        if (datas.formData[field] !== dataCopy.formData[field]) {
            if (datas.formData[field] instanceof Array) {
                if (datas.formData[field].find(r => !(dataCopy.formData[field] || []).includes(r))) {
                    updated[field] = [[6, 0, datas.formData[field]]];
                }
            } else {
                updated[field] = datas.formData[field];
            }
        }
    }
    for (const treeField of Object.keys(datas.treeData || {})) {
        if (parseDomain(options.formFieldsOption[treeField]?.invisible, {
            ...datas.formData,
            [treeField]: datas.treeData[treeField]
        })) continue
        let isChanged = false;
        let delFlag = {};
        let addFlag = false;
        let updatedLineCopy = JSON.parse(JSON.stringify(datas.formData[treeField] || []))
        updated[treeField] = []
        for (const treeCopyId of dataCopy.formData[treeField] || []) {
            if (updatedLineCopy.indexOf(treeCopyId) === -1 && !delFlag[treeCopyId]) {  //  处理删除行
                isChanged = true;
                delFlag[treeCopyId] = true;
                updated[treeField].push([2, treeCopyId, false]);
            }
        }
        console.log(updated);
        for (const treeData of datas.treeData[treeField]) {
            let changedField = {};
            const copyLine = (dataCopy.treeData[treeField] || []).find(r => r.id === treeData.id); // 没有找到就是新增的没有id的行
            if (!copyLine) {
                changedField = treeData;
                isChanged = true;
            } else {
                for (const field of Object.keys(treeData || {})) {  // 处理修改行
                    if (treeData[field] !== copyLine[field]) {
                        isChanged = true;
                        changedField[field] = treeData[field];
                    }
                }
            }
            if (Object.keys(changedField).length) {
                if (isChanged && treeData.id && !delFlag[treeData.id]) {  // 更新
                    updated[treeField].push([1, treeData.id, changedField])
                } else if (isChanged && !delFlag[treeData.id]) {  // 新增
                    updated[treeField].push([0, 0, changedField]);
                    addFlag = true;
                }
            }
        }
        if (!isChanged) {  // 未发生修改或新增的数据不处理
            delete updated[treeField]
        }
        if (options.formFieldsOption[treeField].required && (!datas.treeData[treeField].length && !addFlag)) {  // 行数据非空约束
            ElMessage({
                message: options.formFieldsOption[treeField].string + '不能为空！',
                type: 'error'
            })
            return false
        }
    }
    return updated
}
