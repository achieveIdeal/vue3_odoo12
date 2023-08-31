<template>
  <el-table :data="datas" ref="listTable" stripe
            lazy
            fit
            :height="'calc(100vh - 150px)'"
            row-key="id">
    <el-table-column fixed type="selection" width="55" :reserve-selection="true"/>
    <el-table-column
        v-for="children in arch.children"
        :key="children.attrs.name"
        show-overflow-tooltip
        :label="viewFields[children.attrs.name || children.name]?.string">
      <template #header>
        <span>{{ viewFields[children.attrs.name || children.name]?.string }}</span>
      </template>
      <template #default="scoped">
        <el-form-item :prop="[scoped.$index, children.attrs.name]" class="table-form-item"
                      style="width: 100%;"
                      :rules="viewFields[children.attrs.name]?.rules||[{
                      required: parseDomain(viewFields[children.attrs.name]?.required, scoped.row),
                      message: viewFields[children.attrs.name]?.string + '不能为空!',
                      trigger: 'blur',
                    }]">
          <RenderField :children="children"
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
                   @click="getDetail(scoped.row, scoped.$index, {form: ''})"
        >查看详情
        </el-button>
      </template>
    </el-table-column>
  </el-table>
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
import {callSearchRead} from "../../service/module/call";
import {initListData} from "../../tools/init";

const props = defineProps({
  action: {
    type: Object,
    default: {},
  },
  from_data: {
    type: Object,
    default: {},
  },
  res_datas: {
    type: Array,
    default: []
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
  },  loading: {
    type: Boolean,
    default: true
  },
  field: {
    type: String,
    default: '',
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
const datas = ref(props.res_datas)
const currentPage = ref(1);
const pageSize = ref(props.action.limit);
const dataLimit = ref(props.action.limit);
const dataCount = ref(0);

!datas.value.length && callSearchRead({
  model: props.model,
  fields: Object.keys(props.viewFields),
  offset: 0,
  limit: props.action.limit,
  domain: props.action.domain || [],
}).then(async res => {
  dataCount.value = res.length || 0;
  datas.value = await initListData(res.records, props.viewFields);
})

const emits = defineEmits(['getDetailClick'])

const getDetail = async (data, index) => {
  emits('getDetailClick', data, index, props.formViewInfo)
}

const handleSizeChange = () => {

}
const handleCurrentChange = () => {

}

defineExpose({
  // 选中行
})
</script>

<style lang="less" scoped>

</style>