<template>
  <el-input-number
      v-if="!(readonly  || disabled)"
      v-model="data[field]"
      class="form-input"
      :precision="option.precision"
      controls-position="right"
      :min="option.min"
      :max="option.max"
      @change="fieldOnchange({
              field: field,
              datas: data,
              attributes: attrs,
              model: model,
              options: viewFields,
              treeOptions: treeViewFields,
              treeData: treeData
            })"
  />

  <span :style="option.style" :class="{'item-text': viewType==='form'}"
        v-else>{{
      (data[field] || 0).toFixed(option.precision)
    }}
</span>
</template>

<script lang="ts" setup>

import {onchangeField} from "../../../tools";
import {defineEmits} from "vue/dist/vue";

const emits = defineEmits(['fieldOnchange']);
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
  }, treeData: {
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

const fieldOnchange = (params) => {
  let noChange = false;
  emits('fieldOnchange', params, () => {
    noChange = true
  });
  !noChange && onchangeField(params)
}
</script>

<style lang="less" scoped>
.item-text {
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis;
  text-align: left;
}
</style>