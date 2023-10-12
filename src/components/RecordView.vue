<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <PagerHeader :title="action.name || name" v-if="!isDialog"/>
  <el-header class="controller-panel" v-if="!isDialog || relation_field">
    <!--    <MenuView v-if="hasMenus" :menus="menus" @menuClick="menuClick"/>-->
    <ButtonView
        :disabled="disabled"
        :params="{type: curViewType, id: parseInt(route.query.id)}"
        :buttons="buttons"
        :data="curViewType==='form'?formData:selectRows"
        @editClick="editClick"
        @saveClick="saveClick(formview_ref)"
        @objectClick="objectClick"
        @createClick="createClick"
        @importClick="importClick"
        @exportClick="exportClick"
        @cancelClick="cancelClick"/>
    <SearchView ref="searchview_ref" class="search-view"
                v-if="curViewType==='tree' && Object.keys(searchViewInfo||{}).length"
                :searchViewInfo="searchViewInfo"
                :toolbar="toolbar"
                :showActionBar="showActionBar"
                @groupbyClick="groupbyClick"
                @actionItemClick="actionItemClick"
                @searchClick="searchClick"
    />
  </el-header>
  <el-container>
    <el-main class="main-container">
      <FormView ref="formview_ref" v-if="curViewType==='form' &&Object.keys(arch).length"
                :arch="arch"
                :isDialog="isDialog"
                :data="loaded_data"
                :extras="extras"
                :disabled="disabled"
                :relation_field="relation_field"
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
                :disabled="true"
                :loading="loading"
                :extras="extras"
                :fieldViewInfo="fieldViewInfo"
                :model="fieldViewInfo.base_model"
                :isDialog="isDialog"
                :formViewInfo="formViewInfo"
                :viewFields="fieldViewInfo.viewFields"
                @getDetailClick="getDetailClick"
                @pageSizeChange="pageSizeChange"
                @selectClick="selectClick"
                @dataLoadedCallback="dataLoadedCallback"
                @deleteLineClick="deleteLineClick"
                @addLineClick="addLineClick"
                @pageChange="pageChange"
                @groupbyClick="groupbyClick"
                @sortByClick="sortByClick"
                @loadGroupDetail="loadGroupDetail"
      />
    </el-main>
  </el-container>

</template>

<script lang="ts" setup>
import PagerHeader from '../components/views/PageHeader.vue'
import {defineEmits, defineExpose, defineProps, ref, watch} from "vue";
import ListView from "./views/ListView.vue";
import FormView from "./views/FormView.vue";
import SearchView from '../components/views/SearchView.vue'
import ButtonView from "./views/ButtonView.vue";
import {data2OdooFormat, initButton, initListData} from "../tools/init";
import {
  callCreate, callKw,
  callMethod,
  callReadGroup,
  callSearchRead,
  callWrite
} from "../service/module/call";
import router from "../router";
import {useRoute} from "vue-router";
import {downLoadFileBold, eventBus} from "../tools";
import {ElMessage} from "element-plus";
// import {tFn, defaultLang} from "../hook/useI18n";

let flag = true
// function  handleChangLang (){  // 翻译切换
//   defaultLang.value = flag?'en-US':'zh-CN'
//   flag =!flag
// }
eventBus.on('requestCallback', () => {
  loading.value = true;
})
eventBus.on('responseCallback', () => {
  loading.value = false;
})

const route = useRoute();
const loading = ref(false);
const showActionBar = ref(false);
const listview_ref = ref('');
const formview_ref = ref('');
const searchview_ref = ref('');

const props = defineProps({
  arch: {
    type: Object,
    default: {}
  }, action: {
    type: Object,
    default: {}
  }, loaded_data: {
    type: Object,
  }, relation_field: {
    type: String,
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
    type: Object,
    default: {}
  },
})
let data_id = 0;
const name = route.query.name;
if (props.isDialog) {
  data_id = parseInt(props.loaded_data?.id);
} else {
  data_id = parseInt(route.query.id);
}
watch(route, () => {
  showActionBar.value = false;
  disabled.value = !!parseInt(route.query.id) || !route.query.type;
})
const disabled = ref(parseInt(data_id) !== 0 || !route.query.type);
if (props.isDialog && !props.loaded_data?.id) {
  disabled.value = false;
}

let data = ref({});
let listData = ref([]);
let formData = ref({});
let selectRows = ref({});
let treeData = ref({});
let dataCopy = {};
let dataCount = ref();
const changedFieldsVal = {};

const toolbar = props.fieldViewInfo.toolbar
const attrs = ref(props.arch.attrs);
const model = props.fieldViewInfo.base_model;
const buttons = ref({
  buttonOptions: [{
    type: 'edit',
    text: '编辑', // tFn('base.page')  多语言翻译
    showType: ['form'],
    attributes: {
      invisible: !props.arch.attrs.edit
    }
  }, {
    type: 'create',
    showType: ['tree', 'form'],
    text: '创建',
    attributes: {
      invisible: !props.arch.attrs.create
    }
  }, {
    type: 'import',
    showType: ['tree', 'form'],
    text: '导入',
    attributes: {
      invisible: !props.arch.attrs.import
    }
  },
  ]
});
if (props.extras?.buttons) {
  buttons.value.buttonOptions = initButton(props.extras, props.curViewType);
}

const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick', 'selectClick',
  'deleteLineClick', 'addLineClick', 'saveWriteClick', 'saveCreateClick', 'objectClick', 'dialogCreateClick',
  'dialogCreateSaveClick', 'pageChange', 'pageSizeChange', 'sortByClick', 'actionItemClick'])
const buttonClick = (button, model, datas) => {
  emits('buttonClick', button, model, datas, selectRows.value)
}

const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}
const searchClick = async () => {  // 搜索数据重置
  const domain = searchview_ref?.value?.getDomain() || [];
  const limit = listview_ref.value.tableview_ref?.pageSize || props.action.limit;
  const offset = limit * ((listview_ref.value.tableview_ref?.currentPage || 1) - 1)
  callSearchRead({
    model: props.fieldViewInfo.base_model,
    fields: Object.keys(props.fieldViewInfo.viewFields),
    offset: offset,
    sort: props.arch.attrs.default_order || 'id desc',
    limit: listview_ref.value.tableview_ref?.pageSize || props.action.limit || props.arch.attrs.limit,
    domain: (props.action.domain || []).concat(domain),
  }).then(async res => {
    listData.value['self'] = await initListData(res.records, props.viewFields);
    dataCount.value = res.length
  })
}

const editClick = () => {
  disabled.value = false;
}

const createClick = async () => {
  disabled.value = false;
  if (!props.isDialog) {
    router.push({
      path: router.currentRoute.value.fullPath,
      query: {
        action_id: router.currentRoute.value.query.action_id,
        type: 'form',
        id: 0
      }
    })
  } else {
    const relation_field = props.relation_field;
    if (data.value[relation_field] instanceof Array) {
      changedFieldsVal[relation_field] = data.value[relation_field][0]
    } else if (typeof data.value[relation_field] === 'number') {
      changedFieldsVal[relation_field] = data.value[relation_field]
    }
    emits('dialogCreateClick', data, treeData, relation_field)
  }
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
const cancelClick = () => {
  disabled.value = true;
  data.value = JSON.parse(JSON.stringify(dataCopy.formData));
  treeData.value = JSON.parse(JSON.stringify(dataCopy.treeData));
}
const saveWrite = async (savedDatas) => {
  await callWrite({id: data.value.id, model, data: savedDatas})
  disabled.value = true;
}

const saveCreate = async (savedDatas) => {
  const real_id = await callCreate({model, data: savedDatas})
  disabled.value = true;
  if (!props.isDialog) {
    router.push({
      path: router.currentRoute.value.fullPath,
      query: {
        action_id: router.currentRoute.value.query.action_id,
        type: 'form',
        id: real_id
      }
    })
  } else {
    data.value.id = real_id;
    emits('dialogCreateSaveClick', real_id, data, treeData)
  }
}
const saveClick = (formview_ref) => {  // 处理保存按钮，包括编辑保存和创建保存
  const formEl = formview_ref.form_ref;
  formEl.validate()
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      let savedDatas = data2OdooFormat(changedFieldsVal);
      let noeSave = false;
      const noSave = () => {
        noeSave = true;
      }
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
const pageChange = (treeField, currentPage, pageSize, fields) => {
  let domain = []
  if (searchview_ref.value) {
    domain = searchview_ref.value?.getDomain() || [];
  }
  callSearchRead({
    model: model,
    fields: fields[treeField],
    offset: pageSize * (currentPage - 1),
    limit: pageSize,
    domain: (props.action.domain || []).concat(domain),
  }).then(async res => {
    dataCount.value = res.length || 0;
    listData.value[treeField] = await initListData(res.records, props.fieldViewInfo.viewFields);
  })
  emits('pageChange', treeField);
}
const pageSizeChange = async (treeField, size, fields) => {
  let domain = []
  if (searchview_ref.value) {
    domain = searchview_ref.value?.getDomain() || [];
  }
  callSearchRead({
    model: model,
    fields: fields[treeField],
    offset: 0,
    limit: size,
    domain: (props.action.domain || []).concat(domain),
  }).then(async res => {
    dataCount.value = res.length || 0;
    listData.value[treeField] = await initListData(res.records, props.fieldViewInfo.viewFields);
    emits('pageSizeChange', treeField);
  })
}

const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  /*  添加行时调用
* treeField: 添加行所属表格的字段
* treeData: 添加行所属表格的数据总体
* newLine: 添加的行
* noAddCallback: 是否执行添加，noAddCallback()调用此函数不添加
* */
  !changedFieldsVal[treeField] ? changedFieldsVal[treeField] = [] : null;
  changedFieldsVal[treeField].push(newLine)
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

const deleteLineClick = (treeField, index, treeData, row, noDelCallback) => {
  /*  删除行时调用
  * treeField: 删除行所属表格的字段
  * index: 删除行索引
  * treeData: 删除行所属表格的数据总体
  * row: 删除的行
  * noDelCallback: 是否执行删除，noAddCallback()调用此函数不删除
  * */
  if (row.id) {
    if (!changedFieldsVal[treeField]) {
      changedFieldsVal['deleteFieldMap'] = {};
      changedFieldsVal['deleteFieldMap'][treeField] = [];
    }
    changedFieldsVal['deleteFieldMap'][treeField].push([2, row.id, false]);
  }
  emits('deleteLineClick', treeField, index, treeData, row, noDelCallback)
}

const lineButtonClick = (treeField, data, button) => {
  /*  行自定义按钮点击时触发
  * treeField: 触发按钮的表格字段
  * data: 行数据
  * button: 自定义按钮数据
  * */
  emits('lineButtonClick', datas, treeField, data, button, reload, loading);
}
const getLineDetailClick = (dataLine, index, formViewInfo, relation_field) => {
  /* 获取表格某行详情时调用，在MainView中处理
  * dataLine: 数据行
  * index: 含索引
  * formViewInfo: 行对应的视图数据
  * relation_field: 关联抬头的字段
  * */
  emits('getLineDetailClick', dataLine, index, formViewInfo, relation_field)
}

const dataLoadedCallback = (datas, treeDatas, countRef) => {
  /* 数据加载完成回调，拿到对应视图数据
  * datas: 抬头数据
  * treeDatas: 表格数据
  * countRef: 列表页数组总数
  * * */
  props.curViewType === 'form' ? data = datas : null;   // 拿到表单数据，可以处理创建，编辑的数据同步
  props.curViewType === 'form' ? treeData = treeDatas : null;  // 拿到表格数据，可以处理创建，编辑的数据同步
  props.curViewType === 'form' ? formData.value = datas.value : null;  // 复制表单数据，处理按钮的显示与隐藏
  props.curViewType === 'tree' ? listData = datas : null;  // 拿到列表数据，用于搜索分页数据同步
  dataCount = countRef
  dataCopy = {formData: JSON.parse(JSON.stringify(datas.value)), treeData: JSON.parse(JSON.stringify(treeDatas.value))};  // 数据备份，取消编辑回到原始状态
}

const getGroupChildren = async (row) => {
  const domain = searchview_ref?.value?.getDomain() || [];
  const count = row[Object.keys(row)[0]]
  const result = await callSearchRead({
    model: model,
    fields: Object.keys(props.fieldViewInfo.viewFields),
    offset: 0,
    limit: count,
    domain: row.__domain.concat(props.action.domain || []).concat(domain),
    sort: 'id',
  })
  const records = await initListData(result.records, props.fieldViewInfo.viewFields);
  const diffRows = [];
  const newRowIds = records.map(r => r.id) || [];
  if (row.children?.length) {
    for (const odlRow of row.children) {
      if (newRowIds.indexOf(odlRow.id) !== -1) {
        diffRows.push(odlRow)
      }
    }
    return diffRows
  } else {
    return records
  }
}

const groupbyClick = (row, treeNode, resolve) => {
  let domain = []
  if (searchview_ref.value) {
    domain = searchview_ref.value?.getDomain() || [];
  }
  const childGroupby = row?.__context?.group_by
  const groupbys = childGroupby || searchview_ref.value.searchFacets.filter(r => r.groupby).map(r => r.groupby);
  callReadGroup({
    model: model,
    domain: domain.concat(props.action.domain || []).concat(row?.__domain || []),
    fields: Object.keys(props.fieldViewInfo.viewFields),
    groupby: groupbys,
    order_by: 'id',
  }).then(async res => {
    let groupbyData = res;
    let groupby = groupbys[0]
    for (const groupbyDetail of groupbyData) {
      groupbyDetail['hasChildren'] = true;
      const value = groupbyDetail[groupby] || '未定义'
      groupbyDetail['id'] = row.id ? row.id + value : value;
      groupbyDetail[Object.keys(props.fieldViewInfo.viewFields)[0]] = groupbyDetail[groupby]
    }
    if (childGroupby) {
      row.children = groupbyData;
      resolve(groupbyData);
    } else {
      for (const line of groupbyData) {
        listview_ref.value.tableview_ref.table_ref.toggleRowExpansion(line, false);
      }
      listData.value['self'] = groupbyData;
      dataCount.value = groupbyData.length;
    }
  })
}

const loadGroupDetail = async (row, treeNode, resolve) => {
  const children = await getGroupChildren(row)
  row.children = children;
  resolve(children)
}

eventBus.on('fieldOnchange', (params) => {
  const field = params.field;
  const datas = params.datas;
  if (!!params.treeField && params.treeField != 'text') {
    const treeField = params.treeField;
    const index = params.index;
    !changedFieldsVal[treeField] ? changedFieldsVal[treeField] = [] : null;
    !changedFieldsVal[treeField][index] ? changedFieldsVal[treeField][index] = {} : null;
    changedFieldsVal[treeField][index][field] = datas[field];
    if (datas.id) {
      changedFieldsVal[treeField][index].id = datas.id;
    }
    if (params.options[field].type === 'many2one') {
      changedFieldsVal[treeField][index][field] = (datas[field] || [''])[0];
    }
  } else {
    changedFieldsVal[field] = datas[field];
    if (params.options[field].type === 'many2one') {
      changedFieldsVal[field] = datas[field][0];
    }
  }
})

const sortByClick = (field, sort_method) => {
  props.arch.attrs.default_order = field + ' ' + sort_method;
  searchClick();
  emits('sortByClick', field, sort_method);
}
const actionItemClick = (actionOption) => {
  actionOption.attrs = {}
  actionOption.attrs.type = 'action'
  actionOption.attrs.name = actionOption.id
  emits('actionItemClick', actionOption, actionOption.res_model, {}, selectRows.value);
}


// --------------------------------------------待完善


const selectClick = (rows, listTable, toggleRowSelection) => {
  const dataVal = {};
  for (const row of rows) {
    for (const field of Object.keys(row)) {
      !dataVal[field] ? dataVal[field] = [] : '';
      dataVal[field].push(row[field])
    }
  }
  selectRows.value = dataVal;
  for (const button of buttons.value.buttonOptions) {
    if (button.needRow) {
      button.attributes.noRowInvisible = !rows.length;
    }
  }
  showActionBar.value = !!rows.length;
  emits('selectClick', rows, toggleRowSelection)
}


const exportClick = () => {
  const rows = listview_ref.value.tableview_ref.table_ref?.getSelectionRows() || [];
  const exportFields = [];
  const headers = [];
  const datas = [];
  for (const row of rows.filter(r => !r.hasChildren)) {
    const line = []
    for (const field of exportFields) {
      line.push(row[field]);
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
    downLoadFileBold(res, 'export', 'xls');
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
  callKw({
    model: model,
    method: 'load',
    args: [importFields, result]
  }).then(result => {
    const ids = result.ids;
    const messages = result.messages
    loading.value = false;
    if (ids) {
      ElMessage({
        message: '导入成功',
        type: 'success'
      })
      searchClick();
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

.search-view {
  width: 50%;
}

.grid-content {
  background-color: #ee0000;
  min-height: 36px;
}

.main-container {
  overflow-x: hidden;
}
</style>