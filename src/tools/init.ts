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
export const initFormData = async (formData, formFieldsOption) => {
    for (let field of formData ? Object.keys(formFieldsOption || {}) : []) {   // 初始化下拉选项值
        let extraOptions = attributes[field];
        formData[field] = formData[field] || extraOptions?.default || '';
        let value = formData[field];
        if (!isBool(formFieldsOption[field]?.type) && !value) {
            formData[field] = '';
        } else if (isDigit(formFieldsOption[field]?.type) && !value) {
            formData[field] = 0;
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
                formFieldsOption[field]?.selection.push(value);
            }
            // formData[field] = value[0]
        }
    }
    return {formFieldsOption, formData}
}
export const setTreeAttribute = (treeField, extras,treeFieldsOption) => {
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
export const initTreeData = async (extras, treeData, treeFieldsOption, formData) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {
        !treeData[treeField] ? treeData[treeField] = [] : null;
        let lineDatas = treeData[treeField] || [];
        if (!lineDatas.length) {
            setTreeAttribute(treeField, {}, formData, treeFieldsOption, extras);
        }
        for (let lineData of !!lineDatas.length ? lineDatas : []) {
            let attributes = extras.attributes && extras.attributes[treeField] ? extras.attributes[treeField]?.fields : {};
            for (let field of Object.keys(lineData || {})) {
                let extraOptions = attributes[field];
                lineData[field] = lineData[field] || extraOptions?.default || '';
                let value = lineData[field];
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
                        treeFieldsOption[treeField][field]['curSelect'].push(value);
                    }
                    treeFieldsOption[treeField][field].selection = treeFieldsOption[treeField][field]['curSelect'];
                    // lineData[field] = value[0];
                }
                if (is2Many(treeFieldsOption[treeField][field]?.type)) {
                    if (lineData[field].length && !(lineData[field][0] instanceof Array)) {
                        await searchFieldSelection(treeFieldsOption[treeField][field], '', [['id', 'in', lineData[field]]], lineData[field].length)
                    }
                }
            }
            if (extras) {
                setTreeAttribute(treeField, lineData, formData, treeFieldsOption, extras)
                if (extras[treeField]) {
                    extras[treeField].buttons = initButton((extras[treeField] || {}), {
                        ...formData,
                        [treeField]: lineData
                    })
                }
            }
        }
    }
    return {treeData, treeFieldsOption}
}


export const initListData = async (listData, fieldsOption) => {
    for (let lineData of listData && listData.length ? listData : []) {
        for (let field of Object.keys(fieldsOption || {})) {
            let value = lineData[field];
            let sameFlag = false;
            if (isBool(fieldsOption[field]?.type)) {
                // 跳过
            } else if (is2One(fieldsOption[field]?.type)) {
                !fieldsOption[field]['curSelect'] ? fieldsOption[field]['curSelect'] = [] : null;
                for (let i of fieldsOption[field]['curSelect']) {
                    if (i[0] === value[0] && i[1] === value[1]) {
                        sameFlag = true;
                    }
                }
                if (!sameFlag && value) {
                    fieldsOption[field]['curSelect'].push(value)
                }
                fieldsOption[field].selection = fieldsOption[field]['curSelect'];
                // lineData[field] = value[0];
            } else if (isDigit(fieldsOption[field]?.type)) {
                lineData[field] = parseFloat((lineData[field] || 0).toFixed(fieldsOption[field]?.precision
                    || fieldsOption[field]?.digits?.length && fieldsOption[field]?.digits[1]))
            } else if (!isBool(fieldsOption[field]?.type) && !value) {
                lineData[field] = ''
            } else if (is2Many(fieldsOption[field]?.type) && !fieldsOption[field]?.listInvisible) {
                if (lineData[field].length && !(lineData[field][0] instanceof Array)) {
                    await searchFieldSelection(fieldsOption[field], '', [['id', 'in', lineData[field]]], lineData[field].length)
                }
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
export const initEmptyTreeData = (emptyData, treeFieldsOption) => {
    for (let treeField of Object.keys(treeFieldsOption || {})) {  // 设置空数据
        emptyData[treeField] = {};
        for (let field of Object.keys(treeFieldsOption[treeField] || {})) {
            if (isDigit(treeFieldsOption[treeField][field]?.type)) {
                emptyData[treeField][field] = treeFieldsOption[treeField][field]?.default || 0;
                continue
            }
            emptyData[treeField][field] = treeFieldsOption[treeField][field]?.default || '';
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
        for (const treeData of datas?.treeData[treeField]) {
            let changedFieldsData = {};
            const copyLine = (dataCopy.treeData[treeField] || []).find(r => r.id === treeData.id); // 没有找到就是新增的没有id的行
            if (!copyLine) {
                changedFieldsData = treeData;
                isChanged = true;
            } else {
                for (const field of Object.keys(treeData || {})) {  // 处理修改行
                    if (treeData[field] !== copyLine[field]) {
                        isChanged = true;
                        changedFieldsData[field] = treeData[field];
                    }
                }
            }
            if (Object.keys(changedFieldsData).length) {
                if (isChanged && treeData.id && !delFlag[treeData.id]) {  // 更新
                    updated[treeField].push([1, treeData.id, changedFieldsData])
                } else if (isChanged && !delFlag[treeData.id]) {  // 新增
                    updated[treeField].push([0, 0, changedFieldsData]);
                    addFlag = true;
                }
            }
        }
        if (!isChanged) {  // 未发生修改或新增的数据不处理
            delete updated[treeField]
        }
    }
    return updated
}
