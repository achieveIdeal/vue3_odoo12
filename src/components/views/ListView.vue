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
        :treeData="treeData"
        :model="model"
        :arch="arch"
        :viewFields="viewFields"
        :formViewInfo="formViewInfo"
        :disabled="disabled"
        :loading="loading"
        @getDetailClick="getDetailClick"
        @selectClick="selectClick"
    />
  </el-form>
</template>

<script lang="ts" setup>
import {defineEmits, defineExpose, defineProps, onMounted, ref} from "vue";
import {callRead, callSearchRead} from "../../service/module/call";
import {initListData} from "../../tools/init";
import TableView from './TableView.vue'

const props = defineProps({
  model: {
    type: String,
    default: '',
  }, action: {
    type: Object,
    default: {},
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
const emits = defineEmits(['getDetailClick', 'selectClick','dataLoadedCallback'])

const tableview_ref = ref('')
const dataCount = ref(0);
const treeData = ref({})
callSearchRead({
  model: props.model,
  fields: Object.keys(props.viewFields),
  offset: 0,
  limit: props.action.limit,
  domain: props.action.domain || [],
}).then(async res => {
  dataCount.value = res.length || 0;
  treeData.value['self'] = await initListData(res.records, props.viewFields);
  emits('dataLoadedCallback', treeData.value['self'])
})


const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const handleSizeChange = () => {

}
const handleCurrentChange = () => {
}
const selectClick = (rows) => {
  emits('selectClick', rows)
}
defineExpose({
  tableview_ref, treeData: treeData['self']
})
</script>

<style lang="less" scoped>

</style>