<template>
          <div class="file-content form-input">
            <el-upload
                :class="{'upload-file-edit':readonly || disabled}"
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
import {onchangeField} from "../../../tools";
import {defineEmits} from "vue/dist/vue";
const emits= defineEmits(['fieldOnchange']);
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

const fieldOnchange = (params) => {
  let noChange = false;
  emits('fieldOnchange', params, () => {
    noChange = true
  });
  !noChange && onchangeField(params)
}
</script>

<style lang="less" scoped>

</style>