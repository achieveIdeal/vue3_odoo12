<template>
  <RecordView :params="bankInfoInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()
const supplier_id = inject('id')

let bankInfoInfo = reactive({
  id: supplier_id,
  title: '银行信息',
  name: 'supplier_info',
  type: 'form',
  fields: ['country_bank', 'name_bank_branch', 'province_bank', 'name_banks', 'city_bank', 'account_bank',
    'name_bank', 'code_bank', 'enclosure_bank', 'enclosure_bank_name'],
  model: 'e2yun.supplier.info',
})
const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {}
  }],

  attributes: {
    enclosure_bank: {
      filename: 'enclosure_bank_name'
    },
    enclosure_bank_name: {
      invisible: true
    }
  }
}
</script>

<style scoped>

</style>