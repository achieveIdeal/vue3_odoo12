<template>
  <el-select v-if="!(readonly || disabled)" class="form-input alien-left"
             v-model="value_id"
             placeholder="请选择"
             clearable
             filterable
             remote
             :loading="loading"
             @focus="preSearchSelect(option)"
             @blur="()=>{}"
             :remote-method="searchSelection(option)"
  >
    <el-option
        v-for="item in selection"
        :key="item[0]"
        :disabled="readonly  || disabled"
        :label="item[1]"
        :value="item[0]"/>
  </el-select>
  <span :style="option.style"
        class="item-text" :class="{'border-bottom':  viewType==='form'}"
        v-else> {{
      value_name
    }}</span>
  <slot></slot>
</template>

<script lang="ts" setup>
import {onchangeField, eventBus, searchFieldSelection} from "../../../tools";
import {computed, onMounted, ref} from "vue";
import {callKw, callNames} from "../../../service/module/call";

const props = defineProps({
  field: {
    default: ''
  }, viewType: {
    default: 'form'
  }, model: {
    default: 'form'
  }, formModel: {
    default: ''
  }, index: {
    type: Number,
    default: 0
  }, formData: {
    type: Object,
    default: {}
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

const value_id = computed({
  get() {
    if (props.data[props.field] instanceof Array) {
      return props.data[props.field][0] || ''
    }
    return ''
  },
  set(value) {
    props.data[props.field] = [];
    if (!value) {
      props.data[props.field] = value;
    } else {
      props.data[props.field][0] = value;
      props.data[props.field][1] = selection.value.find(r => r[0] === value)[1];
    }
    const treeField = props.treeField
    const viewFields = props.viewFields
    const treeViewFields = props.treeViewFields
    fieldOnchange({
      field: props.field,
      treeField: treeField,
      datas: props.data,
      formModel: props.formModel,
      formData: props.formData,
      index: props.index,
      attributes: props.attrs,
      options: treeField ? treeViewFields[treeField] : viewFields,
      treeOptions: treeViewFields,
      formOptions: viewFields,
      model: props.model,
      treeData: props.treeData
    })
  }
})

const selectVals = ref([])

const selection = computed({
  get() {
    return selectVals.value.concat(!!props.data[props.field] && [props.data[props.field]] || [])
  },
  set(value) {
    selectVals.value = value
  }
})

const value_name = computed(() => {
  const select = selection.value.find(r => r[0] === props.data[props.field][0]);
  return select && select[1] || '　'
})


const loading = ref(false);

const searchNames = async (option, query: string) => {
  loading.value = true;
  return searchFieldSelection(props.field, option, query, [], 100, props.data)
}

const searchSelection = (option) => (query) => {
  searchNames(option, query).then(res => {
    loading.value = false;
    selection.value = res;
  })
}

const preSearchSelect = async (option) => {
  searchNames(option, '').then(res => {
    loading.value = false;
    selection.value = res;
  })
}

const fieldOnchange = async (params) => {
  let noChange = false;
  eventBus.emit('fieldOnchange', params, () => {
    noChange = true
  });
  return !noChange && onchangeField(params)
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