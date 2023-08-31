<template>
  <input type="checkbox" v-model="datas[field]"
         v-if="!(readonly || disabled)"
         @change="fieldOnchange({
              field: field,
              datas: datas,
              attributes: attributes,
              model: params.model,
              treeOptions: treeOptions,
              options: options,
              treeData: treeData
            })"/>

  <span :style="option.style" v-else>
  <input type="checkbox" disabled v-model="data[field]">
</span>
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