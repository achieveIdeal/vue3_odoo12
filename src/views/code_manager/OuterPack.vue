<template>
  <RecordView :params="params" :extras="extras"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {reactive} from "vue";
import {useRoute} from 'vue-router';

let route = useRoute()
const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '赋码(外箱包装)',
  name: 'outer_pack',
  limit: 12,
  offset: 0,
  domain: [],
  count: 0,
  model: 'srm.coding.outer.pack',
  fields: [
    'name',
    'product_id',
    'product_name',
    'amount',
    'state',
    'min_pack_size',
    'min_pack_ids',
  ],
  import_fields: ['product_id', 'product_name', 'min_pack_size', 'amount', 'min_pack_ids'],
  tables: {}
})

const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {}
  }, {
    type: 'create',
    text: '创建',
    showType: ['list', 'form']
  }, {
    type: 'object',
    method: 'print_code',
    showType: ['form', 'list'],
    text: '打印',
    needRow: true,
    attributes: {},
  }, {
    type: 'import',
    showType: ['list'],
    text: '导入',
    template: '/stock_manager/download_template/outer',
    attributes: {},
  }
  ],
  search_fields: {
    product_id: {
      domain: []
    }
  },
  attributes: {
    min_pack_ids: {
      domain: [['is_generate', '=', true]]
    },
    product_id: {
      readonly: [['state', '=', 'done']]
    }
  },
  invisible: ['state'],
  readonly: ['name', 'product_name', 'name', 'product_id',],
  required: ['product_id', 'amount']
}

</script>

<style scoped>

</style>