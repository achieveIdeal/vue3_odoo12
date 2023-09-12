<template>
  <el-table :data="treeData[treeField]||[]" ref="listTable" stripe
            lazy
            fit
            show-summary
            :summary-method="getSummaries(treeField,arch.children)"
            sum-text="总计"
            :row-style="handleTreeRowStyle(treeField)"
            @selection-change="selectClick"
            row-key="id">
    <el-table-column v-if="treeField==='self'" fixed type="selection" width="55"/>
    <template v-for="children in arch.children">
      <el-table-column
          :key="children.attrs.name"
          v-if="!(parseDomain(viewFields[children.attrs?.name]?.invisible, formData) ||  children.attrs?.invisible)"
          :width="viewFields[children.attrs.name]?.width"
          :label="viewFields[children.attrs.name]?.string">
        <template #header>
          <span>{{ viewFields[children.attrs.name]?.string }}</span>
        </template>
        <template #default="scoped">
          <RenderField :children="children"
                       :model="model"
                       :treeField="treeField"
                       :index="scoped.$index"
                       :data="scoped.row"
                       viewType="tree"
                       :viewFields="viewFields"
                       :disabled="disabled"
                       :loading="loading"
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
                   v-if="disabled"
                   size="small"
                   type="primary"
                   @click="getDetail(scoped.row, scoped.$index, formViewInfo)"
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
      hide-on-single-page
      v-model:current-page="currentPage"
      :page-sizes="[10, 20, 50, 100, 200, 500,1000]"
      v-model:page-size="pageSize"
      @size-change="handleSizeChange"
      class="list-pagination"
      :page-size="dataLimit || 20"
      small
      layout="total, sizes, prev, pager, next, jumper"
      background
      :total="dataCount || 0"
      @current-change="handleCurrentChange"
      ref="paginationRef"
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
  },
  formData: {
    type: Object,
    default: {},
  }, treeData: {
    type: Object,
    default: {},
  },
  arch: {
    type: Object || String,
    default: {}
  },
  viewFields: {
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
  }, field: {
    type: String,
    default: 'self',
  },
  model: {
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
const dataCount = ref((props.treeData[props.treeField] || []).length);

const typeStore = useTypeStore();
const isDigit = typeStore.isDigit;
const upload = ref<UploadInstance>();


const emits = defineEmits(['getDetailClick', 'fieldOnchange', 'selectClick', 'pageChange', 'editClick', 'addLineClick', 'deleteLineClick', 'lineButtonClick', 'fieldOnchange'])

const getDetail = async (data, index, formViewInfo) => {
  emits('getDetailClick', data, index, formViewInfo)
}

const handleSizeChange = () => {

}

const selectClick = (rows) => {
  emits('selectClick', rows)
}

let active = ref('')
let currentPage = ref<number>(1)


let loading = ref(false)


const getSummaries = (treeField, children) => (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 0;
    const viewFields = props.viewFields
    for (const field of props.fields) {
      const fieldChild = children.find(r => r.attrs.name === field)
      if (parseDomain(viewFields[field]?.invisible, {
        ...props.formData,
        [treeField]: data
      }) || fieldChild.attrs.invisible) {
        continue
      }
      sums[index] = !sums[index] ? 0 : sums[index];
      if (viewFields[field]?.sum && isDigit(viewFields[field]?.type)) {
        sums[index] = (parseFloat(sums[index] || 0) + parseFloat(data[field] || 0)).toFixed(viewFields[field]?.precision ||
            viewFields[field]?.digits &&
            viewFields[field]?.digits?.length && viewFields[field]?.digits[1] || 0);
      } else {
        sums[index] = ''
      }
      index++;
    }
  }
  sums[0] = sums[0] || '总计:'
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
  let colors = props.viewFields.colors || {}
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
  onchangeField({})
  emits('deleteLineClick', treeField, index, props.treeData[treeField], row, noDelete);
}
const onAddItem = (treeField) => {
  const newLine = {}
  for (const field of props.fields) {
    newLine[field] = '';
    if (['float', 'integer'].includes(props.viewFields[field]?.type)) {
      newLine[field] = 0
    } else if (props.viewFields[field]?.type === 'boolean') {
      newLine[field] = false;
    }
  }
  let add_row = true;
  const noAdd = () => {
    add_row = false;
  }
  add_row && props.treeData[treeField].push(newLine);
  add_row && props.formData[treeField].push(0)
  emits('addLineClick', treeField, props.treeData[treeField], newLine, noAdd);
}
const handleCurrentChange = (treeField) => {
  emits('pageChange', currentPage.value, treeField);
}

const handleButtonClick = (field, row, button) => {
  emits('lineButtonClick', field, row, button);
}

defineExpose({})
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

</style>