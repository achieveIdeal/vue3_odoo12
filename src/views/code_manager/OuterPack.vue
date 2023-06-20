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
  title: '赋码(外箱包装)',
  name: 'outer_pack',
  domain: [['supplier_id', '=', supplier_id]],
  sort: 'id desc',
  model: 'srm.coding.outer.pack',
  fields: [
    'name',
    'product_id',
    'product_name',
    'amount',
    'state',
    'min_pack_size',
    'delivery_order_id',
    'min_pack_ids',
    'if_print'
  ],
  import_fields: ['product_id', 'product_name', 'min_pack_size', 'amount', 'min_pack_ids'],
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
      domain: [['is_generate', '=', true], ['if_print', '=', true],
        ['state', '=', 'draft'], ['supplier_id', '=', supplier_id]],
      limit: 50
    },
    name: {
      width: '160'
    },
    product_id: {
      readonly: [['state', '=', 'done']]
    }
  },
  invisible: ['state', 'if_print', 'delivery_order_id'],
  readonly: ['name', 'product_name', 'product_id'],
  required: ['product_id', 'amount'],
  listInvisible: ['if_print']
}

</script>

<style scoped>

</style>