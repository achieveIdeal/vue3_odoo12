<template>
  <el-input v-if="!(readonly|| disabled)" v-model="data[field]" :type="option.type"
            class="form-input"
            clearable
            :maxlength="option.maxlength"/>
  <span :style="option.style" :class="{'item-text': viewType==='form'}" v-else>{{ data[field] }}</span>
  <slot></slot>

</template>


<script lang="ts" setup>

import {defineProps, ref} from "vue";

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
.item-text {
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis;
  text-align: left;
}
</style>