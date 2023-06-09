<template>
  <el-table :data="datas" ref="listTable" stripe style="width: 100%" @selection-change="handleSelectionChange"
            show-summary
            table-layout="auto"
            :summary-method="getSummaries">
    <el-table-column fixed type="selection" width="55"/>
    <template v-for="field in params.fields?.length && params.fields || []"
              :key="field">
      <template v-if="noLoadFields.indexOf(field) === -1 && !options[field]?.listInvisible">
        <el-table-column
            show-overflow-tooltip
            :label="options[field]?.string"
            width="180">
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
    <el-table-column v-if="!params.hideDetail" fixed="right" label="操作" width="120">
      <template #default="scoped">
        <el-button link
                   size="small"
                   type="danger"
                   @click="getDetail(scoped.row)"
        >查看详情
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
      :page-size="params.limit || 15"
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

const props = defineProps({
  options: {
    type: Object,
    default: {}
  },
  params: {
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
  }
})
const noLoadFields = inject('noloadFields');

let pageSize = ref(20);
let listTable = ref({})
let currentPage = ref(1)
let height = document.documentElement.clientHeight - 250

let emits = defineEmits(['pageChange', 'editClick', 'selectClick', 'pageSizeChange'])
const handleCurrentChange = () => {
  emits('pageChange', currentPage.value)
}
const handleSelectionChange = (rows) => {
  emits('selectClick', rows)
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
  emits('pageSizeChange', size);
}
const getSummaries = (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 1;
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


defineExpose({
  listTable
})
</script>

<style lang="less" scoped>
.list-pagination {
  margin-top: 20px;
  float: right;
}
</style>