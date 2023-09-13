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
              treeField: treeField,
              datas: data,
              index: index,
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

  <span :style="option.style" class="item-text" :class="{'border-bottom':  viewType==='form'}"
        v-else>{{
      ((option.selection || []).find(r => r[0] === data[field]) || ['　'])[1]
    }}</span>
  <slot></slot>
</template>

<script lang="ts" setup>

import {onchangeField, eventBus} from "../../../tools";

const props = defineProps({
  field: {
    default: ''
  }, viewType: {
    default: 'form'
  }, model: {
    default: 'form'
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
  eventBus.emit('fieldOnchange', params, () => {
    noChange = true
  });
  !noChange && onchangeField(params)
}
</script>

<style lang="less" scoped>
.item-text {
  overflow: hidden;
  width: 100%;
  min-width: 120px;
  text-overflow: ellipsis;
  text-align: left;
}

.border-bottom {
  border-bottom: 1px solid #eef1fa;
}
</style>