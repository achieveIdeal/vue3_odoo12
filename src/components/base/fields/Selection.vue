<template>
  <el-select v-if="!(readonly|| disabled)" class="form-input"
             v-model="data[field]"
             placeholder="请选择"
             clearable
             collapse-tags
             collapse-tags-tooltip
             filterable
             @change="fieldOnchange({
              field: field,
              datas: data,
              attributes: attrs,
              treeOptions: treeViewFields,
              model: model,
              options: viewFields,
              treeData: treeData
            })"
  >
    <el-option
        v-for="item in option.selection"
        :key="item[0]"
        :disabled="readonly  || disabled"
        :label="item[1]"
        :value="item[0]"/>
  </el-select>

  <span :style="option.style" :class="{'item-text': viewType==='form'}"
        v-else>{{
      !data[field + '_count'] ? ((option.selection || []).find(r => r[0] === data[field]) || [''])[1] : data[field]
    }}</span>
  <slot></slot>
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