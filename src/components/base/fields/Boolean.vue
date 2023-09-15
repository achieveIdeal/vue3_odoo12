<template>
  <input type="checkbox" v-model="data[field]"
         v-if="!(readonly || disabled)"
         @change="fieldOnchange({
              field: field,
              datas: data,
              attributes: attrs,
              model: model,
              formModel: formModel,
              formData: formData,
               index: index,
              treeField: treeField,
              options: treeField?treeViewFields[treeField]: viewFields,
              treeOptions: treeViewFields,
              formOptions: viewFields,
              treeData: treeData
            })"/>

  <span :style="option.style" v-else>
  <input type="checkbox" disabled v-model="data[field]">
</span>
</template>

<script lang="ts" setup>

import {onchangeField, eventBus} from "../../../tools";

const props = defineProps({
  field: {
    default: ''
  }, viewType: {
    default: 'form'
  }, model: {
    default: ''
  },  formModel: {
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
  }, formData:{
    type: Object,
    default: {}
  }, treeData: {
    type: Object,
    default: {}
  }, attrs: {
    type: Object,
    default: {}
  },
  option: {
    type: Object,
    default: {}
  }, viewFields: {
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

</style>