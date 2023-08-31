<template>
  <RecordView :params="baseInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

const supplier_id = inject('id')

let route = useRoute()
let baseInfo = reactive({
  id: supplier_id,
  type: 'form',
  title: '供应商基础信息',
  name: 'supplier_info',
  limit: 20,
  offset: 0,
  domain: [],
  count: 0,
  model: 'e2yun.supplier.info',
  fields: ['listed_company', 'name', 'supplier_code', 'company_name', 'order_code',
    'mobile', 'nature_enterprise', 'registered_address', 'email', 'annual_turnover', 'fax', 'employees',
    'website', 'supplier_group_id', 'vat', 'country_id', 'state_id', 'city', 'street2', 'company_profile',
    'account_tax_id', 'authenitcation_id'],
  tables: {
    authenitcation_id: {
      title: '认证信息',
      limit: 20,
      offset: 0,
      domain: [],
      count: 0,
      model: 'e2yun.supplier.authentication.info',
      fields: ['authentication_type', 'name', 'image', 'image_name',
        'code', 'start_date', 'end_date', 'remark'],
    }
  }
})
const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {}
  }],
  attributes: {
    authenitcation_id: {
      fields: {
        image: {
          filename: 'image_name'
        }
      },
      readonly: [['authenitcation_id.name', '=', '3']]
    },
  }
}

</script>

<style scoped>

</style>