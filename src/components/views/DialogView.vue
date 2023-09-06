<template>
  <el-dialog v-model="dialogVisible" :title="actionDialog.name || ''" draggable
             @close="(e)=>closeDialog(e, index)">
    <RecordView
        :isDialog="true"
        :res_data="dataDialog"
        :action="actionDialog"
        :fieldViewInfo="fieldViewInfoDialog"
        :formViewInfo="formViewInfoDialog"
        :searchViewInfo="searchViewInfoDialog"
        :arch="archDialog"
        :curViewType="curViewTypeDialog"
        @getDetailClick="getDetailClick"
        @getLineDetailClick="getLineDetailClick"
        @buttonClick="buttonClick"
    />
  </el-dialog>
</template>

<script lang="ts" setup>
import RecordView from '../RecordView.vue'
import {defineProps, ref} from "vue";
import {defineEmits} from "vue/dist/vue";


const props = defineProps({
  archDialog: {
    type: Object,
    default: {}
  }, actionDialog: {
    type: Object,
    default: {}
  }, dataDialog: {
    type: Object,
  },
  curViewTypeDialog: {
    type: String,
    default: ''
  },
  fieldViewInfoDialog: {
    type: Object,
    default: {}
  }, formViewInfoDialog: {
    type: Object,
    default: {}
  }, searchViewInfoDialog: {
    type: Object,
    default: {}
  }, index: {
    type: Number,
    default: 0
  }, visible: {
    type: Boolean,
    default: false
  }
})
const dialogVisible = ref(props.visible)


const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick', 'selectClick', 'closeDialog'])

const buttonClick = (button, model, datas) => {
  emits('buttonClick', button, model, datas)
}
const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}

const closeDialog = (e, index) => {
  emits('closeDialog', e, index)
}

const selectClick = (rows) => {
  const dataVal = {};
  for (const row of rows) {
    for (const field of Object.keys(row)) {
      !dataVal[field] ? dataVal[field] = [] : '';
      dataVal[field].push(row[field])
    }
  }
  data.value = dataVal;
  emits('selectClick', rows)
}
</script>

<style lang="less" scoped>

</style>