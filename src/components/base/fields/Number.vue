<template>
  <el-input-number
      v-if="!(readonly  || disabled)"
      v-model="datas[field]"
      class="form-input"
      :precision="option.precision"
      controls-position="right"
      :min="option.min"
      :max="option.max"
      @change="fieldOnchange({
              field: field,
              datas: datas,
              attributes: attributes,
              model: params.model,
              options: options,
              treeOptions: treeOptions,
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