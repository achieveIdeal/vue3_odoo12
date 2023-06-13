<template>
  <RecordView :params="params" :extras="extras" @loadedCallable="loadedCallable" @customClick="customClick"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {inject, reactive} from "vue";
import {useRoute} from 'vue-router';

const supplier_id = parseInt(inject('supplier_id') || 0);
let route = useRoute()
const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '匹配采购订单',
  name: 'delivery_order',
  limit: 20,
  offset: 0,
  domain: [['partner_id', '=', supplier_id]],
  sort: 'id desc',
  count: 0,
  model: 'match.purchase.order',
  fields: ['product_id', 'product_name', 'amount_planned', 'partner_id', 'match_line_ids', 'comment'],
  tables: {
    match_line_ids: {
      title: '匹配明细行',
      limit: 10,
      offset: 0,
      domain: [],
      sort: 'id desc',
      count: 0,
      model: 'match.purchase.order.line',
      fields: ['purchase_order_id', 'purchase_order_name', 'purchase_order_line_id', 'amount', 'uom_id'],
    }
  }
})

const extras = {
  buttons: [
    {
      type: 'custom',
      method: 'save_match_po',
      showType: ['form'],
      classify: 'primary',
      text: '保存',
      show: true,
      attributes: {},
    },
    {
      type: 'custom',
      method: 'cancel',
      show: true,
      showType: ['form'],
      text: '取消',
      attributes: {},
    }
  ],
  attributes: {
    match_line_ids: {
      undel: true,
      unadd: true,
      fields: {
        readonly: ['product_id', 'product_name', 'amount_planned', 'partner_id', 'match_line_ids'],
        invisible: ['purchase_order_name'],
        amount: {
          sum: true
        }
      }
    }
  },
  readonly: ['product_id', 'product_name', 'amount_planned', 'partner_id', 'match_line_ids'],
}

const emits = defineEmits(['loadedCallback', 'customClick'])
const loadedCallable = (init, loading) => {
  emits('loadedCallback', init, loading)
}

const customClick = (button, datas, reload, loading)=>{
  emits('customClick', button, datas, reload, loading);
}

</script>

<style scoped>

</style>