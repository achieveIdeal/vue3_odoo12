<template>
  <el-dialog v-model="dialogVisible" :title="actionDialog.name || ''" draggable>
    <RecordView
        ref="record_ref"
        :isDialog="true"
        :dialog_data="dataDialog"
        :action="actionDialog"
        :relation_field="relation_field"
        :fieldViewInfo="fieldViewInfoDialog"
        :formViewInfo="formViewInfoDialog"
        :searchViewInfo="searchViewInfoDialog"
        :arch="archDialog"
        :curViewType="curViewTypeDialog"
        @getDetailClick="getDetailClick"
        @dialogCreateSaveClick="dialogCreateSaveClick"
        @dialogCreateClick="(data, treeData,relation_field)=>dialogCreateClick(data,treeData, relation_field,preDialogReload)"
        @getLineDetailClick="getLineDetailClick"
        @buttonClick="buttonClick"
    />
  </el-dialog>
</template>

<script lang="ts" setup>
import RecordView from '../RecordView.vue'
import {defineExpose, defineProps, ref} from "vue";
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
  }, relation_field: {
    type: String,
  }, preDialogReload: {
    type: Function,
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
  }
})
const dialogVisible = ref(true);
const record_ref = ref({})

const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick', 'selectClick', 'dialogCreateClick'])

const buttonClick = (button, model, datas) => {
  emits('buttonClick', button, model, datas)
}

const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}
const dialogCreateSaveClick = (real_id, data) => {
  preDialogReloadFunc();
}
let preDialogReloadFunc = () => {
};
const dialogCreateClick = (data, treeData, relation_field, preDialogReload) => {
  preDialogReloadFunc = preDialogReload
  for (const field of Object.keys(data.value)) {
    if (field === relation_field) continue;
    data.value[field] = 0
  }
  for (const treeField of Object.keys(treeData.value)) {
    treeData.value[treeField] = []
  }
}

const getLineDetailClick = (dataLine, index, formViewInfo, relation_field) => {
  emits('getLineDetailClick', dataLine, index, formViewInfo, relation_field)
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

defineExpose({
  dialogVisible,record_ref
})
</script>

<style lang="less" scoped>

</style>