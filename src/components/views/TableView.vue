<template>
  <el-table :data="treeData[treeField]" ref="listTable" stripe
            lazy
            fit
            @selection-change="selectClick"
            row-key="id">
    <el-table-column fixed type="selection" width="55" :reserve-selection="true"/>
    <el-table-column
        v-for="children in arch.children"
        :key="children.attrs.name"
        show-overflow-tooltip
        :label="viewFields[children.attrs.name]?.string">
      <template #header>
        <span>{{ viewFields[children.attrs.name]?.string }}</span>
      </template>
      <template #default="scoped">
        <el-form-item :prop="[scoped.$index, children.attrs.name]" class="table-form-item"
                      style="position:relative;"
                      :rules="viewFields[children.attrs.name]?.rules||[{
                      required: parseDomain(viewFields[children.attrs.name]?.required, scoped.row),
                      message: viewFields[children.attrs.name]?.string + '不能为空!',
                      trigger: 'blur'
                    }]">
            <RenderField :children="children"
                         :model="model"
                         :data="scoped.row"
                         viewType="tree"
                         :viewFields="viewFields"
                         :disabled="disabled"
                         :loading="loading"
            />
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column fixed="right" label="操作"
                     width="120">
      <template #default="scoped">
        <el-button link
                   size="small"
                   type="primary"
                   @click="getDetail(scoped.row, scoped.$index, formViewInfo)"
        >查看详情
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-button
      class="mt-4"
      style="width: 100%"
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
import {parseDomain} from "../../tools";

const props = defineProps({
  action: {
    type: Object,
    default: {},
  },
  fromData: {
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
  }
})
const currentPage = ref(1);
const pageSize = ref(props.action.limit);
const dataLimit = ref(props.action.limit);
const dataCount = ref((props.treeData[props.treeField] || []).length);

const emits = defineEmits(['getDetailClick', 'selectClick'])

const getDetail = async (data, index,formViewInfo) => {
  emits('getDetailClick', data, index, formViewInfo)
}

const handleSizeChange = () => {

}
const handleCurrentChange = () => {

}
const onAddItem = (treeField) => {

}

const selectClick = (rows) => {
  emits('selectClick', rows)
}

defineExpose({})
</script>

<style lang="less" scoped>
.el-table{
  width: 100%;

}
.el-table__header-wrapper table,.el-table__body-wrapper table{
  width: 100% !important;
}
.el-table__body, .el-table__footer, .el-table__header{
  table-layout: auto;
}

</style>