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
import {callButton, callCreate, callFile} from "../service/module/call";
import {ElMessage} from "element-plus";

const supplier_id = parseInt(inject('supplier_id') || 0);
let route = useRoute();
let lineData = ref({})
let poDatas = {};
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
        'delivery_quantity', 'receive_quantity', 'uom_id', 'purchase_order', 'code_names',
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
        invisible: ['jit_id', 'shortage_id', 'origin_data_ids', 'purchase_type_id'],
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
        attributes: {
          invisible: [['state', '!=', 'confirm']]
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
  readonly: ['name', 'partner_id', 'expect_date', 'company_id',
    'h_state', 'submit_user_id', 'state'],
  invisible: ['h_state'],
  listInvisible: ['h_state', 'line_ids']
}


const customClick = async (button, datas, reload, loading) => {
  if (button.method === 'action_submit') {
    callButton({
      model: params.model,
      method: 'action_submit',
      args: [datas, {po_datas, code_datas}]
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
  } else if (button.method === 'cancel') {
    router.push({
      name: 'shortage_product'
    })
  }
}

const saveCreateClick = async (savedDatas, saveCreate, noSave, loading) => {
  noSave();
  loading.value = true;
  const usedPoQty = {};
  const match_po_types = {};
  for (const line of savedDatas.line_ids) {
    const lineData = line[2];
    const codeData = {
      default_code: lineData.product_id,
      produce_number: lineData.produce_number,
      amount: lineData.delivery_quantity,
      min_pack_size: lineData.min_pack_size,
      print_amount: lineData.print_amount,
      date_from: lineData.date_from,
    }
    const res = await callButton({
      model: params.model,
      method: 'match_po',
      args: [line.origin_data_ids, line.delivery_quantity, usedPoQty, savedDatas.jit_flag, match_po_types]
    })
    for (const code of res.result) {
      usedPoQty[code.purchase_order_line_id] += matchData.amount;
    }
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
    match_po_types.concat(poResult.map(r => r.purchase_type_id));
    poDatas[origin_data_ids] = res.result;
    const codeRes = await callCreate({model: 'srm.coding'}, codeData)
    if (codeRes.error) {
      ElMessage({
        message: codeRes.error.data.message,
        type: 'error'
      });
      return false;
    }
    const result = await callButton({
      model: 'srm.coding',
      method: 'create_code',
      args: [codeRes.result.id]
    })
    codeDatas[lineData.origin_data_ids] = result.result;
  }

  callButton({
    model: params.model,
    method: 'action_submit',
    args: [datas, {po_datas, code_datas}]
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

const lineButtonClick = async (treeField, data, button) => {
  lineData.value = data;
  if (button.method === 'download_code') {
    if (!Object.keys(poDatas.value || {}).length) {
      ElMessage({
        message: '请先匹配数据在提交!',
        type: 'error'
      });
      return false;
    }
    for (const shortage_id of Object.keys(poDatas.value || {})) {
      if (!lineData.value.purchase_order || !poDatas.value[shortage_id]?.length) {
        ElMessage({
          message: '请先匹配数据在提交!',
          type: 'error'
        });
        return false;
      }
    }
    loading.value = true;
    for (const line of datas.line_ids) {
      const lineData = line[2];
      const codeData = {
        default_code: lineData.product_id,
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
      const result = await callButton({
        model: 'srm.coding',
        method: 'create_code',
        args: [codeRes.result.id]
      })
      const reportResult = result.result;
      if (!!reportResult.report_file) {  // 如果是文件，请求下载
        loading.value = true;
        await callFile({
          reportname: reportResult.report_file,
          docids: reportResult?.context?.active_ids || ids,
          converter: reportResult.report_type,
          name: reportResult.name
        }, loading)
      }
    }
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
