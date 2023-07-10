<template>
  <el-table :data="datas" ref="listTable" stripe @selection-change="handleSelectionChange"
            show-summary
            lazy
            fit
            :height="params.height|| 'calc(100vh - 255px)'"
            row-key="id"
            :load="loadGroupDetail"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :row-style="handleRowStyle"
            :cell-style="handleCellStyle"
            @expand-change="expandChange"
            :summary-method="getSummaries">
    <el-table-column fixed type="selection" width="55" :reserve-selection="true"/>
    <template v-for="field in params.listFields?.length ? params.listFields :params.fields"
              :key="field">
      <template v-if="field!== 'id' && !options[field]?.listInvisible">
        <el-table-column
            show-overflow-tooltip
            :label="options[field]?.string"
            :min-width="options[field]?.minWidth"
            :width="options[field]?.width">
          <template #default="scoped">
            <span v-if="options[field]?.type==='boolean'">
              <input type="checkbox" :checked="scoped.row[field]" disabled style="height: 17px;">
            </span>
            <span v-else-if="options[field]?.type==='binary'">
              {{ scoped.row[options[field]?.filename] }}
            </span>
            <span v-else>
              {{ scoped.row[field] }}
            </span>
          </template>
        </el-table-column>
      </template>
    </template>
    <el-table-column v-if="!params.hideDetail && !params.groupby" fixed="right" label="操作" width="120">
      <template #default="scoped">
        <el-button link
                   size="small"
                   type="primary"
                   @click="getDetail(scoped.row)"
        >查看详情
        </el-button>
        <el-button link
                   v-if="params.canDel"
                   size="small"
                   type="danger"
                   @click="deleteRow(scoped.row)"
        >删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
      v-model:current-page="currentPage"
      :page-sizes="[10, 20, 50, 100, 200, 500]"
      v-model:page-size="pageSize"
      @size-change="handleSizeChange"
      class="list-pagination"
      :page-size="params?.limit || 20"
      small
      layout="total, sizes, prev, pager, next, jumper"
      background
      :total="params?.count || 0"
      @current-change="handleCurrentChange"
      ref="paginationRef"
  />
</template>

<script lang="ts" setup>
import {ref} from "vue";
import router from "../../router";
import {parseDomain} from "../../tools";

const props = defineProps({
  options: {
    type: Object,
    default: {}
  },
  params: {
    type: Object,
    default: {}
  },
  colors: {
    type: Object,
    default: {}
  },
  datas: {
    type: Array,
    default: []
  },
  datasCopy: {
    type: Array,
    default: []
  },
  model: {
    type: String
  },
})

const paginationRef = ref({})
let pageSize = ref(20);
let listTable = ref({})
let currentPage = ref(1)
let height = document.documentElement.clientHeight - 250
let resolveCopy = {}
let isLoadedGroupDetail = {};
let emits = defineEmits(['pageChange', 'editClick', 'selectClick', 'pageSizeChange', 'loadGroupDetail', 'deleteRow', 'groupbyClick', 'handleCellStyle'])

const handleRowStyle = (row) => {
  const colorMap = {
    success: '#28a745',
    warning: '#ffc400',
    error: '#dc3545',
    info: '#606266'
  }
  let curColor = 'info'
  for (const color of Object.keys(props?.colors)) {
    if (parseDomain(props.colors[color], row.row)) {
      curColor = color;
    }
  }
  if (!row.row.hasChildren) {
    return {
      'background-color': '#fffff !important',
      color: colorMap[curColor]
    }
  }
  return {
    color: colorMap[curColor]
  }
}

const handleCellStyle = (row)=>{
  emits('handleCellStyle', row)
}
const recoverPageTo1 = () => {
  currentPage.value = 1
}

const expandChange = (row, expanded) => {
  if (expanded) { // 当前是展开状态
    if (isLoadedGroupDetail[row.id]) {
      isLoadedGroupDetail[row.id] = false;
    } else {
      loadGroupDetail(row, '', resolveCopy[row.id])
    }
  }
}

const loadGroupDetail = (row, treeNode, resolve) => {
  isLoadedGroupDetail[row.id] = true;
  resolveCopy[row.id] = resolve;
  if (row.__context?.group_by) {
    emits('groupbyClick', row, treeNode, resolve)
  } else {
    emits('loadGroupDetail', row, treeNode, resolve)
  }
}
const handleCurrentChange = () => {
  emits('pageChange', currentPage.value)
}

const handleSelectionChange = (rows) => {
  const validRowIds = [];
  const validRows = [];
  for (const row of rows) {
    if (validRowIds.indexOf(row.id) === -1) {
      validRowIds.push(row.id)
      validRows.push(row)
    }
  }
  for (const validRow of validRows) {
    listTable.value.toggleRowSelection(validRow, true)
  }
  emits('selectClick', validRows, listTable.value)
}
const getDetail = (data) => {
  router.push({
    name: props.params.name,
    query: {
      id: data.id
    }
  })
}

const deleteRow = (row) => {
  emits('deleteRow', row)
}
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  const currentSize = paginationRef.value.pageSize;
  emits('pageSizeChange', size, currentSize);
}
const getSummaries = (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 0;
    for (const field of props.params?.fields) {
      if (field === 'id' || parseDomain(props.options[field]?.invisible, data)) {
        continue
      }
      sums[index] = !sums[index] ? 0 : sums[index];
      if (props.options[field]?.sum) {
        sums[index] = (parseFloat(sums[index] || 0) + parseFloat(data[field] || 0)).toFixed(props.options[field]?.precision ||
            props.options[field]?.digits?.length && props.options[field]?.digits[1] || 0);
      } else {
        sums[index] = ''
      }
      index++;
    }
  }
  return sums
}

const defaultCheckedLine = (datas) => {
  for (const data of datas) {
    if (data.front_default_checked) {
      listTable.value.toggleRowSelection(data, true);
    }
  }
}

defineExpose({
  listTable, pageSize, recoverPageTo1, defaultCheckedLine
})
</script>

<style lang="less" scoped>
.list-pagination {
  margin-top: 20px;
  float: right;
}

</style>