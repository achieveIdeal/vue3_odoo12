<template>
  <RecordView :params="purchaseInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()
const supplier_id = inject('id')
let purchaseInfo = reactive({
  id: supplier_id,
  title: '采购信息',
  type: 'form',
  name: 'supplier_info',
  fields: ['if_temp_date_price', 'company_id', 'purchase_organize_id', 'payment_term_id',
    'currency_type', 'account_incoterms_id', 'delivery_place', 'liable_user'],
  model: 'e2yun.supplier.info',
})
const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {}
  }]
}
</script>

<style scoped>

</style>