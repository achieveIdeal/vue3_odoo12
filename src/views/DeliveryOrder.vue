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
              @deleteLineClick="deleteLineClick"
              @fieldOnchange="fieldOnchange"
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
let isJITMatch = false;
let lineData = ref({})
let poDialogVisible = ref(false);
let codeDialogVisible = ref(false);
let poDatas = ref({});
let usedCodeIds = {};
let usedPoQty = {};
let match_po_types = []
let codeDatas = ref({});
let codeAmountTotal = ref(0)
const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '交货单',
  name: 'delivery_order',
  limit: 20,
  width: '30%',
  offset: 0,
  domain: [['partner_id', '=', supplier_id]],
  sort: 'id desc',
  count: 0,
  model: 'srm.delivery.order',
  fields:
      ['name', 'partner_id', 'expect_date', 'company_id',
        'h_state', 'submit_user_id', 'state', 'jit_flag', 'line_ids'],
  tables: {
    line_ids: {
      limit: 10,
      offset: 0,
      title: '交货订单行',
      domain: [],
      sort: 'id desc',
      count: 0,
      model: 'srm.delivery.order.line',
      fields: ['product_id', 'material_name', 'jit_id', 'shortage_id',
        'amount_planned', 'delivery_quantity', 'uom_id', 'purchase_order', 'code_names', 'comment', 'origin_data_ids']
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
    state: {}
  },
  attributes: {
    line_ids: {
      unadd: true,
      fields: {
        readonly: ['product_id', 'material_name', 'uom_id', 'purchase_order', 'code_names', 'amount_planned'],
        invisible: ['jit_id', 'shortage_id', 'origin_data_ids'],
        amount_planned: {
          sum: true,
        },
        delivery_quantity: {
          sum: true,
          readonly: [['line_ids.purchase_order', '!=', '']],
          min: 0,
        },
      },
      buttons: [{
        method: 'match_po',
        text: '匹配采购单',
        attributes: {
          invisible: [['state', '!=', 'create']]
        },
      }, {
        method: 'match_code',
        text: '匹配赋码',
        attributes: {
          invisible: [['state', '!=', 'create']]
        },
      }]
    },
  },
  readonly: ['name', 'partner_id', 'expect_date', 'company_id',
    'h_state', 'submit_user_id', 'state'],
  invisible: ['h_state'],
  listInvisible: ['h_state']
}

const resetMatchCodeData = (row) => {
  const data = (row || lineData.value)
  const origin_data_ids = data.origin_data_ids;
  codeDatas.value[origin_data_ids] = [];
  usedCodeIds[origin_data_ids] = [];
  data.code_names = '';
}

const resetMatchPoData = (row) => {
  const data = (row || lineData.value)
  const origin_data_ids = data.origin_data_ids;
  const datas = poDatas.value[origin_data_ids];
  poDatas.value[origin_data_ids] = [];
  const lines = datas?.length ? datas[0].match_line_ids : [];
  for (const line of lines || []) {
    const data = line[2];
    usedPoQty[data.purchase_order_line_id] -= data.amount;
    data.purchase_type_id && match_po_types.slice(match_po_types.indexOf(data.purchase_type_id), 1)
  }
}

const customClick = (button, datas, reload, loading) => {
  if (button.method === 'action_submit') {
    for (const shortage_id of Object.keys(poDatas.value || {})) {
      if (!lineData.value.purchase_order || !poDatas.value[shortage_id]?.length
          || !codeDatas.value[shortage_id]?.length) {
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
    loading.value = true;
    callButton({
      model: params.model,
      method: 'action_submit',
      args: [datas, {po_datas: poDatas.value, code_datas: codeDatas.value}]
    }).then(res => {
      if (res.error) {
        loading.value = false;
        ElMessage({
          message: res.error.data.message,
          type: 'error'
        });
        return false
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

const loadedCallable = async (init, loading) => {
  let plan_ids = route.query?.plan_ids;
  if (plan_ids || plan_ids?.length) {
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

const poLoadedCallable = async (init, loading) => {
  const origin_data_ids = lineData.value['origin_data_ids'];
  resetMatchPoData();
  resetMatchCodeData();
  if (!lineData.value.delivery_quantity) {
    lineData.value.delivery_quantity = Math.abs(lineData.value.amount_planned)
  }
  loading.value = true;
  const res = await callButton({
    model: params.model,
    method: 'match_po',
    args: [origin_data_ids, lineData.value.delivery_quantity, usedPoQty, isJITMatch, match_po_types]
  })
  if (res.error) {
    loading.value = false;
    ElMessage({
      message: res.error.data.message,
      type: 'error'
    });
    lineData.value.delivery_quantity = 0;
    poDialogVisible.value = false;
    return false
  }
  loading.value = false;
  const result = res.result;
  result.formData['comment'] = lineData.value.comment
  init(result);
}
const codeLoadedCallable = async (init, loading) => {
  const origin_ids = lineData.value['origin_data_ids'];
  resetMatchCodeData();
  loading.value = true;
  let used = []
  for (const usedIds of Object.values(usedCodeIds)) {
    used = used.concat(usedIds)
  }
  const res = await callButton({
    model: params.model,
    method: 'match_code',
    args: [origin_ids, lineData.value.delivery_quantity, used, isJITMatch]
  })
  if (res.error) {
    loading.value = false;
    ElMessage({
      message: res.error.data.message,
      type: 'error'
    });
    poDialogVisible.value = false;
    return false
  }
  loading.value = false;
  init(res.result);
}
const poCustomClick = (button, datas) => {
  if (button.method === 'cancel') {
    lineData.value.comment = '';
    lineData.value.purchase_order = ''
    resetMatchPoData();
  } else {
    !poDatas.value[lineData.value['origin_data_ids']] ? poDatas.value[lineData.value['origin_data_ids']] = [] : null;
    poDatas.value[lineData.value['origin_data_ids']].push(datas);
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
    }).join(',');
  }
  poDialogVisible.value = false;
}
const codeCustomClick = (button, datas) => {
  if (button.method === 'cancel') {
    resetMatchCodeData();
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
    !codeDatas.value[lineData.value['origin_data_ids']] ? codeDatas.value[lineData.value['origin_data_ids']] = [] : null;
    codeDatas.value[lineData.value['origin_data_ids']].push(datas);
    usedCodeIds[lineData.value['origin_data_ids']] = (datas || []).map(r => r.id)
    lineData.value.code_names = (datas || []).map(r => {
      return r.name
    }).join(',')
  }
  codeDialogVisible.value = false;
}

const deleteLineClick = (field, index, row) => {
  resetMatchCodeData(row);
  resetMatchPoData(row);
  delete codeDatas.value[row['origin_data_ids']];
  delete poDatas.value[row['origin_data_ids']];
}

const codeSelectClick = (rows) => {
  codeAmountTotal.value = 0
  for (const row of rows) {
    codeAmountTotal.value += row.amount
  }
}

const fieldOnchange = (params, reload) => {
  const field = params.field;
  const data = params.datas
  if (field === 'jit_flag') {
    isJITMatch = data.jit_flag
    poDatas = ref({});
    usedCodeIds = {};
    usedPoQty = {};
    match_po_types = []
    codeDatas = ref({});
    codeAmountTotal = ref(0)
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
