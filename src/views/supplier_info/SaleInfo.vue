<template>
  <RecordView :params="saleInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()

const supplier_id = inject('id')
let saleInfo = reactive({
  id: supplier_id,
  title: '销售信息',
  type: 'form',
  name: 'supplier_info',
  fields: ['customer', 'user_id', 'property_delivery_carrier_id',
    'message_bounce', 'property_payment_term_id',],
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