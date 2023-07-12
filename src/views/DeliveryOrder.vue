<template>
  <PageHeader title="交货单"/>
  <RecordView :params="params" :extras="extras"
              @loadedCallable="loadedCallable"
              @saveCreateClick="saveCreateClick"
              @lineButtonClick="lineButtonClick"
              @customClick="customClick"/>
</template>

<script lang="ts" setup>
import RecordView from '../components/RecordView.vue'
import {inject, reactive, ref} from "vue";
import {useRoute} from 'vue-router';
import router from "../router";
import {callButton, callCreate, callFile, callKw} from "../service/module/call";
import {ElMessage} from "element-plus";

const supplier_id = parseInt(inject('supplier_id') || 0);
let route = useRoute();
let lineData = ref({})
let po_datas = {};
let code_datas = {};

const params = reactive({
  title: '交货单',
  name: 'delivery_order',
  width: '30%',
  domain: [['partner_id', '=', supplier_id]],
  model: 'srm.delivery.order',
  fields:
      ['name', 'partner_id', 'expect_date', 'company_id',
        'h_state', 'submit_user_id', 'state', 'jit_flag', 'line_ids', 'date_from'],
  tables: {
    line_ids: {
      title: '交货订单行',
      model: 'srm.delivery.order.line',
      fields: ['product_id', 'material_name', 'jit_id', 'shortage_id', 'amount_planned',
        'delivery_quantity', 'receive_quantity', 'uom_id', 'purchase_order', 'code_names', 'code_ids', 'is_printed',
        'origin_data_ids', 'print_amount', 'standby_qty', 'produce_number', 'min_pack_size', 'date_from', 'comment']
    }
  }
})

const extras = {
  buttons: [{
    type: 'object',
    method: 'button_print',
    showType: ['list', 'form'],
    text: '打印',
    needRow: true,
    attributes: {
      invisible: [['state', 'in', ['create', 'destroy']]]
    },
  }, {
    type: 'object',
    method: 'action_cancel',
    classify: 'danger',
    showType: ['list', 'form'],
    text: '作废',
    needRow: true,
    attributes: {
      invisible: [['state', 'in', ['create', 'done', 'destroy']]]
    },
  }, {
    type: 'custom',
    method: 'down_load_all_code',
    classify: 'success',
    showType: ['form'],
    text: '下载全部标签',
    attributes: {
      invisible: [['state', '=', 'create']]
    },
  },
    {
      type: 'create',
      showType: ['form'],
      classify: 'primary',
      confirmText: '提交',
      show: true,
      attributes: {
        invisible: [['state', '!=', 'create']]
      },
    },
  ],
  hideDetail: true,
  search_fields: {
    expect_date: {},
    state: {}
  },
  attributes: {
    line_ids: {
      unadd: true,
      fields: {
        readonly: ['product_id', 'material_name', 'uom_id', 'purchase_order', 'code_names', 'amount_planned', 'print_amount', 'produce_number'],
        invisible: ['jit_id', 'shortage_id', 'origin_data_ids', 'purchase_type_id', 'code_ids', 'is_printed'],
        required: ['min_pack_size', 'date_from'],
        amount_planned: {
          sum: true,
        },
        code_names: {
          showOverflowTooltip: true
        },
        product_id: {
          string: '物料编码',
          width: 140
        },
        material_name: {
          string: '物料描述',
        },
        delivery_quantity: {
          sum: true,
          readonly: [['line_ids.purchase_order', '!=', '']],
          min: 0,
          width: 160
        },
        receive_quantity: {
          invisible: [['state', '!=', 'done']]
        },
        standby_qty: {
          min: 0,
          width: 160
        },
        min_pack_size: {
          min: 0,
          width: 160
        }
      },
      buttons: [{
        method: 'download_code',
        text: '下载标签',
        show: true,
        attributes: {
          invisible: [['state', '=', 'create']]
        },
      }]
    },
    name: {
      width: 170
    }, partner_id: {
      width: 200
    }, company_id: {
      width: 220
    },
  },
  sort: '_all_',
  readonly: ['name', 'partner_id', 'expect_date', 'company_id',
    'h_state', 'submit_user_id', 'state'],
  invisible: ['h_state'],
  listInvisible: ['h_state', 'line_ids']
}


const customClick = async (button, datas, reload, loading) => {
  if (button.method === 'down_load_all_code') {
    for (const line of datas.line_ids) {
      const lineData = line[2];
      button.method = 'download_code'
      lineButtonClick('line_ids', lineData, button, reload, loading)
    }
  }
}

const saveCreateClick = async (savedDatas, saveCreate, noSave, loading) => {
  noSave();
  loading.value = true;
  const usedPoQty = {};
  let match_po_types = [];
  for (const line of savedDatas.line_ids) {
    const lineData = line[2];
    const origin_data_ids = lineData.origin_data_ids
    const res = await callKw({
      model: params.model,
      method: 'match_po',
      args: [origin_data_ids, lineData.delivery_quantity, usedPoQty, savedDatas.jit_flag, match_po_types]
    })
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      lineData.value.delivery_quantity = 0;
      return false
    }
    const poResult = res.result;
    for (const pol of poResult) {
      usedPoQty[pol.purchase_order_line_id] ? usedPoQty[pol.purchase_order_line_id] = 0 : null;
      usedPoQty[pol.purchase_order_line_id] += pol.amount;
    }
    match_po_types = match_po_types.concat(poResult.map(r => r.purchase_type_id));
    po_datas[origin_data_ids] = res.result;
    const codeData = {
      default_code: lineData.product_id,
      supplier_id: supplier_id,
      produce_number: lineData.produce_number,
      amount: lineData.delivery_quantity,
      min_pack_size: lineData.min_pack_size,
      print_amount: lineData.print_amount,
      date_from: lineData.date_from,
    }
    const codeRes = await callCreate({model: 'srm.coding'}, codeData)
    if (codeRes.error) {
      ElMessage({
        message: codeRes.error.data.message,
        type: 'error'
      });
      return false;
    }
    const result = await callKw({
      model: 'srm.coding',
      method: 'create_code',
      args: [codeRes.result]
    })
    code_datas[origin_data_ids] = result.result;
  }

  callButton({
    model: params.model,
    method: 'action_submit',
    args: [savedDatas, {po_datas, code_datas}]
  }).then(res => {
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    }
    loading.value = false;
    router.replace({
      name: params.name,
      query: {
        id: res.result.id
      }
    })
  })
}


const loadedCallable = async (init, loading, noInit) => {
  let plan_ids = route.query?.plan_ids;
  if (plan_ids || plan_ids?.length) {
    noInit();
    plan_ids = plan_ids instanceof Array ? plan_ids : [plan_ids];
    loading.value = true;
    const res = await callButton({
      model: params.model,
      method: 'prepare_create',
      args: [plan_ids]
    })
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      router.back();
      return false
    }
    loading.value = false;
    init(res.result);
  }
}

const lineButtonClick = async (treeField, data, button, reload, loading) => {
  if (button.method === 'download_code') {
    let standbyCodeId = 0;
    if (data.standby_qty && !data.is_printed) {
      const standbyCodeData = {
        delivery_order_line_id: data.id,
        default_code: data.product_id,
        supplier_id: supplier_id,
        produce_number: data.produce_number,
        amount: data.standby_qty,
        min_pack_size: data.min_pack_size,
        is_generate: true,
        print_amount: 1,
        date_from: data.date_from,
      }
      const codeRes = await callCreate({model: 'srm.coding'}, standbyCodeData);
      standbyCodeId = codeRes.result
    }
    const printIds = data.code_ids;
    standbyCodeId ? printIds.push(standbyCodeId) : null;
    callButton({
      model: 'srm.coding',
      method: 'print_code',
      args: [printIds]
    }).then(async res => {
      if (res.error) {
        loading.value = false;
        ElMessage({
          message: res.error.data.message,
          type: 'error'
        });
        return false;
      }
      loading.value = false;
      const result = res.result || {};
      if (!!result.report_file) {  // 如果是文件，请求下载
        loading.value = true;
        await callFile({
          reportname: result.report_file,
          docids: result?.context?.active_ids || ids,
          converter: result.report_type,
          name: result.name
        }, loading)
      }
      reload();
    })
  }
}


</script>

<style scoped>
.code-total {
  position: relative;
  left: -214px;
  top: 10px;
}
</style>
