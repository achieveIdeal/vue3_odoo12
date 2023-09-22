<template>
  <div>
    <MainView :params="params" :action_name="'e2yun_dpsrm_qweb_extends.srm_delivery_order_action'" :extras="extras"/>
    <button @click="handleChange"></button>
  </div>

</template>

<script lang="ts" setup>
import MainView from "../components/MainView.vue";
import {inject, ref, reactive} from "vue";
import {dateFtt} from "../tools";
import {useI18n} from '../hook/useI18n'
import {callFields} from "../service/module/call";

const supplier_id = parseInt(inject('supplier_id') || 0);
const loading = ref(false);


function handleChange() {

}

const params = reactive({
  title: '交货单',
  name: 'delivery_order',
  width: '30%',
  domain: [],
  model: 'srm.delivery.order',
  fields:
      ['name', 'partner_id', 'expect_date', 'state', 'factory_id', 'comment', 'car_info_ids', 'product_id', 'purchase_order', 'is_sync_shipment'],
  tables: {
    line_ids: {
      title: '交货订单行',
      limit: 100,
      model: 'srm.delivery.order.line',
      fields: ['product_id', 'material_code', 'material_name', 'planned_quantity', 'delivery_quantity',
        'receive_quantity', 'material_uom', 'purchase_order', 'uom_id', 'origin_plan_publish_id']
    },
    car_info_ids: {
      title: '车辆信息',
      limit: 100,
      model: 'car.info',
      fields: [ 'sequence', 'order_id', 'car_number', 'driver', 'phone', 'product_ids', 'is_panel',
        'arrived_date',]
    }
  }
})

const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {}
  }, {
    type: 'create',
    showType: ['tree', 'form'],
    text: '创建'
  }, {
    type: 'object',
    text: '提交',
    method: 'wkf_send_email',
    showType: ['form'],
    attributes: {
      invisible: [['state', 'not in', ['draft', '']]]
    }
  }, {
    type: 'object',
    text: '打印',
    method: 'print_order',
    showType: ['form'],
    attributes: {
      invisible: [['state', 'in', ['draft', '', 'submit', 'cancel']]]
    }
  }, {
    type: 'custom',
    text: '作废',
    classify: 'danger',
    method: 'order_cancel',
    showType: ['form'],
    attributes: {
      invisible: [['state', 'in', ['draft', '', 'submit', 'cancel']]]
    }
  }
  ],
  attributes: {
    account_lines: {
      unadd: true,
      readonly: [['state', 'not in', ['', 'draft']]],
      buttons: [
        {
          method: 'watch_code',
          text: '查看生成/绑定批号',
          width: 200,
        }
      ],
      fields: {
        invisible: ['can_delete', 'vouchers_synchronize_data_id'],
        readonly: '_all_',
        bedat: {
          string: '下单日期'
        },
        price_total_tax_adjust: {
          invisible: [['state', 'in', ['', 'draft']]],
          string: '调整后含税金额',
          sum: true
        },
        price_total_tax: {
          invisible: [['state', 'not in', ['', 'draft']]],
          sum: true
        },
        voucher_qty: {
          sum: true
        },
        price_total: {
          sum: true,
          precision: 2
        },
        price_unit: {
          precision: 2
        },
        price_unit_tax: {
          precision: 2
        },
        factory_id: {
          showOverflowTooltip: true
        }
      }
    },
    invoice_lines: {
      invisible: [['state', 'not in', ['purchase_confirm', 'supplier_confirm', 'done', 'send']]],
      importTemplate: '/',
      fields: {
        required: ['name', 'price_tax', 'tax_amount', 'invoice_date'],
        price_tax: {
          sum: true
        },
        tax_amount: {
          sum: true,
        },
        invoice_date: {
          default: dateFtt("yyyy-MM-dd", new Date())
        }
      }
    },
    price_total_adjust_limit_total: {
      invisible: [['state', 'in', ['', 'draft']]],
      sum: true
    },
    attachment: {
      filename: 'attachment_name',
      invisible: [['state', 'in', ['', 'draft', 'send']]]
    },
    state: {
      invisible: [['state', '=', '']]
    },
    company_id: {
      readonly: [['state', 'not in', ['', 'draft']]],
    },
    purchase_organize_id: {
      readonly: [['state', 'not in', ['', 'draft']]]
    },
    stock_warehouse_id: {
      readonly: [['state', 'not in', ['', 'draft']]]
    },
    account_tax_id: {
      readonly: [['state', 'not in', ['', 'draft']]]
    },
    currency_id: {
      readonly: [['state', 'not in', ['', 'draft']]]
    },
    invoice_type: {
      readonly: [['state', 'not in', ['', 'draft']]]
    },
    date_from: {
      readonly: [['state', 'not in', ['', 'draft']]]
    },
    date_end: {
      readonly: [['state', 'not in', ['', 'draft']]],
    },
    name: {},
    partner_id: {}
  },
  search_fields: {
    name: {},
    state: {}
  },
  readonly: ['name', 'partner_id', 'state'],
  required: ['supplier_code', 'purchase_organize_id', 'stock_warehouse_id',
    'account_tax_id', 'currency_id', 'invoice_type', 'receive_date', 'date_from',
    'date_end', 'attachment_name', 'attachment', 'company_id', 'invoice_lines', 'account_lines'
  ],
  invisible: ['attachment_name'],
  listInvisible: ['urgency_date', 'delete_flag', 'partner_id', 'in_stock_qty', 'attachment_name', 'account_lines', 'invoice_lines']
}


</script>

<style lang="less" scoped>

</style>