<template>
  <template v-if="!Object.keys(treeViewFields).includes(field)">  <!--表格数据的抬头字段不需要显示，但需要加载它的子元素们-->
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
              treeField: treeField,
              index: index,
              attributes: attrs,
              formModel: formModel,
              datas: data,
              formData: formData,
              options: treeField?treeViewFields[treeField]: viewFields,
              treeOptions: treeViewFields,
              formOptions: viewFields,
              model: model,
              options: viewFields,
              treeData: treeData
            })"
               @focus="preSearchSelect(options)"
               @blur="()=>{}"
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
          v-for="item in option.selection"
          :key="item[0]"
          :label="item[1]"
          :value="item[0]"
      ></el-option>
    </el-select>
    <span :style="option.style"
          class="item-text" :class="{'border-bottom':  viewType==='form'}"
          v-else>{{
        (option.selection || []).filter(r => (data[field] || []).includes(r[0])).map(r => r[1]).join(', ')
      }}</span>
  </template>
  <slot></slot>
</template>

<script lang="ts" setup>
import {onchangeField, searchFieldSelection, eventBus} from "../../../tools";
import {ref} from "vue";

const checkAll = ref(false);
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
  }, formModel: {
    default: ''
  }, formData:{
    type: Object,
    default: {}
  },
  data: {
    type: Object,
    default: {}
  },
  treeData: {
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
const loading = ref(false)
const searchSelection = (option) => (query: string) => {
  loading.value = true;
  checkAll.value = false;
  searchFieldSelection(props.field, option, query, [], 100).then(r => {
    loading.value = false;
  }, props.data);
}
const preSearchSelect = async (option) => {
  loading.value = true;
  checkAll.value = false;
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
  width: 100%;
  min-width: 120px;
  text-overflow: ellipsis;
  text-align: left;
}

.border-bottom {
  border-bottom: 1px solid #eef1fa;
}
</style>