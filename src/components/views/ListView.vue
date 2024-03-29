<template>
  <el-form
      ref="formRef"
      :inline="true"
      :model="treeData['self']"
      label-position="left"
      label-width="120px"
      style="width: 100%"
      class="form-inline">
    <TableView
        ref="tableview_ref"
        :action="action"
        :isDialog="isDialog"
        :treeData="treeData"
        :dataCount="dataCount"
        :model="model"
        :fields="fields['self']"
        :arch="arch"
        :treeField="'self'"
        :treeViewFields="{'self': viewFields}"
        :formViewInfo="formViewInfo"
        :disabled="disabled"
        :loading="loading"
        @getDetailClick="getDetailClick"
        @selectClick="selectClick"
        @deleteLineClick="deleteLineClick"
        @addLineClick="addLineClick"
        @pageSizeChange="pageSizeChange"
        @pageChange="pageChange"
        @loadGroupDetail="loadGroupDetail"
        @sortByClick="sortByClick"
    />
  </el-form>
</template>

<script lang="ts" setup>
import {defineEmits, defineExpose, defineProps, computed, ref, onMounted, watch} from "vue";
import {callParseDomain, callSearchRead} from "../../service/module/call";
import {initListData, setFormAttribute} from "../../tools/init";
import TableView from './TableView.vue'
import {eventBus} from "../../tools";

const props = defineProps({
  model: {
    type: String,
    default: '',
  }, action: {
    type: Object,
    default: {},
  }, extras: {
    type: Object,
  },
  arch: {
    type: Object || String,
    default: {}
  },
  viewFields: {
    type: Object,
    default: {}
  }, formViewInfo: {
    type: Object,
    default: {}
  }, fieldViewInfo: {
    type: Object,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  }, isDialog: {
    type: Boolean,
    default: true
  }, loading: {
    type: Boolean,
    default: true
  }
})
const emits = defineEmits(['getDetailClick', 'selectClick', 'fieldOnchange', 'dataLoadedCallback',
  'deleteLineClick', 'addLineClick', 'pageSizeChange', 'pageChange', 'groupbyClick', 'loadGroupDetail', 'sortByClick'])

const tableview_ref = ref('')
const dataCount = ref(0);
const treeData = ref({})
const fields = ref({})

const getFields = () => {
  const arch = props.arch;
  const fields = {self: []};
  const recursion = (arch) => {
    for (const children of (arch.children instanceof Array ? arch.children : [])) {
      if (children.tag === 'field') {
        fields.self.push(children.attrs.name)
      }
      if (children.children.length) {
        recursion(children)
      }
    }
  }
  recursion(arch)
  return fields
}

const main = async () => {
  fields.value = await getFields()
  if (props.extras) {
    setFormAttribute(props.extras, props.viewFields)
  }
  if (!(props.action.domain instanceof Array)) {
    props.action.domain = await callParseDomain(props.action.domain);
  }
  eventBus.emit('requestCallback')
  callSearchRead({
    model: props.model,
    fields: Object.keys(props.viewFields),
    offset: 0,
    sort: props.arch.attrs?.default_order,
    limit: props.action.limit || props.arch.attrs.limit,
    domain: props.action.domain || [],
  }).then(async res => {
    dataCount.value = res.length || 0;
    treeData.value['self'] = await initListData(res.records, props.viewFields);
    eventBus.emit('responseCallback')
    emits('dataLoadedCallback', treeData, ref({}), dataCount)
  })
}
main();

const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const pageSizeChange = (treeField, size, curSize) => {
  if (dataCount.value < size && curSize > dataCount.value) return;
  emits('pageSizeChange', treeField, size, fields)
}
const pageChange = (treeField, currentPage, pageSize, fields) => {
  emits('pageChange', treeField, currentPage, pageSize, fields)
}
const selectClick = (rows) => {
  emits('selectClick', rows)
}
const deleteLineClick = (treeField, index, treeData, row, noAddCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noAddCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

const fieldOnchange = (params, noChange) => {
  emits('fieldOnchange', params, noChange)
}

const sortByClick = (field, sort_method) => {
  emits('sortByClick', field, sort_method)
}

const loadGroupDetail = (row, treeNode, resolve) => {
  if (row.__context?.group_by) {
    emits('groupbyClick', row, treeNode, resolve)
  } else {
    emits('loadGroupDetail', row, treeNode, resolve)
  }
}
defineExpose({
  tableview_ref, treeData: treeData['self'], main
})
</script>

<style lang="less" scoped>

</style>