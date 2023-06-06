<template>
  <RecordView :params="params" :extras="extras"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {useRoute} from 'vue-router';

let route = useRoute()
import {reactive} from "vue";

const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '赋码(卡板包装)',
  name: 'board_pack',
  limit: 12,
  offset: 0,
  sort: 'id desc',
  domain: [],
  count: 0,
  model: 'srm.coding.board.pack',
  import_fields: ['product_id', 'product_name', 'outer_pack_size', 'amount', 'outer_pack_ids'],
  fields: [
    'name',
    'product_id',
    'product_name',
    'amount',
    'state',
    'outer_pack_size',
    'outer_pack_ids',
  ],
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
    template: '/stock_manager/download_template/board',
    attributes: {},
  }
  ],
  search_fields: {
    product_id: {
      domain: []
    }
  },
  attributes: {
    product_id: {
      readonly: [['state', '=', 'done']]
    }
  },
  invisible: ['state'],
  readonly: ['name', 'product_name', 'name'],
  required: ['product_id', 'amount']
}

</script>

<style scoped>

</style>