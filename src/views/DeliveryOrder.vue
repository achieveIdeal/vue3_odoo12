<template>
  <PageHeader title="交货单"/>
  <el-dialog v-model="poDialogVisible" title="匹配采购订单" width="50%" draggable destroy-on-close modal>
    <MatchPo @loadedCallback="poLoadedCallable" @customClick="poCustomClick" :isDialog="true"/>
  </el-dialog>
  <el-dialog v-model="codeDialogVisible" title="匹配赋码信息" width="70%" draggable destroy-on-close
             style="height: 400px;overflow: scroll" modal>
    <MatchCode @loadedCallback="codeLoadedCallable" @customClick="codeCustomClick" @selectClick="codeSelectClick"
               :isDialog="true"/>
    <span class="code-total">选中总数：{{ codeAmountTotal }}</span>
  </el-dialog>
  <RecordView :params="params" :extras="extras"
              @loadedCallable="loadedCallable"
              @lineButtonClick="lineButtonClick"
              @customClick="customClick" ref="recordView"/>
</template>

<script lang="ts" setup>
import MatchPo from './delivery_order/MatchPo.vue'
import MatchCode from './delivery_order/MatchCode.vue'
import RecordView from '../components/RecordView.vue'
import {inject, reactive, ref} from "vue";
import {useRoute} from 'vue-router';
import router from "../router";
import {callButton} from "../service/module/call";
import {ElMessage} from "element-plus";

const supplier_id = parseInt(inject('supplier_id') || 0);
let route = useRoute();
let recordView = ref();

let lineData = ref({})
let poDialogVisible = ref(false);
let codeDialogVisible = ref(false);
const poDatas = ref({});
let usedCodeIds = []
let usedPoQty = {}
let match_po_types = []
const codeDatas = ref({});
const codeAmountTotal = ref(0)

const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '交货单',
  name: 'delivery_order',
  limit: 12,
  offset: 0,
  domain: [['partner_id', '=', supplier_id]],
  sort: 'id desc',
  count: 0,
  model: 'srm.delivery.order',
  fields:
      ['name', 'partner_id', 'expect_date', 'company_id',
        'h_state', 'submit_user_id', 'state', 'JIT_flag', 'line_ids'],
  tables: {
    line_ids: {
      limit: 12,
      offset: 0,
      domain: [],
      sort: 'id desc',
      count: 0,
      model: 'srm.delivery.order.line',
      fields: ['product_id', 'material_name', 'JIT_id', 'shortage_id',
        'amount_planned', 'delivery_quantity', 'uom_id', 'purchase_order', 'code_names', 'comment']
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
      invisible: [['state', '=', 'create']]
    },
  },
    {
      type: 'custom',
      method: 'action_submit',
      showType: ['form'],
      classify: 'primary',
      text: '提交',
      show: true,
      attributes: {
        invisible: [['state', '!=', 'create']]
      },
    },
    {
      type: 'custom',
      method: 'cancel',
      showType: ['form'],
      text: '取消',
      show: true,
      attributes: {
        invisible: [['state', '!=', 'create']]
      },
    }
  ],
  hideDetail: true,
  search_fields: {
    expect_date: {},
  },
  attributes: {
    line_ids: {
      unadd: true,
      fields: {
        readonly: ['product_id', 'material_name', 'uom_id', 'purchase_order', 'code_names'],
        invisible: ['JIT_id', 'shortage_id'],
        amount_planned: {
          sum: true,
        },
        delivery_quantity: {
          sum: true,
        },
      },
      buttons: [{
        method: 'match_po',
        text: '匹配采购单',
        needRow: true,
        attributes: {
          invisible: [['state', 'in', ['', 'draft']]]
        },
      }, {
        method: 'match_code',
        text: '匹配赋码',
        needRow: true,
        attributes: {
          invisible: [['state', 'in', ['', 'draft']]]
        },
      }]
    },
  },
  readonly: ['name', 'partner_id', 'expect_date', 'company_id',
    'h_state', 'submit_user_id', 'state'],
  invisible: ['h_state']
}

const customClick = (button, datas, reload) => {
  if (button.method === 'action_submit') {
    for (const shortage_id of Object.keys(poDatas.value || {})) {
      if (!poDatas.value[parseInt(shortage_id)] || !codeDatas.value[parseInt(shortage_id)]) {
        ElMessage({
          message: '请先匹配数据在提交!',
          type: 'error'
        });
        return false;
      }
    }
    if (!Object.keys(poDatas.value).length || !Object.keys(codeDatas.value).length) {
      ElMessage({
        message: '请先匹配数据在提交!',
        type: 'error'
      });
      return false;
    }
    callButton({
      model: params.model,
      method: 'action_submit',
      args: [datas, {po_datas: poDatas.value, code_datas: codeDatas.value}]
    }).then(res => {
      if (res.error) {
        ElMessage({
          message: res.error.data.message,
          type: 'error'
        });
        return false
      }
      router.push({
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

const loadedCallable = async (init) => {
  let plan_ids = route.query?.plan_ids;
  if (plan_ids || plan_ids?.length) {
    plan_ids = plan_ids instanceof Array ? plan_ids : [plan_ids];
    const res = await callButton({
      model: params.model,
      method: 'prepare_create',
      args: [plan_ids]
    })
    if (res.error) {
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      router.push({
        name: 'shortage_product'
      });
      return false
    }
    init(res.result);
  }

}

const lineButtonClick = (treeField, data, button) => {
  lineData.value = data;
  if (button.method === 'match_po') {
    poDialogVisible.value = true;
  } else if (button.method === 'match_code') {
    codeAmountTotal.value = 0;
    if (!Object.keys(poDatas.value).length) {
      ElMessage({
        message: '请先匹配采购订单!',
        type: 'error'
      });
      return false;
    }
    codeDialogVisible.value = true;
  }
}

const poLoadedCallable = async (init) => {
  const IsJITMatch = !!lineData.value.JIT_id;
  const origin_id = IsJITMatch ? lineData.value.JIT_id : lineData.value.shortage_id;
  if (!lineData.value.delivery_quantity) {
    lineData.value.delivery_quantity = Math.abs(lineData.value.amount_planned)
  }
  const res = await callButton({
    model: params.model,
    method: 'match_po',
    args: [origin_id, lineData.value.delivery_quantity, usedPoQty, IsJITMatch, match_po_types]
  })
  if (res.error) {
    ElMessage({
      message: res.error.data.message,
      type: 'error'
    });
    lineData.value.delivery_quantity = 0;
    poDialogVisible.value = false;
    return false
  }
  init(res.result);
}
const codeLoadedCallable = async (init) => {
  const IsJITMatch = !!lineData.value.JIT_id
  const origin_id = IsJITMatch ? lineData.value.JIT_id : lineData.value.shortage_id;
  const res = await callButton({
    model: params.model,
    method: 'match_code',
    args: [origin_id, lineData.value.delivery_quantity, usedCodeIds, IsJITMatch]
  })
  if (res.error) {
    ElMessage({
      message: res.error.data.message,
      type: 'error'
    });
    poDialogVisible.value = false;
    return false
  }
  init(res.result);
}
const poCustomClick = (button, datas) => {
  if (button.method === 'cancel') {
    poDatas.value = {}
    lineData.value.comment = '';
    lineData.value.purchase_order = ''
  } else {
    !poDatas.value[lineData.value.shortage_id] ? poDatas.value[lineData.value.shortage_id] = [] : null;
    poDatas.value[lineData.value.shortage_id].push(datas);
    const lines = datas.match_line_ids;
    for (const line of lines) {
      const data = line[2];
      !usedPoQty[data.purchase_order_line_id] ? usedPoQty[data.purchase_order_line_id] = 0 : null;
      usedPoQty[data.purchase_order_line_id] += data.amount;
      data.purchase_type_id && match_po_types.push(data.purchase_type_id)
    }
    lineData.value.comment = datas.comment;
    lineData.value.purchase_order = datas.match_line_ids.map(r => {
      return r[2].purchase_order_name
    });
  }
  poDialogVisible.value = false;
}
const codeCustomClick = (button, datas) => {
  if (button.method === 'cancel') {
    codeDatas.value = {}
    lineData.value.code_names = ''
  } else {
    if (!Object.keys(datas || {}).length) {
      ElMessage({
        message: '请选择一条记录!',
        type: 'error'
      });
      return false
    }
    if (lineData.value.delivery_quantity > codeAmountTotal.value) {
      ElMessage({
        message: '赋码数量少于需交货数量!',
        type: 'error'
      });
      return false
    }
    !codeDatas.value[lineData.value.shortage_id] ? codeDatas.value[lineData.value.shortage_id] = [] : null;
    codeDatas.value[lineData.value.shortage_id].push(datas);
    usedCodeIds = usedCodeIds.concat((datas || []).map(r => r.id))
    lineData.value.code_names = (datas || []).map(r => {
      return r.name
    }).join(',')
  }
  codeDialogVisible.value = false;
}

const codeSelectClick = (rows) => {
  codeAmountTotal.value = 0
  for (const row of rows) {
    codeAmountTotal.value += row.amount
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
