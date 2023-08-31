<template>
  <div class="file-content form-input">
    <el-upload
        :class="{'upload-file-edit':parseDomain(option.readonly, datas) || disabled}"
        ref="upload"
        :data-index="field"
        action="#"
        :limit="1"
        :file-list="datas[options[field].filename]?[{name: datas[options[field].filename]}]:[]"
        :list-type="option.list_type?.split(',')"
        :on-change="handleFileChange(field)"
        :on-remove="handleFileRemove(field)"
        :on-exceed="handleExceed(field)"
        :auto-upload="false"
        :on-preview="downLoadFile(datas[field], datas[option.filename])"
        :disabled="parseDomain(option.readonly, datas)  || disabled"
    >
      <template #trigger>
        <el-button v-if="!(parseDomain(option.readonly, datas) || disabled)" type="primary">选择文件
        </el-button>
      </template>
    </el-upload>
  </div>
</template>

<script lang="ts" setup>

import {defineProps} from "vue/dist/vue";

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
  }
})
</script>

<style lang="less" scoped>

</style>