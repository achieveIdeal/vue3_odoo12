<template>
  <RecordView :params="params" :extras="extras"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {inject, reactive} from "vue";

const supplier_id = parseInt(inject('supplier_id') || 0);
const params = reactive({
  id: 0,
  type: 'list',
  title: '赋码(卡板包装)',
  name: 'board_pack',
  sort: 'id desc',
  domain: [['supplier_id', '=', supplier_id]],
  model: 'srm.coding.board.pack',
  import_fields: ['product_id', 'product_name', 'outer_pack_size', 'amount', 'outer_pack_ids'],
  fields: [
    'name',
    'product_id',
    'product_name',
    'amount',
    'state',
    'outer_pack_size',
    'delivery_order_id',
    'outer_pack_ids',
    'if_print'
  ],
  tables: {}
})

const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {
      invisible: [['if_print', '=', true]]
    }
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
      domain: [],
      noSelect: true
    }
  },
  attributes: {
    product_id: {
      readonly: [['state', '=', 'done']]
    },
    outer_pack_ids: {
      domain: [['state', '=', 'draft'], ['supplier_id', '=', supplier_id]],
      limit: 50
    },
    name: {
      width: '200'
    }
  },
  invisible: ['state', 'if_print', 'delivery_order_id'],
  readonly: ['name', 'product_name', 'name'],
  required: ['product_id', 'amount'],
  listInvisible: ['if_print']
}

</script>

<style scoped>

</style>