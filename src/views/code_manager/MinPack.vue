<template>
  <el-dialog v-model="dialogVisible" title="修改生产日期" width="30%" draggable>
    <el-input v-model="date_from" type="date"/>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDateFrom">
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
  <RecordView :params="params" :extras="extras" @customClick="customClick" @objectClick="objectClick"/>
</template>

<script lang="ts" setup>
import RecordView from '../../components/RecordView.vue'
import {inject, reactive, ref} from "vue";
import {useRoute} from 'vue-router';
import {callButton} from "../../service/module/call";
import {ElMessage} from "element-plus";
import router from "../../router";

const supplier_id = parseInt(inject('supplier_id') || 0);
let route = useRoute()
let dialogVisible = ref(false);
let date_from = ref('');
let activeRows = ref([]);
const params = reactive({
  id: parseInt(route.query.id) || 0,
  type: route.query.type || 'list',
  title: '赋码(最小包装)',
  name: 'min_pack',
  limit: 12,
  offset: 0,
  domain: [['supplier_id', '=', supplier_id]],
  sort: 'id desc',
  count: 0,
  model: 'srm.coding',
  fields: [
    'name',
    'supplier_id',
    'default_code',
    'product_name',
    'produce_number',
    'amount',
    'min_pack_size',
    'print_amount',
    'if_print',
    'date_from',
    'shelf_life',
    'manufacturer_id',
    'comment',
    'delivery_order_line_id',
    'is_generate',
    'state'
  ],
  import_fields: ['default_code', 'product_name', 'manufacturer_id', 'produce_number', 'shelf_life', 'date_from',
    'amount', 'comment'],
  tables: {}
})

const extras = {
  buttons: [{
    type: 'edit',
    text: '编辑',
    showType: ['form'],
    attributes: {}
  }, {
    type: 'create',
    showType: ['list', 'form'],
    text: '创建'
  }, {
    type: 'object',
    method: 'print_code',
    showType: ['form', 'list'],
    text: '打印',
    needRow: true,
    attributes: {
      invisible: [['is_generate', '=', false]]
    },
  }, {
    type: 'import',
    showType: ['list'],
    text: '导入',
    template: '/stock_manager/download_template/min',
    attributes: {},
  }, {
    type: 'custom',
    showType: ['list'],
    text: '修改日期',
    needRow: true,
    attributes: {},
  }, {
    type: 'object',
    method: 'create_code',
    showType: ['form'],
    text: '生成标签',
    attributes: {
      invisible: ['|', ['if_print', '=', true], ['is_generate', '=', true]]
    }
  }
  ],
  search_fields: {
    default_code: {
      domain: [],
    }
  },
  attributes: {
    default_code: {
      readonly: ['|', ['if_print', '=', true], ['is_generate', '=', true]]
    },
    supplier_id: {
      domain: [['supplier', '=', true], ['parent_id', '=', false]]
    }
  },
  invisible: ['is_generate', 'state', 'delivery_order_line_id'],
  readonly: ['name', 'product_name', 'print_amount', 'name', 'supplier_id',
    'if_print', 'min_pack_size', 'delivery_order_line_id',],
  required: ['default_code', 'date_from', 'amount', 'min_pack_size', 'shelf_life', 'produce_number']
}


const customClick = (button, rows, model, loadData) => {
  const ids = rows.map(r => r.id);
  if (!ids.length) {
    ElMessage({
      message: '请至少选择一条记录!',
      type: 'error'
    })
    return false
  }
  activeRows.value = {
    ids: ids,
    model: model,
    reload: loadData
  };
  dialogVisible.value = true;
}

const saveDateFrom = () => {
  if (!date_from.value) {
    ElMessage({
      message: '请输入生产日期!',
      type: 'error'
    })
    return false;
  }
  callButton({
    model: activeRows.value.model,
    method: 'update_date_from',
    args: [activeRows.value.ids, {'front': true, date_from: date_from.value}]
  }).then(res => {
    if (res.error) {
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false;
    } else {
      activeRows.value.reload()
    }
    dialogVisible.value = false;
  })
}

const objectClick = (name, rows, res) => {
  router.push({
    name: 'min_pack'
  })
}
</script>

<style scoped>

</style>