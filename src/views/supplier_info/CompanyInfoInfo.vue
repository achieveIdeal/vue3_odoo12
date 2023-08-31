<template>
  <RecordView :params="companyInfoInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()
const supplier_id = inject('id')
let companyInfoInfo = reactive({
  id: supplier_id,
  title: '公司信息',
  name: 'supplier_info',
  type: 'form',
  fields: ['image_company', 'found_date', 'organization_chart',
    'registered_capital', 'image_product'],
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
    image_company: {
      filename: 'bb'
    },
    organization_chart: {
      filename: 'aa'
    },
    registered_capital: {
      filename: 'cc'
    }
  }
}
</script>

<style scoped>

</style>