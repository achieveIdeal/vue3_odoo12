<template>
  <MainView :action="'e2yun_xw_account_order.srm_account_order_action'"/>
</template>

<script lang="ts" setup>
import MainView from "../components/MainView.vue";


const supplier_id = parseInt(inject('supplier_id') || 0);
const supplier_name = inject('supplier_name');
const cancelDialogVisible = ref(false);
const loading = ref(false);
const params = reactive({
  title: '对账单',
  name: 'account_order',
  width: '30%',
  domain: [['partner_id', '=', supplier_id]],
  model: 'srm.account.order',
  fields:
      ['name', 'company_id', 'partner_id', 'purchase_organize_id', 'stock_warehouse_id',
        'account_tax_id', 'currency_id', 'invoice_type', 'date_from',
        'date_end', 'attachment_name', 'attachment', 'account_lines', 'state',
        'invoice_lines', 'price_total_adjust_limit_total'
      ],
  tables: {
    account_lines: {
      totalTitle: '总计(扣减前):',
      title: '对账明细',
      fields: ['id','product_id', 'product_name', 'product_uom', 'price_unit', 'price_unit_tax', 'voucher_qty', 'price_uom',
        'purchase_id', 'purchase_line_id', 'bedat', 'price_total', 'price_total_tax_adjust', 'price_total_tax', 'tax_rate',
        'date_done', 'voucher_code', 'voucher_item', 'voucher_year', 'factory_id', 'can_delete', 'vouchers_synchronize_data_id'
      ],
      model: 'srm.account.order.line'
    },
    invoice_lines: {
      totalTitle: '发票合计:',
      limit: 500,
      import_fields: ['name', 'price_tax', 'tax_amount', 'invoice_date'],
      title: '开票行',
      model: 'srm.account.invoice.line',
      fields: ['name', 'price_tax', 'tax_amount', 'invoice_date'],
    }
  }
})

const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {
      invisible: [['state', 'not in', ['draft', '']]]
    }
  }, {
    type: 'create',
    showType: ['list', 'form'],
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
  }, {
    type: 'edit',
    text: '填写发票信息',
    classify: 'success',
    method: 'write_invoice_info',
    showType: ['form'],
    attributes: {
      invisible: [['state', '!=', 'purchase_confirm']]
    }
  }
  ],
  attributes: {
    account_lines: {
      unadd: true,
      // undel: [['account_lines.can_delete', '!=', true]],
      readonly: [['state', 'not in', ['', 'draft']]],
      uniqueField: 'voucher_code',
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
          sum: true
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
    price_total_adjust_limit_total:{
      invisible: [['state', 'in', ['', 'draft']]],
      sum:true
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
    name: {
    },
    partner_id: {
      default: [supplier_id, supplier_name]
    }
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