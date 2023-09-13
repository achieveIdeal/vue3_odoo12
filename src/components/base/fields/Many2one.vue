<template>
  <el-select v-if="!(readonly || disabled)" class="form-input alien-left"
             v-model="data[field]"
             placeholder="请选择"
             clearable
             filterable
             remote
             :loading="loading"
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
             @focus="preSearchSelect(option)"
             @blur="()=>{}"
             :remote-method="searchSelection(option)"
  >
    <el-option
        v-for="item in option.selection"
        :key="item[0]"
        :disabled="readonly  || disabled"
        :label="item[1]"
        :value="item[0]"/>
  </el-select>

  <span :style="option.style"
        class="item-text" :class="{'border-bottom':  viewType==='form'}"
        v-else> {{
      data[field]?.length ? data[field][1] : '　'
    }}</span>
  <slot></slot>
</template>

<script lang="ts" setup>
import {onchangeField, eventBus, searchFieldSelection} from "../../../tools";
import {ref} from "vue";

const props = defineProps({
  field: {
    default: ''
  }, viewType: {
    default: 'form'
  }, model: {
    default: 'form'
  },index: {
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
  }, treeField: {
    type: String,
    default: 'text'
  },
  loading: {
    type: Boolean,
    default: true
  }
})
const loading = ref(false);
const searchSelection = (option) => (query: string) => {
  loading.value = true;
  searchFieldSelection(props.field, option, query, [], 100).then(r => {
    loading.value = false;
  }, props.data);
}
const preSearchSelect = async (option) => {
  loading.value = true;
  searchFieldSelection(props.field, option, '', [], 100).then(r => {
    loading.value = false;
  });
}
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
  min-width: 120px;
  width: 100%;
  text-overflow: ellipsis;
  text-align: left;
}

.border-bottom {
  border-bottom: 1px solid #eef1fa;
}
</style>