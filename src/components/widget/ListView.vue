<template>
  <el-table :data="datas" ref="listTable" stripe @selection-change="handleSelectionChange"
            show-summary
            lazy
            fit
            :height="params.height|| 'calc(100vh - 255px)'"
            :row-key="getRowKey"
            :load="loadGroupDetail"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            highlight-current-row
            :row-style="handleRowStyle"
            @current-change="handleLineClick"
            :summary-method="getSummaries">
    <el-table-column fixed type="selection" width="55" v-if="!params.groupby" :reserve-selection="true"/>
    <el-table-column v-if="groupbyKey" width="180">
      <template #default="scoped">
        {{ scoped.row[groupbyKey] }}
      </template>
    </el-table-column>
    <template v-for="field in params.fields?.length && params.fields || []"
              :key="field">
      <template v-if="noLoadFields.indexOf(field) === -1 && !options[field]?.listInvisible">
        <el-table-column
            show-overflow-tooltip
            :label="options[field]?.string"
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
    <el-table-column v-if="!params.hideDetail && !params.groupby" fixed="right" label="操作">
      <template #default="scoped">
        <el-button link
                   size="small"
                   type="primary"
                   @click="getDetail(scoped.row)"
        >查看详情
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
      v-if="!params.groupby"
      v-model:current-page="currentPage"
      :page-sizes="[10, 20, 50, 100, 200, 500]"
      v-model:page-size="pageSize"
      @size-change="handleSizeChange"
      class="list-pagination"
      :page-size="params.limit || 20"
      small
      layout="total, sizes, prev, pager, next, jumper"
      background
      :total="params?.count || 0"
      @current-change="handleCurrentChange"
  />
</template>

<script lang="ts" setup>
import {inject, ref} from "vue";
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
  groupbyKey: {
    type: String,
    default: ''
  }
})

const noLoadFields = inject('noloadFields');

let pageSize = ref(20);
let listTable = ref({})
let currentPage = ref(1)
let height = document.documentElement.clientHeight - 250

let emits = defineEmits(['pageChange', 'editClick', 'selectClick', 'pageSizeChange', 'loadGroupDetail', 'handleLineClick'])

const handleLineClick = (row) => {
  emits('handleLineClick', row)
}
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
  return {
    color: colorMap[curColor]
  }
}

const getRowKey = (row) => {
  return row[props.groupbyKey] || row.id;
}

const recoverPageTo1 = () => {
  currentPage.value = 1
}

const loadGroupDetail = (row, treeNode, resolve) => {
  emits('loadGroupDetail', row, treeNode, resolve)
}
const handleCurrentChange = () => {
  emits('pageChange', currentPage.value)
}
const handleSelectionChange = (rows) => {
  emits('selectClick', rows, listTable.value)
}
const getDetail = (data) => {
  router.push({
    name: props.params.name,
    query: {
      id: data.id
    }
  })
}
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  emits('pageSizeChange', size);
}
const getSummaries = (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 0;
    for (const field of props.params?.fields) {
      if (noLoadFields.indexOf(field) !== -1 || props.options[field]?.invisible) {
        continue
      }
      sums[index] = !sums[index] ? 0 : sums[index];
      if (props.options[field]?.sum) {
        sums[index] += data[field];
      } else {
        sums[index] = ''
      }
      index++;
    }
  }
  return sums
}

const defaultCheckedLine = (datas)=>{
  for(const data of datas){
    if(data.front_default_checked){
      listTable.value.toggleRowSelection(data, true);
    }
  }
}

defineExpose({
  listTable, pageSize, recoverPageTo1,defaultCheckedLine
})
</script>

<style lang="less" scoped>
.list-pagination {
  margin-top: 20px;
  float: right;
}

</style>