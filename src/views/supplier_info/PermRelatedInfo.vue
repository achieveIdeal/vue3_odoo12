<template>
  <RecordView :params="permRelatedInfo" :extras="extras"/>
</template>

<script lang="ts" setup>
import {inject, reactive} from "vue";
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()
const supplier_id = inject('id')
let permRelatedInfo = reactive({
  id: supplier_id,
  title: '权限信息',
  name: 'supplier_info',
  type: 'form',
  fields: ['if_edit',
    'if_authenticity_buttons', 'if_authentication_group_build_buttons',
    'if_qualifications_buttons', 'if_nominated_document_commit_buttons',
    'if_scene_buttons', 'if_basic_agreement_commit_buttons', 'if_liable_user_rollback_to_supplier_create_button'],
  model: 'e2yun.supplier.info'
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