<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <PagerHeader :title="action.name" v-if="!isDialog"/>
  <el-header class="controller-panel">
    <!--    <MenuView v-if="hasMenus" :menus="menus" @menuClick="menuClick"/>-->
    <ButtonView
        v-if="Object.keys(buttons.buttonOptions).length"
        :disabled="disabled"
        :params="{type: curViewType, id: data.id, name: ''}"
        :buttons="buttons"
        :data="data"
        @editClick="editClick"
        @saveClick="saveClick(formRef)"
        @objectClick="objectClick"
        @createClick="createClick"
        @customClick="customClick"
        @importClick="importClick"
        @anyClick="anyClick"
        @exportClick="exportClick"
        @cancelClick="cancelClick"/>
    <SearchView v-if="curViewType==='tree'" :searchViewInfo="searchViewInfo"/>
  </el-header>
  <el-container>
    <el-main>
      <FormView ref="formview_ref" v-if="curViewType==='form' &&Object.keys(arch).length"
                :arch="arch"
                :data="res_data"
                :isDialog="isDialog"
                :extras="extras"
                :disabled="disabled"
                :loading="loading"
                :model="fieldViewInfo.base_model"
                :viewFields="fieldViewInfo.viewFields"
                @buttonClick="buttonClick"
                @getLineDetailClick="getLineDetailClick"
                @dataLoadedCallback="dataLoadedCallback"
      />
      <ListView ref="listview_ref" v-if="curViewType==='tree' && Object.keys(arch).length" :action="action"
                :arch="arch"
                :disabled="disabled"
                :loading="loading"
                :extras="extras"
                :model="fieldViewInfo.base_model"
                :isDialog="isDialog"
                :formViewInfo="formViewInfo"
                :viewFields="fieldViewInfo.viewFields"
                @getDetailClick="getDetailClick"
                @selectClick="selectClick"
                @dataLoadedCallback="dataLoadedCallback"
      />
    </el-main>
  </el-container>

</template>

<script lang="ts" setup>
import PagerHeader from '../components/views/PageHeader.vue'
import {defineEmits, defineExpose, defineProps, ref} from "vue";
import ListView from "./views/ListView.vue";
import FormView from "./views/FormView.vue";
import SearchView from '../components/views/SearchView.vue'
import ButtonView from "./views/ButtonView.vue";
import {initButton} from "../tools/init";

const loading = ref(false);
const listview_ref = ref('');
const formview_ref = ref('');
const disabled = ref(true);
const props = defineProps({
  arch: {
    type: Object,
    default: {}
  }, action: {
    type: Object,
    default: {}
  }, res_data: {
    type: Object,
  },
  curViewType: {
    type: String,
    default: ''
  },
  fieldViewInfo: {
    type: Object,
    default: {}
  }, formViewInfo: {
    type: Object,
    default: {}
  }, searchViewInfo: {
    type: Object,
    default: {}
  }, isDialog: {
    type: Boolean,
    default: false
  }, extras: {
    default: {}
  },
})

const data = ref({})
const attrs = ref(props.arch.attrs);
const dataLoadedCallback = (datas) => {
  props.curViewType === 'form' ? data.value = datas : null;
}
const buttons = ref({buttonOptions: []});
buttons.value.buttonOptions = initButton(props.extras, props.curViewType);
const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick', 'selectClick'])

const buttonClick = (button, model, datas) => {
  emits('buttonClick', button, model, datas)
}
const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}


const getGroupChildren = async (row) => {
  const domain = searchViewRef?.value?.getDomain() || [];
  const count = row[Object.keys(row)[0]]
  const result = await callSearchRead({
    model: params.model,
    fields: params.fields,
    offset: params.offset,
    limit: count,
    domain: row.__domain.concat(params.domain).concat(domain),
    sort: params.sort,
  }, props.isDialog)
  emits('loadGroupDetail', row, result)
  const records = await initListData(extras, result.result.records, options.formFieldsOption, noloadField);
  const diffRows = [];
  const newRowIds = records.listData.map(r => r.id) || [];
  if (row.children?.length) {
    for (const odlRow of row.children) {
      if (newRowIds.indexOf(odlRow.id) !== -1) {
        diffRows.push(odlRow)
      }
    }
    return diffRows
  } else {
    return records.listData
  }
}

const groupbyClick = (row, treeNode, resolve) => {
  const domain = searchViewRef.value?.getDomain();
  const childGroupby = row?.__context?.group_by
  const groupbys = childGroupby || searchViewRef.value.searchFacets.filter(r => r.groupby).map(r => r.groupby);
  groupbyKey.value = groupbys;
  params.groupby = groupbys;
  loading.value = true;
  if (!props.isDialog) {
    sessionStorage.setItem(params.model + 'search_data', JSON.stringify(domain))
    sessionStorage.setItem(params.model + 'group_data', JSON.stringify(groupbys))
  }
  callReadGroup({
    model: params.model,
    domain: domain.concat(params.domain).concat(row?.__domain || []),
    fields: params.fields,
    groupby: groupbys,
    order_by: params.sort,
  }).then(async res => {
    groupbyData = res.result;
    let groupby = groupbys[0]
    const groupbyOptions = options.formFieldsOption[groupby];
    for (const groupbyDetail of groupbyData) {
      groupbyDetail['hasChildren'] = true;
      const value = groupbyDetail[groupby] || '未定义'
      groupbyDetail['id'] = row.id ? row.id + value : value;
      if (groupbyOptions?.type === 'selection') {
        groupbyDetail[params.fields[0]] = groupbyOptions.selection.find(r => r[0] === value)[1] + '(' + groupbyDetail[groupby + '_count'] + ')';
      } else if (groupbyOptions?.type === 'many2one') {
        groupbyDetail[params.fields[0]] = groupbyDetail[groupby][1] + '(' + groupbyDetail[groupby + '_count'] + ')'
      } else {
        groupbyDetail[params.fields[0]] = groupbyDetail[groupby] + '(' + groupbyDetail[groupby + '_count'] + ')';
      }
      if (!childGroupby) {
        groupbyDetail['children'] = await getGroupChildren(groupbyDetail);
      }
      groupbyDetail[groupby] = groupbyDetail[params.fields[0]]
    }
    if (childGroupby) {
      row.children = groupbyData;
      resolve(groupbyData);
    } else {
      datas.listData = groupbyData;
      params.count = groupbyData.length;
      const listTable = getListViewExpose().listTable
      for (const line of datas.listData) {
        listTable.toggleRowExpansion(line, false);
      }
      listTable.clearSelection();
      params.count = groupbyData.length;
    }
    loading.value = false;
  })
}

const sortByClick = (hasSort, field, sort) => {
  if (hasSort) {
    params.sort = field + ' ' + sort;
    searchClick();
  }
  emits('sortByClick', field, sort);
}

const loadGroupDetail = async (row, treeNode, resolve) => {
  const children = await getGroupChildren(row)
  row.children = children;
  resolve(children)
}

const searchClick = async () => {  // 搜索数据重置
  const domain = searchViewRef?.value?.getDomain() || [];
  const listViewExpose = getListViewExpose();
  listViewExpose?.recoverPageTo1();
  const size = listViewExpose.pageSize;
  loading.value = true;
  groupbyKey.value = [];
  params.groupby = [];
  if (!props.isDialog) {
    sessionStorage.setItem(params.model + 'search_data', JSON.stringify(params.domain.concat(domain)));

  }
  const result = await loadListData({
    model: params.model,
    fields: params.fields,
    limit: size,
    sort: params.sort,
    domain: params.domain.concat(domain)
  }); // 加载列表
  const initedList = await initListData(extras, result.listData, options.formFieldsOption, noloadField);
  datas.listData = initedList.listData;
  params.count = result.count;
  loading.value = false;
}

const editClick = () => {
  disabled.value = false;
}
const cancelClick = () => {
  for (let file of formViewRef.value?.upload || []) {
    file.clearFiles();
  }
  if (params.id) {
    disabled.value = true;
    datas.formData = JSON.parse(JSON.stringify(dataCopy.formData))  // 数据复原
    datas.treeData = JSON.parse(JSON.stringify(dataCopy.treeData))
  }
}
const createClick = () => {
  disabled.value = false;
}
const saveClick = (formEl: FormInstance | undefined) => {  // 处理保存按钮，包括编辑保存和创建保存
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      let savedDatas = formatData(datas, dataCopy, options);
      for (let file of formViewRef.value?.upload || []) {
        file.submit()
      }
      let noeSave = false;
      if (Object.keys(savedDatas).length && params.id) {
        emits('saveWriteClick', datas, savedDatas, saveWrite, () => {
          noeSave = true;
        }, loading, reload)
        !noeSave && saveWrite(savedDatas)
      } else if (Object.keys(savedDatas).length) {
        let savedDatas = formatData(datas, {formData: {}, treeData: []}, options);
        emits('saveCreateClick', datas, savedDatas, saveCreate, () => {
          noeSave = true;
        }, loading, reload)
        !noeSave && saveCreate(savedDatas);
      } else if (!savedDatas) {
        return false;
      } else {
        disabled.value = true;
        reload()
      }
    } else {
      ElMessage({
        dangerouslyUseHTMLString: true,
        message: '表单数据存在错误, 请检查!',
        type: 'error'
      })
      return false;
    }
    emits('saveClick', valid, reload, loading, datas)
  })
}
const customClick = (button) => {
  const listViewExpose = getListViewExpose();
  const rows = listViewExpose.listTable?.getSelectionRows() || []
  if (rows.length) {
    emits('customClick', button, rows, reload, loading);
  } else {
    emits('customClick', button, formatData(datas, {formData: {}, treeData: []}, options), reload, loading, formRef);
  }
}
const exportClick = () => {
  const listViewExpose = getListViewExpose();
  const rows = listViewExpose.listTable?.getSelectionRows() || []
  const model = params.model;
  const exportFields = [];
  const headers = [];
  const datas = [];
  for (const field of params.exportFields || params.listFields || params.fields) {
    if (params.exportFields?.length || !parseDomain(options.formFieldsOption[field]?.invisible, datas.formData)) {
      headers.push(options.formFieldsOption[field]?.string);
      exportFields.push(field);
    }
  }
  for (const row of rows.filter(r => !r.hasChildren)) {
    const line = []
    for (const field of exportFields) {
      if (['many2one', 'selection'].includes(options.formFieldsOption[field]?.type)) {
        const value = (options.formFieldsOption[field].selection?.length ?
            options.formFieldsOption[field].selection : []).find(r => r[0] === row[field])[1]
        line.push(value);
      } else if (['many2many', 'one2many'].includes(options.formFieldsOption[field]?.type)) {
        const value = (options.formFieldsOption[field].selection?.length ?
            options.formFieldsOption[field].selection : []).filter(r => (row[field]?.length ? row[field] : []).includes(r[0]))[1]
        line.push(value);
      } else {
        line.push(row[field]);
      }
    }
    datas.push(line)
  }
  loading.value = true;
  Request.get({
    url: '/front/export/xls_view',
    params: {
      data: JSON.stringify({
        model: model,
        headers: headers,
        rows: datas
      }),
      token: 'dummy-because-api-expects-one'
    },
    responseType: 'blob'
  }).then(async res => {  // 请求成功后处理流
    downLoadFileBold(res, params.title, 'xls');
    loading.value = false;
  })
}
const objectClick = async (name: string) => {   // 处理非创建和编辑按钮点击
  const listViewExpose = getListViewExpose();
  const rows = listViewExpose.listTable?.getSelectionRows() || []
  let ids = !!params.id ? [params.id] : rows.map(r => r.id);
  if (!ids.length) {
    ElMessage({
      message: '请至少选择一条记录!',
      type: 'error'
    })
    return false
  }
  loading.value = true;
  await callButton({
    model: params.model,
    method: name,
    args: [ids]
  }).then(async res => {
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    emits('objectClick', name, rows, res, reload, loading);
    await reload();
    loading.value = false;
    const result = res.result || {};
    console.log(result, 'adsas');

    if (!!result.report_file) {  // 如果是文件，请求下载
      loading.value = true;
      await callFile({
        reportname: result.report_file,
        docids: result?.context?.active_ids || ids,
        converter: result.report_type,
        name: result.name,
      }, loading)
    }
  })
}
const importClick = (result) => {
  const importFields = params.import_fields;
  if (!importFields?.length) {
    ElMessage({
      message: '没有指定导入字段！',
      type: 'error'
    })
    return false;
  }
  loading.value = true;
  callButton({
    model: params.model,
    method: 'load',
    args: [importFields, result]
  }).then(res => {
    const result = res.result;
    const ids = result.ids;
    const messages = result.messages
    loading.value = false;
    if (ids) {
      ElMessage({
        message: '导入成功',
        type: 'success'
      })
      reload();
    } else {
      let errors = [];
      for (const message of messages) {
        errors.push('第' + (message.record + 1) + '行:' + message.message)
      }
      ElMessage({
        dangerouslyUseHTMLString: true,
        message: errors.join('</br>'),
        type: 'info'
      })
    }
  })
}

const anyClick = (button) => {
  emits('anyClick', button, datas, reload, loading)
}
const selectClick = (rows, listTable, toggleRowSelection) => {
  const dataVal = {};
  for (const row of rows) {
    for (const field of Object.keys(row)) {
      !dataVal[field] ? dataVal[field] = [] : '';
      dataVal[field].push(row[field])
    }
  }
  data.value = dataVal;
  for (const button of buttons.buttonOptions) {
    if (button.needRow) {
      button.attributes.noRowInvisible = !rows.length;
    }
  }
  emits('selectClick', rows, reload, loading, toggleRowSelection)
}

const deleteRow = (row) => {
  emits('deleteRow', row, reload)
}

const lineButtonClick = (treeField, data, button) => {
  emits('lineButtonClick', datas, treeField, data, button, reload, loading);
}
const addLineClick = (field) => {
  !params.tables[field].count ? params.tables[field].count = 0 : null;
  !datas.treeData[field] ? datas.treeData[field] = [] : null;
  datas.treeData[field].push(JSON.parse(JSON.stringify(emptyData[field])))
  params.tables[field].count++;

}
const deleteLineClick = (field, index, row) => {
  let lineData = datas.treeData[field];
  !params.tables[field].count ? params.tables[field].count = 0 : null;
  let id = lineData[index].id
  lineData.splice(index, 1)
  params.tables[field].count -= 1
  if (id) {
    let idInd = datas?.formData[field].indexOf(id)
    datas?.formData[field].splice(idInd, 1)
    onchangeField({  // 删除请求行字段的onchange事件
      field: field,
      datas: datas?.formData,
      model: params?.model,
      options: options?.formFieldsOption
    })
  }
  emits('deleteLineClick', field, index, row, reload, loading)
}

const fieldOnchange = (changeParams, noChange) => {
  emits('fieldOnchange', datas, changeParams, noChange, reload, loading)
}

defineExpose({
  formview_ref, listview_ref, data
})
</script>

<style lang="less" scoped>
.controller-panel {
  position: relative;
  z-index: 3;
  border-bottom: 1px solid #ced4da;
  text-align: left;
  vertical-align: middle;
  align-items: center;
  display: flex;
  justify-content: space-between;

}

.el-main {
  margin: 0;
  padding: 0;
}

.row-bg {
  width: 100%;
}

.grid-content {
  background-color: #ee0000;
  min-height: 36px;
}
</style>