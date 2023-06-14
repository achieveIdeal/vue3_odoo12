<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <div class="controller-panel">
    <ButtonView :disabled="disabled" @editClick="editClick" @saveClick="saveClick(formRef)"
                :params="{type: params.type, id: params.id, name:props.name}"
                :buttons="buttons"
                :listView="listView"
                :loading="loading"
                @objectClick="objectClick"
                @createClick="createClick"
                @customClick="customClick"
                @importClick="importClick"
                @cancelClick="cancelClick"/>
    <SearchBar v-if="params.type==='list'"
               :options="searchOptions"
               @searchClick="searchClick"/>
  </div>
  <template v-if="params.type==='form'">
    <el-form ref="formRef"
             :inline="true"
             :model="datas"
             label-position="left"
             label-width="120px"
             class="form-inline">

      <FormView :datas="datas.formData" :treeData="datas.treeData"
                :options="options.formFieldsOption"
                :treeOptions="options.treeFieldsOption"
                :params="params"
                :attributes="extras.attributes"
                :isDialog="isDialog"
                @fieldOnchange="fieldOnchange"
                ref="formView"
                :disabled="disabled"/>
      <TreeView v-if="Object.keys(params.tables||{}).length" :datas="datas.treeData" :formDatas="datas.formData"
                :options="options.treeFieldsOption"
                :formOptions="options.formFieldsOption"
                :params="params.tables"
                :attributes="extras.attributes||{}"
                :model="params.model"
                :loading="loading"
                @fieldOnchange="fieldOnchange"
                :disabled="disabled"
                :activeTable="activeTable"
                :emptyDatas="emptyDatas"
                @pageChange="pageChange"
                @addLineClick="addLineClick"
                @deleteLineClick="deleteLineClick"
                @lineButtonClick="lineButtonClick"
      />
    </el-form>
  </template>
  <template v-if="params.type==='list'">
    <ListView :datas="datas.listData"
              :datasCopy="dataCopy.listData"
              :options="options.treeFieldsOption"
              :params="params"
              @pageChange="pageChange"
              @selectClick="selectClick"
              @pageSizeChange="pageSizeChange"
              ref="listView"/>
  </template>
</template>

<script lang="ts" setup>
import {defineExpose, inject, PropType, provide, reactive, ref, watch} from "vue";
import {RouteLocationNormalizedLoaded, useRoute, useRouter} from 'vue-router';
import {FormInstance, ElMessage} from "element-plus";
import FormView from './widget/FormView.vue'
import TreeView from './widget/TreeView.vue'
import ListView from './widget/ListView.vue'
import SearchBar from './widget/SearchBar.vue'
import ButtonView from './widget/ButtonView.vue'
import {callButton, callCreate, callFile, callWrite} from "../service/module/call";
import {initFormData, initTreeData, initListData, initButton, initEmptyTreeData, formatData} from '../tools/init'
import type {FieldOptionType, DataType, Multiple, ModuleDataType} from "../types";
import {onchangeField, loadFormDatas, loadTreeData} from "../tools";

const noloadField = Object.keys(props.params.tables || {}).concat(['id'])
provide('noloadFields', noloadField)
const id = inject('id', 0);

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
})
let route: RouteLocationNormalizedLoaded = useRoute()
let router = useRouter()
const loading = ref(false); // 数据加载动画
let disabled = ref<boolean>(true); // 编辑控制
let datas = reactive<DataType>({formData: {}, treeData: {}, listData: []})
let options: FieldOptionType = {formFieldsOption: {}, treeFieldsOption: {},}
let emptyDatas = reactive<{ [prop: string]: { [prop: string]: Multiple } }>({})  // 空数据
let activeTable = ref<string>('');  // 控制tree视图激活的table
let dataCopy: DataType = {formData: {}, treeData: {}};  // 保留原始数据
let buttons = reactive({buttons: {}})  // 按钮控制
let listView = ref({})  // 列表页的vue元素
let formView = ref({})  // 表单页的vue元素
let formRef = ref({})  // 表单的vue元素
let params: ModuleDataType = props.params
let extras: ModuleDataType = props.extras  // 额外的属性
let searchOptions = reactive({})  // 查询选项
let domains = [];  // 原始的domain

const initForm = async (result) => {
  let formData = result?.formData || datas.formData;
  let treeData = result?.treeData || datas.treeData;
  disabled.value = !!params.id;  //  创建不加载数据  且为可编辑
  let treeFieldsOption = result?.treeFieldsOption || options.treeFieldsOption;
  let formFieldsOption = result?.formFieldsOption || options.formFieldsOption;
  let tableDataCountMap = result?.tableDataCountMap;
  buttons.buttons = initButton(extras, formData, params.type);
  let inited = await initFormData(extras, formData, formFieldsOption, noloadField);
  for (let lineField of Object.keys(tableDataCountMap || {})) {  // 记录表格数据总数
    params.tables[lineField].count = tableDataCountMap[lineField];
  }

  let initedTree = {};
  if (Object.keys(params.tables || {}).length) {
    for (let field of Object.keys(params.tables || {})) {
      if (!activeTable.value && !formFieldsOption[field]?.invisible) { // 默认选中第一个没有被隐藏的table页
        activeTable.value = field;
        break;
      }
    }
    initedTree = await initTreeData(extras, treeData, treeFieldsOption, formData);
    initEmptyTreeData(emptyDatas, treeFieldsOption)
  }
  datas.formData = inited.formData;
  options.formFieldsOption = inited.formFieldsOption;
  datas.treeData = initedTree.treeData || {};
  options.treeFieldsOption = initedTree.treeFieldsOption || {}
  dataCopy = JSON.parse(JSON.stringify(datas))
}

const initList = async (result) => {
  options = result.treeFieldsOption || options.treeFieldsOption;
  disabled.value = true;
  const listData = typeof result === 'undefined' ? datas.listData : result.listData;
  const count = typeof result === 'undefined' ? datas.count : result.count;
  const initedList = await initListData(extras, listData, options, noloadField);
  options.treeFieldsOption = initedList.fieldsOption;
  datas.listData = initedList.listData;
  searchOptions = initedList.searchOptions;
  params.count = count;
  buttons.buttons = initButton(extras, {}, params.type);
}
const emits = defineEmits(['objectClick', 'saveClick', 'customClick','pageSizeChange',
  'lineButtonClick', 'loadedCallable', 'selectClick', 'deleteLineClick', 'fieldOnchange'])


const loadData = async () => {
  if (params.type === 'form') {
    loading.value = true;
    let result = await loadFormDatas(params); // 加载详情
    initForm(result)
    loading.value = false;
    emits('loadedCallable', initForm, loading)
  } else if (params.type === 'list') {
    disabled.value = true;
    const result = await loadTreeData(params); // 加载列表
    initList(result)
    loading.value = false;
    emits('loadedCallable', initList, loading)
  }
}
const reload = loadData


watch(route, async (form: RouteLocationNormalizedLoaded, to: RouteLocationNormalizedLoaded | undefined) => {
  params.id = parseInt(id || route.query.id || '0');
  params.type = params.classify || ((route.query.id || params.id) ? 'form' : 'list');
  if ((form || to).name === params.name) {
    domains = JSON.parse(JSON.stringify(params.domain || []))
    await loadData();
  }
}, {immediate: true})


const pageChange = async (currentPage: number, treeField: string) => {  // 列表页分页和表单页表格数据分页
  loading.value = true;
  let page = (currentPage - 1)
  if (params.type === 'list') {
    params.offset = (params.limit || 10) * page
    const result = await loadTreeData(params)  // 加载列表
    const initedList = await initListData(extras, result.listData, result.treeFieldsOption, noloadField)
    options.treeFieldsOption = initedList.fieldsOption
    datas.listData = initedList.listData
    searchOptions = initedList.searchOptions
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
  loading.value = true;
  if (params.type === 'list') {
    params.offset = 0;

    params.limit = size;
    const result = await loadTreeData(params)  // 加载列表
    const initedList = await initListData(extras, result.listData, result.treeFieldsOption, noloadField)
    options.treeFieldsOption = initedList.fieldsOption
    datas.listData = initedList.listData
    searchOptions = initedList.searchOptions
    params.count = result.count
  } else if (params.type === 'form') {
    params.tables[treeField].offset = params.tables[treeField].limit * page
  }
  loading.value = false;
  emits('pageSizeChange', size, loading)
}

const selectClick = (rows) => {
  for (const button of buttons.buttons) {
    if (button.needRow) {
      button.attributes.invisible = !rows.length;
    }
  }
  emits('selectClick', rows, reload, loading)
}

const editClick = () => {
  disabled.value = false;
}
const cancelClick = () => {
  for (let file of formView.value?.upload || []) {
    file.clearFiles();
  }
  disabled.value = true;
  datas.formData = JSON.parse(JSON.stringify(dataCopy.formData))  // 数据复原
  datas.treeData = JSON.parse(JSON.stringify(dataCopy.treeData))
}
const createClick = () => {
  disabled.value = false;
}

const objectClick = async (name: string) => {   // 处理非创建和编辑按钮点击
  const rows = (listView.value || {}).listTable?.getSelectionRows() || []
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
const searchClick = async (domain) => {  // 搜索数据重置
  loading.value = true;
  params.domain = domains;
  if (domain.length) {
    params.domain = params.domain.concat(domain);
  }
  const result = await loadTreeData(params, domains); // 加载列表
  const initedList = await initListData(extras, result.listData, result.treeFieldsOption, noloadField);
  options.treeFieldsOption = initedList.fieldsOption;
  datas.listData = initedList.listData;
  searchOptions = initedList.searchOptions;
  params.count = result.count;
  loading.value = false;
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

const lineButtonClick = (treeField, data, button) => {
  emits('lineButtonClick', treeField, data, button, reload, loading);
}
const addLineClick = (field) => {
  datas.treeData[field].push(JSON.parse(JSON.stringify(emptyDatas[field])))
  params.tables[field].count++;
}
const deleteLineClick = (field, index, row) => {
  let lineData = datas.treeData[field];
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
      for (let file of formView.value?.upload || []) {
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
  const rows = (listView.value || {}).listTable?.getSelectionRows() || []
  if (rows.length) {
    emits('customClick', button, rows, reload, loading);
  } else {
    emits('customClick', button, formatData(datas, {formData: {}, treeData: []}, options), reload, loading);
  }
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
  text-align: left;
  position: relative;
  display: block;
}
</style>


