<template>
  <RecordView :params="productInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()
const supplier_id = inject('id')
let productInfo = reactive({
  id: supplier_id,
  title: '产品信息',
  type: 'form',
  name: 'supplier_info',
  fields: ['supplier_category_ids', 'admit_pass', 'comment', 'is_agent','supplier_admit_data_ids'],
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