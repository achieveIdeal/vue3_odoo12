<template>
  <el-select v-if="!(readonly || disabled)" class="form-input alien-left"
             v-model="data[field][0]"
             placeholder="请选择"
             clearable
             filterable
             remote
             :loading="loading"
             @change="fieldOnchange({
              field: field,
              datas: data,
              attributes: attrs,
              treeOptions: treeOptions,
              model: model,
              options: option,
              treeData: treeData
            })"
             :remote-method="searchSelection(option)"
  >
    <el-option
        v-for="item in option.selection"
        :key="item[0]"
        :disabled="parseDomain(option.readonly, datas)  || disabled"
        :label="item[1]"
        :value="item[0]"/>
  </el-select>

  <span :style="option.style"
        :class="{'item-text': viewType==='form'}"
        v-else> {{
      data[field]?.length ? data[field][1] : ''
    }}</span>
  <slot></slot>
</template>

<script lang="ts" setup>
import {onchangeField, searchFieldSelection} from "../../../tools";

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

const searchSelection = (field, option: FieldOptionType, datas) => (query: string, w) => {
  loading.value = true;
  checkAll.value = false;
  searchFieldSelection(field, option, query, [], option.limit).then(r => {
    loading.value = false;
  }, datas);
}
const fieldOnchange = (params) => {
  let noChange = false;
  emits('fieldOnchange', params, () => {
    noChange = true
  });
  !noChange && onchangeField(params, checkAll)
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