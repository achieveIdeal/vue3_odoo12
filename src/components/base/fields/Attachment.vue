<template>
  <div class="file-content form-input">
    <el-upload
        :class="{'upload-file-edit':readonly || disabled}"
        ref="upload"
        :data-index="field"
        action="#"
        :limit="1"
        :file-list="data[filenameField]?[{name: data[filenameField]}]:[]"
        :list-type="option.list_type?.split(',')"
        :on-change="handleFileChange(field)"
        :on-remove="handleFileRemove(field)"
        :on-exceed="handleExceed(field)"
        :auto-upload="false"
        :on-preview="downLoadFile(data[field], data[option.filename])"
        :disabled="readonly  || disabled"
    >
      <template #trigger>
        <el-button v-if="!(readonly || disabled)" type="primary">选择文件
        </el-button>
      </template>
    </el-upload>
  </div>
</template>

<script lang="ts" setup>

import {ref} from "vue";
import {onchangeField, downLoadFile, encodeFileToBase64, eventBus} from "../../../tools";

const props = defineProps({
  field: {
    default: ''
  }, viewType: {
    default: 'form'
  }, model: {
    default: ''
  }, formModel: {
    default: ''
  }, treeField: {
    type: String,
    default: 'text'
  }, index: {
    type: Number,
    default: 0
  },
  data: {
    type: Object,
    default: {}
  },  formData:{
    type: Object,
    default: {}
  },treeData: {
    type: Object,
    default: {}
  }, attrs: {
    type: Object,
    default: {}
  }, viewFields: {
    type: Object,
    default: {}
  },
  option: {
    type: Object,
    default: {}
  }, treeViewFields: {
    type: Object,
    default: {}
  },
  readonly: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'text'
  },
  disabled: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: true
  }
})
const filenameField = ref(props.option.filename);
const handleFileRemove = (field) => () => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === field
  })
  props.data[field] = ''
  props.data[filenameField.value] = ''
  curFile!.clearFiles()
}
const handleFileChange = (field) => async (files) => {
  props.data[field] = await encodeFileToBase64(files.raw);
  if (filenameField.value) {
    props.data[filenameField.value] = files.name
  } else {
    filenameField.value = (props.index || 0) + (props.treeField || 'self') + field
    props.data[filenameField.value] = files.name
  }
  fieldOnchange({
    field: props.field,
    datas: props.data,
    treeField: props.treeField,
    formModel: props.formModel,
    index: props.index,
    formData: props.formData,
    attributes: props.attrs,
    model: props.model,
    options: props.treeField ? props.treeViewFields[props.treeField] : props.viewFields,
    treeOptions: props.treeViewFields,
    formOptions: props.viewFields,
    treeData: props.treeData
  })
}
const handleExceed: UploadProps['onExceed'] = (field) => (files) => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === field
  })
  curFile!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  curFile!.handleStart(file)
}
let loading = ref(false)


const fieldOnchange = (params) => {
  let noChange = false;
  eventBus.emit('fieldOnchange', params, () => {
    noChange = true
  });
  !noChange && onchangeField(params)
}
</script>

<style lang="less" scoped>

</style>