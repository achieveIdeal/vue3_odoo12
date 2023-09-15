<template>
  <el-input v-if="!(readonly|| disabled)" v-model="data[field]" :type="option.type"
            class="form-input"
            clearable
            @change="fieldOnchange({
              field: field,
              datas: data,
              treeField: treeField,
              formModel: formModel,
              index: props.index,
              formData: formData,
              attributes: attrs,
              model: model,
              options: treeField?treeViewFields[treeField]: viewFields,
              treeOptions: treeViewFields,
              formOptions: viewFields,
              treeData: treeData
            })"
            :maxlength="option.maxlength"/>
  <span :style="option.style" class="item-text" :class="{'border-bottom':  viewType==='form'}"
        v-else>{{ data[field] || '　' }}</span>
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
    default: ''
  }, formModel: {
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
  },  formData:{
    type: Object,
    default: {}
  },treeData: {
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