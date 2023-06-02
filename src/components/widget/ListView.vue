<template>
  <el-table :data="datas" ref="listTable" stripe style="width: 100%" @selection-change="handleSelectionChange">
    <el-table-column fixed type="selection" width="55"/>
    <template v-for="field in params.fields?.length && params.fields || []"
              :key="field">
      <template v-if="noLoadFields.indexOf(field) === -1">
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
    <el-table-column fixed="right" label="操作" width="120">
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
      class="list-pagination"
      :page-size="params.limit || 15"
      small
      background
      layout="total, prev, pager, next"
      :total="params?.count || 0"
      @current-change="handleCurrentChange"
  />
</template>

<script lang="ts" setup>
import {inject, ref} from "vue";
import router from "../../router";

const props = defineProps({
  options: {
    type: Object
  },
  params: {
    type: Object
  },
  datas: {
    type: Array
  },
  datasCopy: {
    type: Array
  },
  model: {
    type: String
  }
})
const noLoadFields = inject('noloadFields');

let listTable = ref({})
let currentPage = ref(1)
let height = document.documentElement.clientHeight - 250

let emits = defineEmits(['pageChange', 'editClick', 'selectClick'])
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