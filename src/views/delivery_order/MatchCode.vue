<template>
  <RecordView :params="params" :extras="extras" @selectClick="selectClick" @loadedCallable="loadedCallable"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {defineEmits, inject, reactive, ref} from "vue";
import {useRoute} from 'vue-router';

const supplier_id = parseInt(inject('supplier_id') || 0);
let route = useRoute()
let date_from = ref('');
const params = reactive({
  id: 0,
  classify: 'list',
  title: '匹配赋码',
  name: 'delivery_order',
  hideDetail: true,
  limit: 12,
  offset: 0,
  domain: [['supplier_id', '=', supplier_id]],
  sort: 'id desc',
  count: 0,
  model: 'srm.coding',
  fields: [
    'name',
    'default_code',
    'product_name',
    'produce_number',
    'amount',
    'min_pack_size',
    'date_from',
    'shelf_life',
    'manufacturer_id',
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
  attributes: {
    amount: {
      sum: true
    }
  },
  readonly: ['name', 'default_code', 'product_name', 'produce_number', 'amount', 'min_pack_size',
    'date_from', 'shelf_life', 'manufacturer_id'],
}

const emits = defineEmits(['loadedCallback', 'selectClick'])
const loadedCallable = (init) => {
  emits('loadedCallback', init)
}
const selectClick = (rows) => {
  emits('selectClick', rows)
}
</script>

<style scoped>

</style>