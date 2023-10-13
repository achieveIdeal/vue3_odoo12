<template>
  <el-table :data="treeData[treeField]||[]" ref="table_ref" stripe
            lazy
            fit
            show-summary
            :load="loadGroupDetail"
            :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
            :summary-method="getSummaries(treeField,arch.children)"
            sum-text="总计"
            @expand-change="expandChange"
            :row-style="handleTreeRowStyle(treeField)"
            @selection-change="selectClick"
            :height="isDialog?null:'calc(100vh - 170px)'"
            row-key="id">
    <el-table-column v-if="treeField==='self'" fixed type="selection" width="55"/>
    <template v-for="children in arch.children">
      <el-table-column
          :key="children.attrs.name"
          v-if="!(parseDomain(treeViewFields[treeField][children.attrs?.name]?.invisible, formData) ||  children.attrs?.invisible)"
          :width="treeViewFields[treeField][children.attrs.name]?.width"
          :label="treeViewFields[treeField][children.attrs.name]?.string">
        <template #header>
          <span v-if="parseDomain(treeViewFields[treeField][children.attrs.name]?.required, formData)"
                style="color: red;">*</span>
          <span
              :class="{'pulldown':sortArrow[children.attrs.name]==='desc' && showArrow[children.attrs.name],
              'pullup': sortArrow[children.attrs.name]==='asc' && showArrow[children.attrs.name]}"
              @click="sortByClick(children.attrs.name)">{{
              treeViewFields[treeField][children.attrs.name]?.string
            }}</span>
        </template>
        <template #default="scoped">
          <RenderField :children="children"
                       :model="model"
                       :formModel="formModel"
                       :treeData="treeData"
                       :formData="formData"
                       :treeViewFields="treeViewFields"
                       :viewFields="viewFields"
                       :treeField="treeField"
                       :index="scoped.$index"
                       :data="scoped.row"
                       viewType="tree"
                       :disabled="disabled"
                       :loading="loading"
                       @lineButtonClick="handleButtonClick"
          />
        </template>
      </el-table-column>
    </template>
    <template
        v-for="(button, index) in attributes?.buttons|| []" :key="index">
      <el-table-column :width="button.width|| 130" fixed="right" :label="button.text"
                       v-if="!parseDomain(button.attributes?.invisible,{...formData, [treeField]: {}})">
        <template #default="scoped">
          <el-button :type="button.classify || 'primary'" :style="{width: button.width|| 130}"
                     v-if="!parseDomain(button.attributes?.invisible,{...formData, [treeField]: scoped.row})"
                     @click="handleButtonClick(treeField, scoped.row, button)"
          >{{ button.text }}
          </el-button>
        </template>
      </el-table-column>
    </template>
    <el-table-column fixed="right" label="操作"
                     width="120">

      <template #default="scoped">
        <el-button link
                   v-if="disabled && !scoped.row.__domain"
                   size="small"
                   type="primary"
                   @click="getDetail(scoped.row, scoped.$index, formViewInfo, relation_field)"
        >查看详情
        </el-button>
        <el-button link
                   v-if="!(disabled || parseDomain(arch.attrs.readonly, formData) ||  parseDomain(attributes.unadel, formData))"
                   size="small"
                   type="danger"
                   @click="handleDeleteLine(scoped.$index, treeField,scoped.row)"
        >删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-button
      class="mt-4"
      style="width: 100%"
      v-if="!(disabled || parseDomain(arch.attrs.readonly, formData) || parseDomain(attributes.unadd, formData))"
      @click="onAddItem(treeField)"
  >添加一行
  </el-button>
  <el-pagination
      v-if="relation_field==='self'"
      v-model:current-page="currentPage"
      :page-sizes="[10, 20, 50, 80, 100, 160,200, 500,1000]"
      v-model:page-size="pageSize"
      @size-change="handleSizeChange"
      class="list-pagination"
      :page-size="dataLimit || 20"
      small
      layout="total, sizes, prev, pager, next, jumper"
      background
      :total="dataCount || 0"
      @current-change="handleCurrentChange"
      ref="pagination_ref"
  />
</template>

<script lang="ts" setup>
import RenderField from '../base/RenderField.vue'
import {defineEmits, defineExpose, defineProps, ref} from "vue";
import {onchangeField, parseDomain} from "../../tools";
import {useTypeStore} from "../../store";

const props = defineProps({
  action: {
    type: Object,
    default: {},
  },  isDialog: {
    type: Boolean,
    default: false,
  },
  formData: {
    type: Object,
    default: {},
  }, treeData: {
    type: Object,
    default: {},
  }, dataCount: {
    type: Number,
  },
  arch: {
    type: Object || String,
    default: {}
  },
  treeViewFields: {
    type: Object,
    default: {}
  }, viewFields: {
    type: Object,
    default: {}
  }, option: {
    type: Object,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  },
  readonly: {
    type: Boolean,
    default: true
  }, loading: {
    type: Boolean,
    default: true
  },
  treeField: {
    type: String,
    default: 'self',
  }, relation_field: {
    type: String,
    default: 'self',
  }, field: {
    type: String,
    default: 'self',
  },
  model: {
    type: String,
    default: '',
  }, formModel: {
    type: String,
    default: '',
  },
  formViewInfo: {
    type: Object,
    default: {}
  }, attributes: {
    type: Object,
    default: {}
  }, fields: {
    type: Object,
    default: []
  }
})
const pageSize = ref(props.action.limit);
const dataLimit = ref(props.action.limit);
const pagination_ref = ref({})
const typeStore = useTypeStore();
const isDigit = typeStore.isDigit;
const upload = ref();
const table_ref = ref({})

const emits = defineEmits(['getDetailClick', 'fieldOnchange', 'selectClick', 'pageChange',
  'editClick', 'addLineClick', 'deleteLineClick', 'lineButtonClick', 'fieldOnchange', 'pageSizeChange',
  'handleButtonClick', 'groupbyClick', 'loadGroupDetail', 'sortByClick'
])

let resolveCopy = {}
let isLoadedGroupDetail = {};
const loadGroupDetail = (row, treeNode, resolve) => {
  isLoadedGroupDetail[row.id] = true;
  resolveCopy[row.id] = resolve;
  emits('loadGroupDetail', row, treeNode, resolve)
}

const expandChange = (row, expanded) => {
  if (expanded) { // 当前是展开状态
    if (isLoadedGroupDetail[row.id]) {
      isLoadedGroupDetail[row.id] = false;
    } else {
      row.children = [];
      loadGroupDetail(row, '', resolveCopy[row.id])
    }
  }
}
const getDetail = async (data, index, formViewInfo, relation_field) => {
  if (!!relation_field) {
    data[relation_field] = props.formData.id;
  }
  emits('getDetailClick', data, index, formViewInfo, relation_field)
}

const handleSizeChange = (size) => {
  currentPage.value = 1;
  const currentSize = pagination_ref.value.pageSize;
  emits('pageSizeChange', props.treeField, size, currentSize);
}

const selectClick = (rows) => {
  emits('selectClick', rows)
}

let active = ref('')
let currentPage = ref(1)


let loading = ref(false)


const getSummaries = (treeField, children) => (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 0;
    const treeViewFields = props.treeViewFields[treeField]
    for (const field of props.fields) {
      const fieldChild = children.find(r => r.attrs.name === field)
      if (parseDomain(treeViewFields[field]?.invisible, {
        ...props.formData,
        [treeField]: data
      }) || fieldChild.attrs.invisible) {
        continue
      }
      sums[index] = !sums[index] ? 0 : sums[index];
      if (treeViewFields[field]?.sum && isDigit(treeViewFields[field]?.type)) {
        sums[index] = (parseFloat(sums[index] || 0) + parseFloat(data[field] || 0)).toFixed(treeViewFields[field]?.precision ||
            treeViewFields[field]?.digits &&
            treeViewFields[field]?.digits?.length && treeViewFields[field]?.digits[1] || 0);
      } else {
        sums[index] = ''
      }
      index++;
    }
  }
  if (props.treeField === 'self') {
    sums[1] = sums[1] || '总计:'
  } else {
    sums[0] = sums[0] || '总计:'
  }
  return sums
}

const handleTreeRowStyle = (treeField) => (row) => {
  const colorMap = {
    success: '#28a745',
    warning: '#ffc400',
    error: '#dc3545',
    info: '#606266'
  }
  let curColor = 'info'
  let colors = props.treeViewFields[treeField].colors || {}
  for (const color of Object.keys(colors)) {
    if (parseDomain(colors[color], row.row)) {
      curColor = color;
    }
  }
  return {
    color: colorMap[curColor]
  }
}


const handleDeleteLine = (index, treeField, row) => {  //  行删除
  let delete_row = true;
  const noDelete = () => {
    delete_row = false;
  }
  delete_row && props.treeData[treeField].splice(index, 1);
  delete_row && props.formData[treeField].splice(index, 1);
  fieldOnchange({  // 删除行时需触发行字段的onchange
    field: treeField,
    treeField: '',
    datas: props.formData,
    formModel: props.formModel,
    formData: props.formData,
    attributes: props.treeViewFields[treeField],
    options: props.viewFields,
    treeOptions: props.treeViewFields,
    formOptions: props.viewFields,
    model: props.formModel,
    treeData: props.treeData
  })
  emits('deleteLineClick', treeField, index, props.treeData[treeField], row, noDelete);
}

const fieldOnchange = async (params) => {
  let noChange = false;
  eventBus.emit('fieldOnchange', params, () => {
    noChange = true
  });
  return !noChange && onchangeField(params)
}

const onAddItem = (treeField) => {
  const newLine = {}
  for (const field of props.fields) {
    newLine[field] = '';
    if (['float', 'integer'].includes(props.treeViewFields[treeField][field]?.type)) {
      newLine[field] = 0
    } else if (props.treeViewFields[treeField][field]?.type === 'boolean') {
      newLine[field] = false;
    }
  }
  let add_row = true;
  const noAdd = () => {
    add_row = false;
  }
  newLine[props.relation_field] = props.formData.id;
  !props.treeData[treeField] ? props.treeData[treeField] = [] : null;
  add_row && props.treeData[treeField].push(newLine);
  !props.formData[treeField] ? props.formData[treeField] = [] : null;
  add_row && props.formData[treeField].push([0, 0, newLine]);
  emits('addLineClick', treeField, props.treeData[treeField], newLine, noAdd);
}
const handleCurrentChange = (currentPage) => {
  emits('pageChange', props.treeField, currentPage, pageSize.value, props.fields);
}

const handleButtonClick = (field, row, button) => {
  emits('lineButtonClick', field, row, button, props.model);
}

let timer;
const sortArrow = ref({})
const showArrow = ref({});
const sortByClick = (field) => {
  if (!props.treeViewFields['self']) return
  if (['text', 'binary'].includes(props.treeViewFields['self'][field].type)) return
  timer ? clearTimeout(timer) : null;
  for (const field of Object.keys(showArrow.value)) {
    showArrow.value[field] = false;
  }
  showArrow.value[field] = true;
  !sortArrow.value[field] ? sortArrow.value[field] = 'desc' : null;
  if (sortArrow.value[field] === 'desc') {
    sortArrow.value[field] = 'asc';
  } else if (sortArrow.value[field] === 'asc') {
    sortArrow.value[field] = 'desc';
  }
  timer = setTimeout(() => {
    showArrow.value[field] = false;
  }, 1500)
  emits('sortByClick', field, sortArrow.value[field]);
}


defineExpose({
  pageSize, currentPage, table_ref
})
</script>

<style lang="less" scoped>
.el-table {
  width: 100%;

}

.el-table__header-wrapper table, .el-table__body-wrapper table {
  width: 100% !important;
}

.el-table__body, .el-table__footer, .el-table__header {
  table-layout: auto;
}

.pulldown, .pullup {
  cursor: pointer;
}

.pulldown::after {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 0.255em;
  vertical-align: 0.255em;
  content: "";
  border-top: 0.3em solid;
  border-right: 0.3em solid transparent;
  border-bottom: 0;
  border-left: 0.3em solid transparent;
}

.pullup::after {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 0.255em;
  vertical-align: 0.255em;
  content: "";
  border-top: 0;
  border-right: 0.3em solid transparent;
  border-bottom: 0.3em solid;
  border-left: 0.3em solid transparent;
}
</style>