<template>
<RecordView :params="innerRegisterInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';
let route = useRoute()
const supplier_id = inject('id')
let innerRegisterInfo = reactive({
 id: supplier_id,
  title:  '注册信息',
  type: 'form',
  name: 'supplier_info',
  fields: ['comment', 'approval_remark'],
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