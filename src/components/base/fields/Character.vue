<template>
  <el-input v-if="!(readonly|| disabled)" v-model="data[field]" :type="option.type"
            class="form-input"
            clearable
            @change="fieldOnchange({
              field: field,
              datas: data,
              attributes: attrs,
              model: model,
              options: viewFields,
              treeOptions: treeViewFields,
              treeData: treeData
            })"
            :maxlength="option.maxlength"/>
  <span :style="option.style" class="item-text" :class="{'border-bottom':  viewType==='form'}"
        v-else>{{ data[field] || '　' }}</span>
  <slot></slot>

</template>


<script lang="ts" setup>

import {defineProps} from "vue";
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

.border-bottom {
  border-bottom: 1px solid #eef1fa;
}
</style>