<template>
  <PageHeader title="交货计划"/>
  <RecordView :params="params" :extras="extras" @customClick="customClick"/>
</template>

<script lang="ts" setup>
import RecordView from '../components/RecordView.vue'

import {inject, reactive} from "vue";
import router from "../router";
import {callButton} from "../service/module/call";
import {ElMessage} from "element-plus";

const supplier_id = parseInt(inject('supplier_id') || 0);
const params = reactive({
  title: '物料欠料表',
  name: 'shortage_product',
  domain: [['partner_id', '=', supplier_id]],
  model: 'shortage.product',
  fields:
      ['name', 'partner_id', 'product_id','product_name', 'need_qty',
        'shortage_qty', 'delivery_qty', 'delivery_day', 'date', 'urgency_date',
        'delete_flag', 'state', 'delivery_state', 'in_stock_qty', 'reply_date',
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
    production_order: {},
    delivery_state: {
      default: ['undone']
    },
    product_id: {
      noSelect: true
    },
    date: {},
  },
  attributes: {
    need_qty: {
      precision: 3
    }
  },
  invisible: ['urgency_date', 'delivery_state', 'delete_flag', 'state', 'partner_id'],
  listInvisible: ['urgency_date', 'delete_flag', 'state', 'partner_id', 'in_stock_qty']
}

const customClick = async (button, rows, loading) => {
  const ids = rows.map(r => r.id)
  const plan_ids = ids instanceof Array ? ids : [ids];
  loading.value = true;
  const res = await callButton({
    model: params.model,
    method: 'check_can_create_delivery_order',
    args: [plan_ids]
  })
  if (res.error) {
    loading.value = false;
    ElMessage({
      message: res.error.data.message,
      type: 'error'
    });
    return false
  }
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
