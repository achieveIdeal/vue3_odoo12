<template>
  <el-form
      ref="formRef"
      :inline="true"
      :model="datas"
      label-position="left"
      label-width="120px"
      style="width: 100%"
      class="form-inline">
    <TableView
        ref="tableview_ref"
        v-if="datas.length"
        :action="action"
        :model="model"
        :arch="arch"
        :res_datas="datas"
        :viewFields="viewFields"
        :formViewInfo="fromViewInfo"
        :disabled="disabled"
        @getDetailClick="getDetailClick"
    />
  </el-form>
</template>

<script lang="ts" setup>
import {defineEmits, defineExpose, defineProps, ref} from "vue";
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
  }, data: {
    type: Object,
  },
  viewFields: {
    type: Object,
    default: {}
  }, fromViewInfo: {
    type: Object,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  }, isDialog: {
    type: Boolean,
    default: true
  }
})
const tableview_ref = ref('')
const dataCount = ref(0);
const datas = ref([])
if (!props.isDialog && !props.data) {
  callSearchRead({
    model: props.model,
    fields: Object.keys(props.viewFields),
    offset: 0,
    limit: props.action.limit,
    domain: props.action.domain || [],
  }).then(async res => {
    dataCount.value = res.length || 0;
    datas.value = await initListData(res.records, props.viewFields);
  })
} else if (props.data) {
  datas.value = props.data;
}


const emits = defineEmits(['getDetailClick'])

const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const handleSizeChange = () => {

}
const handleCurrentChange = () => {
}

defineExpose({
  tableview_ref
})
</script>

<style lang="less" scoped>

</style>