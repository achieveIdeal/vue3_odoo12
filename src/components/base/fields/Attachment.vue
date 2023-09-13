<template>
  <div class="file-content form-input">
    <el-upload
        :class="{'upload-file-edit':readonly || disabled}"
        ref="upload"
        :data-index="field"
        action="#"
        :limit="1"
        :file-list="data[option[field]?.filename]?[{name: data[option[field].filename]}]:[]"
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
import {onchangeField, downLoadFile, encodeFileToBase64,eventBus} from "../../../tools";

const props = defineProps({
  field: {
    default: ''
  }, viewType: {
    default: 'form'
  }, model: {
    default: 'form'
  },
  data: {
    type: Object,
    default: {}
  }, attrs: {
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
  },  treeField: {
    type: String,
    default: 'text'
  },
  disabled: {
    type: Boolean,
    default: true
  }, index: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: true
  }
})

const handleFileRemove = (field) => () => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === field
  })
  props.datas[field] = ''
  props.datas[props.options[field].filename] = ''
  curFile!.clearFiles()
}
const handleFileChange = (field) => async (files) => {
  const file = files as UploadRawFile;
  props.datas[field] = await encodeFileToBase64(file.raw);
  props.datas[props.options[field].filename] = file.name
  // fieldOnchange()
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