<template>
  <MainView :action_name="'e2yun_dpsrm_supplier_permission.supplier_menus_action'" :extras="extras"/>
</template>

<script lang="ts" setup>
import MainView from "../components/MainView.vue";
import {inject, ref, reactive} from "vue";
import {dateFtt} from "../tools";

const supplier_id = parseInt(inject('supplier_id') || 0);
const loading = ref(false);

const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {
    }
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
    name: {
      default:'12323'
    },
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