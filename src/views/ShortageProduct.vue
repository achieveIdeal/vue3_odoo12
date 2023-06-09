<template>
  <PageHeader title="交货计划"/>
  <RecordView :params="params" :extras="extras" @customClick="customClick"/>
</template>

<script lang="ts" setup>
import RecordView from '../components/RecordView.vue'

import {inject, reactive} from "vue";
import {useRoute} from 'vue-router';
import router from "../router";

let route = useRoute()
const supplier_id = parseInt(inject('supplier_id') || 0);
const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '物料欠料表',
  name: 'shortage_product',
  limit: 12,
  offset: 0,
  domain: [['partner_id', '=', supplier_id]],
  sort: 'id desc',
  count: 0,
  model: 'shortage.product',
  fields:
      ['name','partner_id', 'production_merge_order', 'production_order', 'order_product', 'product_id',
        'product_name', 'need_qty', 'shortage_qty', 'delivery_qty', 'date', 'urgency_date',
        'delete_flag', 'state',
        'in_stock_qty', 'reply_date', 'reply_qry', 'confirm_url'
      ],
  tables: {}
})

const extras = {
  buttons: [{
    type: 'custom',
    showType: ['list'],
    text: '创建交货单',
    classify: 'primary',
    needRow: true,
    attributes: {},
  }
  ],
  search_fields: {
    production_order: {
      domain: []
    },
    product_id: {domain: []},
    date: {domain: []},
  },
  attributes: {},
  invisible: ['urgency_date',
    'delete_flag', 'state', 'partner_id', 'delivery_qty',
    'in_stock_qty'],
  listInvisible: ['urgency_date',
    'delete_flag', 'state',
    'in_stock_qty',]
}

const customClick = (button, rows, models, reload) => {
  const ids = rows.map(r => r.id)
  router.push({
    path: '/delivery_order',
    query: {
      'id': 0,
      'plan_ids': ids,
    }
  })
}
</script>

<style scoped>

</style>
