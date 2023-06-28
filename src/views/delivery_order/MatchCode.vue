<template>
  <RecordView :params="params" :extras="extras" @selectClick="selectClick" @loadedCallable="loadedCallable"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {defineEmits, inject, reactive, ref} from "vue";

const supplier_id = parseInt(inject('supplier_id') || 0);
let date_from = ref('');
const params = reactive({
  classify: 'list',
  title: '匹配赋码',
  name: 'delivery_order',
  hideDetail: true,
  domain: [['supplier_id', '=', supplier_id], ['delivery_order_line_id', '=', false],
    ['if_print', '=', true], ['is_generate', '=', true]],
  count: 0,
  height: 270,
  model: 'srm.coding',
  groupby: 'outer_pack_id',
  fields: [
    'outer_pack_id',
    'name',
    'default_code',
    'product_name',
    'amount',
    'min_pack_size',
    'date_from',
  ],
  tables: {}
})

const extras = {
  buttons: [
    {
      type: 'custom',
      method: 'save_match_code',
      showType: ['list'],
      classify: 'primary',
      text: '保存',
      show: true,
      attributes: {},
    },
    {
      type: 'custom',
      method: 'cancel',
      show: true,
      showType: ['list'],
      text: '取消',
      attributes: {},
    }
  ],
  groupby: ['outer_pack_id'],
  search_fields: {
    date_from: {
      width: 140
    },
    name: {},
    outer_pack_id: {
      noSelect: true
    }
  },
  attributes: {
    amount: {
      sum: true
    },
    name: {
      width: 200
    },
    outer_pack_id: {
      width: 250
    },
    default_code: {
      width: 110
    },
    date_from:{
      width:110
    }
  },
  readonly: ['name', 'default_code', 'product_name', 'produce_number', 'amount', 'min_pack_size',
    'date_from', 'shelf_life', 'manufacturer_id'],
}

const emits = defineEmits(['loadedCallback', 'selectClick'])
const loadedCallable = (init, loading, noInit) => {
  noInit()
  emits('loadedCallback', init, loading)
}
const selectClick = (rows, loading) => {
  emits('selectClick', rows, loading)
}
</script>

<style scoped>

</style>