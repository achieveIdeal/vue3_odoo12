<template>
  <el-dialog v-model="cancelDialogVisible" title="警告" width="40%" draggable destroy-on-close modal>
    <div style="color: red;font-size: 18px;">确定要作废这条记录吗？</div>
    <template #footer>
            <span class="dialog-footer">
        <el-button v-loading.fullscreen.lock="loading"
                   element-loading-text="正在加载..."
                   @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCancel">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="submitInvoiceDialogVisible" title="警告" width="30%" draggable destroy-on-close modal>
    <div style="color: red;font-size: 18px;">金额存在差异，确认继续提交吗?</div>
    <template #footer>
            <span class="dialog-footer">
        <el-button v-loading.fullscreen.lock="loading"
                   element-loading-text="正在加载..."
                   @click="submitInvoiceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSubmitInvoice">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
  <PageHeader title="对账单"/>
  <RecordView :params="params" :extras="extras" @customClick="customClick" @saveWriteClick="saveWriteClick"/>
</template>

<script lang="ts" setup>
import RecordView from '../components/RecordView.vue'
import {dateFtt} from "../tools";
import {inject, reactive, ref} from "vue";
import {callKw} from "../service/module/call";
import {ElMessage} from "element-plus";

const supplier_id = parseInt(inject('supplier_id') || 0);
const supplier_name = inject('supplier_name');
const cancelDialogVisible = ref(false);
const loading = ref(false);
const submitInvoiceDialogVisible = ref(false);
let currentData = {};
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
  search_fields: {},
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
      invisible: [['state', 'in', ['', 'draft']]]
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

const customClick = (button, data, reload) => {
  currentData = {};
  if (button.method === 'order_cancel') {
    currentData = {data, reload};
    cancelDialogVisible.value = true;
  }
}

const confirmCancel = () => {
  {
    loading.value = true;
    callKw({
      model: params.model,
      method: 'order_cancel',
      args: [currentData.data.id],
    }).then(res => {
      if (res.error) {
        loading.value = false;
        ElMessage({
          message: res.error.data.message,
          type: 'error'
        });
        return false
      }
      ElMessage({
        message: '作废成功',
        type: 'success'
      });
      cancelDialogVisible.value = false;
      currentData.reload()
      loading.value = false;
    })
  }
}

const confirmSubmitInvoice = () => {
  currentData.saveWrite(currentData.saveDatas);
  submitInvoiceDialogVisible.value = false;
}

const saveWriteClick = (datas, savedDatas, saveWrite, noSaveCallback) => {
  currentData = {};
  if (datas.formData.state === 'purchase_confirm') {
    const invoice_names = [];
    let invoice_price_total = 0;
    let invoice_price_tax_total = 0;
    for (const invoice_line of datas.treeData['invoice_lines']) {
      invoice_price_tax_total += invoice_line.price_tax;
      invoice_price_total += invoice_line.price;
      if (invoice_names.indexOf(invoice_line.name) === -1) {
        invoice_names.push(invoice_line.name);
      } else {
        noSaveCallback()
        ElMessage({
          message: '发票号重复',
          type: 'error'
        });
        return false;
      }
    }
    let price_total = 0;
    let price_total_tax = 0
    for (const account_line of datas.treeData['account_lines']) {
      price_total += account_line.price_total
      price_total_tax += account_line.price_total_tax
    }
    savedDatas.state = 'supplier_confirm';
    currentData = {savedDatas, saveWrite};
    if (price_total !== invoice_price_total || price_total_tax !== invoice_price_tax_total) {
      submitInvoiceDialogVisible.value = true;
      noSaveCallback();
    }
  }
}
</script>

<style scoped>

</style>
