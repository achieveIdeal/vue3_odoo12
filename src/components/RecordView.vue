<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <PagerHeader :title="action.name" v-if="!isDialog"/>
  <el-header class="controller-panel">
    <!--    <MenuView v-if="hasMenus" :menus="menus" @menuClick="menuClick"/>-->
    <ButtonView
        v-if="Object.keys(formData||{}).length"
        :disabled="disabled"
        :params="{type: curViewType, id: formData.id, name: ''}"
        :buttons="buttons"
        :data="curViewType==='form'?formData:selectRows"
        @editClick="editClick"
        @saveClick="saveClick(formview_ref)"
        @objectClick="objectClick"
        @createClick="createClick"
        @importClick="importClick"
        @exportClick="exportClick"
        @cancelClick="cancelClick"/>
    <SearchView ref="searchview_ref" v-if="curViewType==='tree'" :searchViewInfo="searchViewInfo"
                @groupbyClick="groupbyClick"
                @searchClick="searchClick"
    />
  </el-header>
  <el-container>
    <el-main class="main-container">
      <FormView ref="formview_ref" v-if="curViewType==='form' &&Object.keys(arch).length"
                :arch="arch"
                :isDialog="isDialog"
                :data="dialog_data"
                :extras="extras"
                :disabled="disabled"
                :loading="loading"
                :model="fieldViewInfo.base_model"
                :viewFields="fieldViewInfo.viewFields"
                @buttonClick="buttonClick"
                @getLineDetailClick="getLineDetailClick"
                @dataLoadedCallback="dataLoadedCallback"
                @deleteLineClick="deleteLineClick"
                @addLineClick="addLineClick"
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
                @deleteLineClick="deleteLineClick"
                @addLineClick="addLineClick"
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
import {data2OdooFormat, formatData, initButton, initListData} from "../tools/init";
import {
  callCreate,
  callMethod,
  callReadGroup,
  callSearchRead,
  callWrite
} from "../service/module/call";
import router from "../router";
import {useRoute} from "vue-router";
import {eventBus} from "../tools";

eventBus.on('requestCallback', () => {
  loading.value = true;
})
eventBus.on('responseCallback', () => {
  loading.value = false;
})

const route = useRoute();
const loading = ref(false);
const listview_ref = ref('');
const formview_ref = ref('');
const searchview_ref = ref('');
const data_id = route.query.id;
const disabled = ref(parseInt(data_id) !== 0);

const props = defineProps({
  arch: {
    type: Object,
    default: {}
  }, action: {
    type: Object,
    default: {}
  }, dialog_data: {
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

let data = ref({});
let listData = ref([]);
let formData = ref({});
let selectRows = ref({});
let treeData = ref({});
let dataCopy = {};
let dataCount = ref();
const changedFieldsVal = {};

const attrs = ref(props.arch.attrs);
const model = props.fieldViewInfo.base_model;
const dataLoadedCallback = (datas, treeDatas, countRef) => {
  props.curViewType === 'form' ? data = datas : null;
  props.curViewType === 'form' ? treeData = treeDatas : null;
  props.curViewType === 'form' ? formData.value = datas.value : null;
  props.curViewType === 'tree' ? listData = datas : null;
  dataCount = countRef
  dataCopy = {formData: JSON.parse(JSON.stringify(datas.value)), treeData: JSON.parse(JSON.stringify(treeDatas.value))};
}
const buttons = ref({buttonOptions: []});
buttons.value.buttonOptions = initButton(props.extras, props.curViewType);
const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick', 'selectClick',
  'deleteLineClick', 'addLineClick', 'saveWriteClick', 'saveCreateClick', 'objectClick'])

const buttonClick = (button, model, datas) => {
  emits('buttonClick', button, model, datas, selectRows)
}
const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}
const editClick = () => {
  disabled.value = false;
}

const cancelClick = () => {
  disabled.value = true;
  data.value = JSON.parse(JSON.stringify(dataCopy.formData));
  treeData.value = JSON.parse(JSON.stringify(dataCopy.treeData));
}
const createClick = async () => {
  disabled.value = false;
}
const deleteLineClick = (treeField, index, treeData, row, noAddCallback) => {
  if (row.id) {
    if (!changedFieldsVal[treeField]) {
      changedFieldsVal['deleteFieldMap'] = {};
      changedFieldsVal['deleteFieldMap'][treeField] = [];
    }
    changedFieldsVal['deleteFieldMap'][treeField].push([2, row.id, false]);
  }
  emits('deleteLineClick', treeField, index, treeData, row, noAddCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

const saveWrite = async (savedDatas) => {
  await callWrite({id: data.value.id, model}, savedDatas)
  disabled.value = true;
}
const saveCreate = async (savedDatas) => {
  const real_id = await callCreate({model}, savedDatas)
  disabled.value = true;
  router.push({
    path: router.currentRoute.value.fullPath,
    query: {
      action_id: router.currentRoute.value.query.action_id,
      type: 'form',
      id: real_id
    }
  })
}

const saveClick = (formview_ref) => {  // 处理保存按钮，包括编辑保存和创建保存
  const formEl = formview_ref.form_ref;
  formEl.validate()
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      // changedFieldsVal
      debugger
      let savedDatas = data2OdooFormat(changedFieldsVal);
      let noeSave = false;
      const noSave = () => {
        noeSave = true;
      }
      debugger
      if (Object.keys(savedDatas).length && data.value.id) {
        emits('saveWriteClick', data.value, {savedDatas, saveWrite, noSave})
        !noeSave && saveWrite(savedDatas)
      } else if (Object.keys(savedDatas).length) {
        let savedDatas = data2OdooFormat(changedFieldsVal);
        emits('saveCreateClick', data.value, {savedDatas, saveCreate, noeSave})
        !noeSave && saveCreate(savedDatas);
      } else if (!savedDatas) {
        return false;
      } else {
        disabled.value = true;
      }
    } else {
      ElMessage({
        dangerouslyUseHTMLString: true,
        message: '表单数据存在错误, 请检查!',
        type: 'error'
      })
      return false;
    }
  })
}

const searchClick = async () => {  // 搜索数据重置
  const domain = searchview_ref?.value?.getDomain() || [];
  callSearchRead({
    model: props.fieldViewInfo.base_model,
    fields: Object.keys(props.fieldViewInfo.viewFields),
    offset: 0,
    limit: props.action.limit,
    domain: (props.action.domain || []).concat(domain),
  }).then(async res => {
    listData.value['self'] = await initListData(res.records, props.viewFields);
    dataCount.value = res.length
  })
}

const objectClick = async (button) => {   // 处理非创建和编辑按钮点击
  const data = props.curViewType === 'form' ? formData.value : selectRows.value
  let ids = props.curViewType === 'form' ? [data.id] : data.id;
  let send = true;
  const noSend = () => {
    send = false;
  }
  emits('objectClick', button, data, noSend);
  if (!ids || !ids.length) {
    ElMessage({
      message: '请至少选择一条记录!',
      type: 'error'
    })
    return false
  }
  send && await callMethod({
    model: model,
    method: button.method,
    args: [ids]
  })
}


const getGroupChildren = async (row) => {
  const domain = searchview_ref?.value?.getDomain() || [];
  const count = row[Object.keys(row)[0]]
  const result = await callSearchRead({
    model: params.model,
    fields: params.fields,
    offset: params.offset,
    limit: count,
    domain: row.__domain.concat(params.domain).concat(domain),
    sort: params.sort,
  })
  emits('loadGroupDetail', row, result)
  const records = await initListData(extras, result.result.records, props.fieldViewInfo.viewFields);
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
  const domain = searchview_ref.value?.getDomain();
  const childGroupby = row?.__context?.group_by
  const groupbys = childGroupby || searchview_ref.value.searchFacets.filter(r => r.groupby).map(r => r.groupby);
  groupbyKey.value = groupbys;
  params.groupby = groupbys;
  loading.value = true;
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

const selectClick = (rows, listTable, toggleRowSelection) => {
  const dataVal = {};
  for (const row of rows) {
    for (const field of Object.keys(row)) {
      !dataVal[field] ? dataVal[field] = [] : '';
      dataVal[field].push(row[field])
    }
  }
  selectRows.value = dataVal;
  for (const button of buttons.buttonOptions) {
    if (button.needRow) {
      button.attributes.noRowInvisible = !rows.length;
    }
  }
  emits('selectClick', rows, reload, loading, toggleRowSelection)
}

const lineButtonClick = (treeField, data, button) => {
  emits('lineButtonClick', datas, treeField, data, button, reload, loading);
}

eventBus.on('fieldOnchange', (params) => {
  const field = params.field;
  if (params.treeField) {
    const treeField = params.treeField;
    const index = params.index;
    !changedFieldsVal[treeField] ? changedFieldsVal[treeField] = [] : null;
    !changedFieldsVal[treeField][index] ? changedFieldsVal[treeField][index] = {} : null;
    changedFieldsVal[treeField][index][field] = treeData.value[treeField][index][field];
    if (treeData.value[treeField][index].id) {
      changedFieldsVal[treeField][index].id = treeData.value[treeField][index].id;
    }
  } else {
    changedFieldsVal[field] = data.value[field];
  }
})

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

.main-container {
  overflow-x: hidden;
}
</style>