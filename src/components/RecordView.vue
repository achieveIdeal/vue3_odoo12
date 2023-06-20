<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <div class="controller-panel">
    <ButtonView
        v-if="!params.groupby"
        :disabled="disabled"
        :params="{type: params.type, id: params.id, name:props.name}"
        :buttons="buttons"
        @editClick="editClick"
        @saveClick="saveClick(formRef)"
        @objectClick="objectClick"
        @createClick="createClick"
        @customClick="customClick"
        @importClick="importClick"
        @cancelClick="cancelClick"/>
    <SearchBar
        ref="searchViewRef"
        v-if="params.type==='list'"
        :options="extras.search_fields"
        :groupby="extras.groupby"
        :model="params.model"
        :groupbyDefault="params.groupby"
        @groupbyClick="groupbyClick"
        @searchClick="searchClick"/>
  </div>
  <template v-if="params.type==='form'">
    <el-form
        ref="formRef"
        :inline="true"
        :model="datas"
        label-position="left"
        label-width="120px"
        class="form-inline">
      <FormView
          :datas="datas.formData"
          :treeData="datas.treeData"
          :options="options.formFieldsOption"
          :treeOptions="options.treeFieldsOption"
          :params="params"
          :attributes="extras.attributes"
          :isDialog="isDialog"
          @fieldOnchange="fieldOnchange"
          ref="formViewRef"
          :disabled="disabled"/>
      <TreeView
          v-if="Object.keys(params.tables||{}).length"
          :datas="datas.treeData"
          :formData="datas.formData"
          :options="options.treeFieldsOption"
          :formOptions="options.formFieldsOption"
          :params="params.tables"
          :attributes="extras.attributes||{}"
          :model="params.model"
          @fieldOnchange="fieldOnchange"
          :disabled="disabled"
          :activeTable="activeTable"
          :emptyData="emptyData"
          @pageChange="pageChange"
          @addLineClick="addLineClick"
          @deleteLineClick="deleteLineClick"
          @lineButtonClick="lineButtonClick"
      />
    </el-form>
  </template>
  <template v-if="params.type==='list'">
    <ListView
        :datas="datas.listData"
        :datasCopy="dataCopy.listData"
        :options="options.formFieldsOption"
        :params="params"
        :groupbyKey="groupbyKey"
        @pageChange="pageChange"
        @selectClick="selectClick"
        @pageSizeChange="pageSizeChange"
        @loadGroupDetail="loadGroupDetail"
        ref="listViewRef"/>
  </template>
</template>

<script lang="ts" setup>
import {inject, PropType, provide, reactive, ref, watch} from "vue";
import {RouteLocationNormalizedLoaded, useRoute, useRouter} from 'vue-router';
import {FormInstance, ElMessage} from "element-plus";
import FormView from './widget/FormView.vue';
import TreeView from './widget/TreeView.vue';
import ListView from './widget/ListView.vue';
import SearchBar from './widget/SearchBar.vue';
import ButtonView from './widget/ButtonView.vue';
import {callButton, callCreate, callFile, callReadGroup, callWrite, callSearchRead} from "../service/module/call";
import {
  initFormData,
  initTreeData,
  initListData,
  initButton,
  initEmptyTreeData,
  formatData
} from '../tools/init';
import type {FieldOptionType, DataType, Multiple, ModuleDataType} from "../types";
import {onchangeField, loadformData, loadListData, getFieldOption} from "../tools";

let props = defineProps({
  params: {
    type: Object as PropType<ModuleDataType>
  },
  extras: {
    type: Object,
    default: {}
  },
  isDialog: {
    type: Boolean,
    default: false
  }
});

const noloadField = Object.keys(props.params?.tables || {}).concat(['id']);
provide('noloadFields', noloadField)
const id = inject('id', 0);

let route: RouteLocationNormalizedLoaded = useRoute();
let router = useRouter();
const loading = ref(false); // 数据加载动画
let disabled = ref<boolean>(true); // 编辑控制
let datas = reactive<DataType>({formData: {}, treeData: {}, listData: []});
let options: FieldOptionType = {formFieldsOption: {}, treeFieldsOption: {},};
let emptyData = reactive<{ [prop: string]: { [prop: string]: Multiple } }>({});  // 空数据
let activeTable = ref<string>('');  // 控制tree视图激活的table
let dataCopy: DataType = {formData: {}, treeData: {}};  // 保留原始数据
let buttons = reactive({buttons: {}});  // 按钮控制
let listViewRef = ref({});  // 列表页的vue元素
let formViewRef = ref({});  // 表单页的vue元素
let searchViewRef = ref({});
let formRef = ref({});  // 表单的vue元素
let params: ModuleDataType = props.params;
let extras: ModuleDataType = props.extras; // 额外的属性
let groupbyData = [];  // 分组查询返回的数据
let groupbyKey = ref('');  // 默认分组查询值
const getListViewExpose = () => {
  const listTable = listViewRef.value?.listTable || {};
  const pageSize = listViewRef.value?.pageSize || 20;
  const recoverPageTo1 = listViewRef.value?.recoverPageTo1 || function () {
  };
  return {
    listTable,
    pageSize,
    recoverPageTo1
  }
};

const emits = defineEmits(['objectClick', 'saveClick', 'customClick', 'pageSizeChange', 'loadGroupDetail',
  'lineButtonClick', 'loadedCallable', 'selectClick', 'deleteLineClick', 'fieldOnchange']);

const initForm = async (result) => {
  let formData = result?.formData || datas.formData;
  let treeData = result?.treeData || datas.treeData;
  disabled.value = !!params.id;  //  创建不加载数据  且为可编辑
  let tableDataCountMap = result?.tableDataCountMap;
  buttons.buttons = initButton(extras, formData, params.type);
  let inited = await initFormData(extras, formData, options.formFieldsOption, noloadField);
  for (let lineField of Object.keys(tableDataCountMap || {})) {  // 记录表格数据总数
    params.tables[lineField].count = tableDataCountMap[lineField];
  }

  let initedTree = {};
  if (Object.keys(params.tables || {}).length) {
    for (let field of Object.keys(params.tables || {})) {
      if (!activeTable.value && !options.formFieldsOption[field]?.invisible) { // 默认选中第一个没有被隐藏的table页
        activeTable.value = field;
        break;
      }
    }
    initedTree = await initTreeData(extras, treeData, options.treeFieldsOption, formData);
    initEmptyTreeData(emptyData, options.treeFieldsOption)
  }
  datas.formData = inited.formData;
  datas.treeData = initedTree.treeData || {};
  dataCopy = JSON.parse(JSON.stringify(datas));
}
const initList = async (result) => {
  disabled.value = true;
  const listData = !result ? datas.listData : result.listData;
  const count = !result ? datas.count : result.count;
  const initedList = await initListData(extras, listData, options.formFieldsOption, noloadField);
  datas.listData = initedList.listData;
  params.count = count;
}

const hasDefaultSearch = () => {
  let hasDefault = params.groupby && extras.groupby.length;
  const search_fields = extras.search_fields || {};
  for (const field of Object.keys(search_fields)) {
    if (search_fields[field].default) {
      hasDefault = true
    }
  }
  return !hasDefault
}

const loadData = async () => {
  let fieldsOption;
  if (!Object.keys(options.formFieldsOption).length) {
    fieldsOption = await getFieldOption(params);
  }
  datas.formData = {};
  datas.treeData = {};
  datas.listData = [];
  params.limit = 20;
  params.offset = 0;
  options.formFieldsOption = (fieldsOption || options).formFieldsOption;
  options.treeFieldsOption = (fieldsOption || options).treeFieldsOption;
  let needInit = true;
  const noInit = () => {
    needInit = false;
  };
  if (params.type === 'form') {
    emits('loadedCallable', initForm, loading, noInit)
    if (needInit) {
      loading.value = true;
      let result = await loadformData(params); // 加载详情
      initForm(result);
      loading.value = false;
    }
  } else if (params.type === 'list') {
    needInit = hasDefaultSearch()
    emits('loadedCallable', initList, loading, noInit);
    buttons.buttons = initButton(extras, {}, params.type);
    if (needInit) {
      disabled.value = true;
      const result = await loadListData(params); // 加载列表
      initList(result)
      loading.value = false;
    }
  }
}
const reload = loadData

watch(route, async (form: RouteLocationNormalizedLoaded, to: RouteLocationNormalizedLoaded | undefined) => {
  params.id = parseInt(id || route.query.id || '0');
  params.type = params.classify || ((route.query.id || params.id) ? 'form' : 'list');
  if ((form || to).name === params.name) {
    await loadData();
  }
}, {immediate: true})

const groupbyClick = (groupby, domain) => {
  groupbyKey.value = groupby
  params.groupby = groupby
  callReadGroup({
    model: params.model,
    domain: domain.concat(params.domain),
    fields: params.groupby || params.fields,
    groupby: groupby,
    order_by: params.sort,
  }).then(res => {
    groupbyData = res.result;
    for (const groupbyDetail of groupbyData) {
      groupbyDetail['hasChildren'] = true;
      if (options.formFieldsOption[groupby]?.type === 'selection') {
        groupbyDetail[groupby] = options.formFieldsOption[groupby].selection.find(r => r[0] === groupbyDetail[groupby])[1]
      }
      if (['many2one', 'many2many'].indexOf(options.formFieldsOption[groupby]?.type) !== -1) {
        groupbyDetail[groupby] = groupbyDetail[groupby][1]
      }
      groupbyDetail[groupby] = groupbyDetail[groupby] + ' - (' + groupbyDetail[groupby + '_count'] + ')'
    }
    datas.listData = groupbyData;
    params.count = groupbyData.length;
  })
}
const loadGroupDetail = async (row, treeNode, resolve) => {
  const count = row[Object.keys(row)[0]]
  const result = await callSearchRead({
    model: params.model,
    fields: params.fields,
    offset: params.offset,
    limit: count,
    domain: row.__domain.concat(params.domain),
    sort: params.sort,
  })
  emits('loadGroupDetail', row, result)
  const records = await initListData(extras, result.result.records, options.formFieldsOption, noloadField);
  return resolve(records.listData)
}

const searchClick = async (domain) => {  // 搜索数据重置
  const listViewExpose = getListViewExpose();
  listViewExpose?.recoverPageTo1();
  const size = listViewExpose.pageSize;
  loading.value = true;
  groupbyKey.value = '';
  params.groupby = '';
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

const pageChange = async (currentPage: number, treeField: string) => {  // 列表页分页和表单页表格数据分页
  const domain = searchViewRef.value?.getDomain() || [];
  const listViewExpose = getListViewExpose();
  const size = listViewExpose.pageSize;
  loading.value = true;
  let page = (currentPage - 1)
  if (params.type === 'list') {
    const result = await loadListData({
      model: params.model,
      fields: params.fields,
      sort: params.sort,
      limit: size,
      offset: (size || 10) * page,
      domain: params.domain.concat(domain)
    })  // 加载列表
    const initedList = await initListData(extras, result.listData, options.formFieldsOption, noloadField)
    datas.listData = initedList.listData
    params.count = result.count
  } else if (params.type === 'form') {
    params.tables[treeField].offset = params.tables[treeField].limit * page
  }
  loading.value = false;
}
const pageSizeChange = async (size) => {
  if (params.count < size && params.count < params.limit) {
    return
  }
  const domain = searchViewRef.value?.getDomain() || [];
  loading.value = true;
  if (params.type === 'list') {
    const result = await loadListData({
      model: params.model,
      fields: params.fields,
      sort: params.sort,
      limit: size,
      domain: params.domain.concat(domain)
    })  // 加载列表
    const initedList = await initListData(extras, result.listData, options.formFieldsOption, noloadField)
    datas.listData = initedList.listData
    params.count = result.count
  }
  loading.value = false;
  emits('pageSizeChange', size, loading)
}

const editClick = () => {
  disabled.value = false;
}
const cancelClick = () => {
  for (let file of formViewRef.value?.upload || []) {
    file.clearFiles();
  }
  disabled.value = true;
  datas.formData = JSON.parse(JSON.stringify(dataCopy.formData))  // 数据复原
  datas.treeData = JSON.parse(JSON.stringify(dataCopy.treeData))
}
const createClick = () => {
  disabled.value = false;
}

const saveWrite = (params, savedDatas) => {
  loading.value = true;
  callWrite(params, savedDatas).then(async res => {
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    await reload();  // 修改后重新加载数据，防止页面数据与数据库不一致
    disabled.value = true;
    loading.value = false;
  })
}
const saveCreate = (params, savedDatas) => {
  loading.value = true;
  callCreate(params, savedDatas).then(res => {
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    disabled.value = true;
    loading.value = false;
    router.push({
      name: params.name,
      query: {
        id: res.result
      }
    })
  })
}

const saveClick = (formEl: FormInstance | undefined) => {  // 处理保存按钮，包括编辑保存和创建保存
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      let savedDatas = formatData(datas, dataCopy, options);
      for (let file of formViewRef.value?.upload || []) {
        file.submit()
      }
      if (savedDatas && params.id) {
        saveWrite(params, savedDatas)
      } else if (savedDatas) {
        saveCreate(params, savedDatas);
      }
    } else {
      ElMessage({
        dangerouslyUseHTMLString: true,
        message: '表单数据存在错误, 请检查!',
        type: 'error'
      })
      return false;
    }
    emits('saveClick', valid, reload, loading)
  })
}
const customClick = (button) => {
  const listViewExpose = getListViewExpose();
  const rows = (listViewExpose || {}).listTable?.getSelectionRows() || []
  if (rows.length) {
    emits('customClick', button, rows, reload, loading);
  } else {
    emits('customClick', button, formatData(datas, {formData: {}, treeData: []}, options), reload, loading);
  }
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
    if (!!result.report_file) {  // 如果是文件，请求下载
      loading.value = true;
      await callFile({
        reportname: result.report_file,
        docids: result?.context?.active_ids || ids,
        converter: result.report_type,
        name: result.name
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
const selectClick = (rows) => {
  for (const button of buttons.buttons) {
    if (button.needRow) {
      button.attributes.invisible = !rows.length;
    }
  }
  emits('selectClick', rows, reload, loading)
}

const lineButtonClick = (treeField, data, button) => {
  emits('lineButtonClick', treeField, data, button, reload, loading);
}
const addLineClick = (field) => {
  !params.tables[field].count ? params.tables[field].count = 0 : null;
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

const fieldOnchange = (params) => {
  emits('fieldOnchange', params, reload, loading)
}
</script>

<style lang="less" scoped>
.controller-panel {
  position: relative;
  z-index: 2;
  border-bottom: 1px solid #ced4da;
  text-align: left;
  width: 100%;
  margin-bottom: 20px;
  margin-top: -13px;
  vertical-align: middle;
  align-items: center;
  display: flex;

  .search-bar {
    flex: 1;
    text-align: right;
  }
}

:deep(.el-scrollbar__view) {
  display: unset;
}

.form-inline {
  display: block;
}
</style>


