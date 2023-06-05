<template>
  <div class="controller-panel">
    <ButtonView :disabled="disabled" @editClick="editClick" @saveClick="saveClick(formRef)"
                :params="{type: params.type, id: params.id, name:props.name}"
                :buttons="buttons"
                :listView="listView"
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
             label-width="120px"
             class="demo-form-inline">

      <FormView :datas="datas.formData" :treeDatas="datas.treeData"
                :options="options.formFieldsOption"
                :params="params"
                ref="formView"
                :disabled="disabled"/>
      <TreeView v-if="Object.keys(params.tables||{}).length" :datas="datas.treeData" :formDatas="datas.formData"
                :options="options.treeFieldsOption"
                :formOptions="options.formFieldsOption"
                :params="params.tables"
                :model="params.model"
                :disabled="disabled"
                :activeTable="activeTable"
                :emptyDatas="emptyDatas"
                @pageChange="pageChange"
                @addLineClick="addLineClick"
                @deleteLineClick="deleteLineClick"
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
import {inject, PropType, provide, reactive, ref, watch} from "vue";
import {RouteLocationNormalizedLoaded, useRoute, useRouter} from 'vue-router';
import {FormInstance, ElMessage} from "element-plus";
import FormView from './widget/FormView.vue'
import TreeView from './widget/TreeView.vue'
import ListView from './widget/ListView.vue'
import SearchBar from './widget/SearchBar.vue'
import ButtonView from './widget/ButtonView.vue'
import {callButton, callCreate, callFile, callWrite} from "../service/module/call";
import {initFormData, initTreeData, initListData, initButton, initEmptyTreeData} from '../tools/init'
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
  }
})
let route: RouteLocationNormalizedLoaded = useRoute()
let router = useRouter()

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

const loadData = async () => {
  if (params.type === 'form') {
    disabled.value = !!params.id;  //  创建不加载数据  且为可编辑
    let result = await loadFormDatas(params); // 加载详情
    let formData = result.formData;
    let treeData = result.treeDatas;
    let treeFieldsOption = result.treeFieldsOption;
    let formFieldsOption = result.formFieldsOption;
    let tableDataCountMap = result.tableDataCountMap;
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
  } else if (params.type === 'list') {
    disabled.value = true;
    const result = await loadTreeData(params); // 加载列表
    const initedList = await initListData(extras, result.listData, result.treeFieldsOption);
    options.treeFieldsOption = initedList.fieldsOption;
    datas.listData = initedList.listDatas;
    searchOptions = initedList.searchOptions;
    params.count = result.count;
    buttons.buttons = initButton(extras, {}, params.type);
  }
}
const reload = loadData

watch(route, (form: RouteLocationNormalizedLoaded, to: RouteLocationNormalizedLoaded | undefined) => {
  params.id = parseInt(id || route.query.id || '0');
  params.type = (route.query.id || params.id) ? 'form' : 'list';
  if ((form || to).name === params.name) {
    loadData()
  }
}, {immediate: true})

const pageChange = async (currentPage: number, treeField: string) => {  // 列表页分页和表单页表格数据分页
  let page = (currentPage - 1)
  if (params.type === 'list') {
    params.offset = (params.limit || 10) * page
    const result = await loadTreeData(params)  // 加载列表
    const initedList = await initListData(extras, result.listData, result.treeFieldsOption)
    options.treeFieldsOption = initedList.fieldsOption
    datas.listData = initedList.listDatas
    searchOptions = initedList.searchOptions
    params.count = result.count
  } else if (params.type === 'form') {
    params.tables[treeField].offset = params.tables[treeField].limit * page
  }
}

const pageSizeChange = async (size) => {
  if (params.type === 'list') {
    params.offset = 0;
    params.limit = size;
    const result = await loadTreeData(params)  // 加载列表
    const initedList = await initListData(extras, result.listData, result.treeFieldsOption)
    options.treeFieldsOption = initedList.fieldsOption
    datas.listData = initedList.listDatas
    searchOptions = initedList.searchOptions
    params.count = result.count
  } else if (params.type === 'form') {
    params.tables[treeField].offset = params.tables[treeField].limit * page
  }
}

const selectClick = (rows) => {
  for (const button of buttons.buttons) {
    if (button.needRow) {
      button.attributes.invisible = !rows.length;
    }
  }
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

const emits = defineEmits(['objectBtnClick', 'saveClick', 'customClick'])
const objectClick = (name: string) => {   // 处理非创建和编辑按钮点击
  const rows = (listView.value || {}).listTable?.getSelectionRows() || []
  let ids = !!params.id ? [params.id] : rows.map(r => r.id);
  if (!ids.length) {
    ElMessage({
      message: '请至少选择一条记录!',
      type: 'error'
    })
    return false
  }
  callButton({
    model: params.model,
    method: name,
    args: [ids, {'front': true}]
  }).then(res => {
    if (res.error) {
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    emits('objectBtnClick', name, rows, res);
    reload();
    const result = res.result || {};
    if (!!result.report_file) {  // 如果是文件，请求下载
      callFile({
        reportname: result.report_file,
        docids: ids,
        converter: result.report_type,
        name: result.name
      });
    }
  })
}
const searchClick = async (domain) => {  // 搜索数据重置
  params.domain = domain;
  const result = await loadTreeData(params); // 加载列表
  const initedList = await initListData(extras, result.listData, result.treeFieldsOption);
  options.treeFieldsOption = initedList.fieldsOption;
  datas.listData = initedList.listDatas;
  searchOptions = initedList.searchOptions;
  params.count = result.count;
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
  callButton({
    model: params.model,
    method: 'load',
    args: [importFields, result, {'front': true, 'is_cus_code': true}]
  }).then(res => {
    const result = res.result;
    const ids = result.ids;
    const messages = result.messages
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

const addLineClick = (field) => {
  datas.treeData[field].push(JSON.parse(JSON.stringify(emptyDatas[field])))
  params.tables[field].count++;
}
const deleteLineClick = (field, index) => {
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
}

const formatData = function (datas): Object {  // 数据修改和保存格式化处理 发送给后端
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
    for (const treeCopyId of dataCopy.formData[treeField]) {
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
        if (!dataCopy.treeData[treeField][index] || treeData[field] !== dataCopy.treeData[treeField][index][field]) {
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
const saveWrite = (params, savedDatas) => {
  callWrite(params, savedDatas).then(res => {
    if (res.error) {
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    reload();  // 修改后重新加载数据，防止页面数据与数据库不一致
    disabled.value = true;
  })
}
const saveCreate = (params, savedDatas) => {
  callCreate(params, savedDatas).then(res => {
    if (res.error) {
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    disabled.value = true;
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
      let savedDatas = formatData(datas);
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
    emits('saveClick', valid, reload)
  })
}
const customClick = (button) => {
  const rows = (listView.value || {}).listTable?.getSelectionRows() || []
  const ids = rows.map(r => r.id)
  emits('customClick', button, ids, params.model, reload)
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
</style>


