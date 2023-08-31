<template>
  <el-select v-if="!(readonly || disabled)" class="form-input"
             v-model="data[field]"
             placeholder="请选择"
             multiple
             collapse-tags
             :loading="loading"
             collapse-tags-tooltip
             clearable
             filterable
             remote
             @change="fieldOnchange({
              field: field,
              attributes: attributes,
              datas: datas,
              treeOptions: treeOptions,
              model: params.model,
              options: options,
              treeData: treeData
            })"
             :remote-method="searchSelection(option)"
  >
    <el-checkbox
        class="check-all-box"
        :id="'check-all-box' + field"
        v-model="checkAll"
        @change="handleCheckAllChange(field)"
    />
    <label :for="'check-all-box' + field">全选</label>
    <el-option
        v-for="item in options.selection"
        :key="item[0]"
        :label="item[1]"
        :value="item[0]"
    ></el-option>
  </el-select>
  <span :style="option.style"
        :class="{'item-text': viewType==='form'}"
        v-else>{{
      (option.selection || []).filter(r => (data[field] || []).includes(r[0])).map(r => r[1]).join(', ')
    }}</span>
  <slot></slot>
</template>

<script lang="ts" setup>
import {searchFieldSelection} from "../../tools";

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