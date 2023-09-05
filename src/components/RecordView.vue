<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <PagerHeader :title="action.name" v-if="!isDialog"/>
  <el-header class="controller-panel">
    <!--    <MenuView v-if="hasMenus" :menus="menus" @menuClick="menuClick"/>-->
  </el-header>
  <el-container>
    <el-main>
      <FormView ref="formview_ref" v-if="curViewType==='form' &&Object.keys(arch).length"
                :arch="arch"
                :data="res_data"
                :isDialog="isDialog"
                :disabled="disabled"
                :loading="loading"
                :model="fieldViewInfo.base_model"
                :viewFields="fieldViewInfo.viewFields"
                @buttonClick="buttonClick"
                @getLineDetailClick="getLineDetailClick"
                @dataLoadedCallback="dataLoadedCallback"
      />
      <ListView ref="listview_ref" v-if="curViewType==='tree' && Object.keys(arch).length" :action="action"
                :arch="arch"
                :disabled="disabled"
                :loading="loading"
                :model="fieldViewInfo.base_model"
                :isDialog="isDialog"
                :formViewInfo="formViewInfo"
                :viewFields="fieldViewInfo.viewFields"
                @getDetailClick="getDetailClick"
                @selectClick="selectClick"
                @dataLoadedCallback="dataLoadedCallback"
      />
    </el-main>
  </el-container>

</template>

<script lang="ts" setup>
import PagerHeader from '../components/views/PageHeader.vue'
import {defineEmits, defineExpose, defineProps, onMounted, ref} from "vue";
import ListView from "./views/ListView.vue";
import FormView from "./views/FormView.vue";
import {parseDomain} from "../tools";

const loading = ref(false);
const listview_ref = ref('');
const formview_ref = ref('');
const disabled = ref(true);
const props = defineProps({
  arch: {
    type: Object,
    default: {}
  }, action: {
    type: Object,
    default: {}
  }, res_data: {
    type: Object,
  },
  curViewType: {
    type: String,
    default: ''
  },
  fieldViewInfo: {
    type: Object,
    default: {}
  }, formViewInfo: {
    type: Object,
    default: {}
  }, searchViewInfo: {
    type: Object,
    default: {}
  }, isDialog: {
    type: Boolean,
    default: false
  },
})

const data = ref('')
const attrs = ref(props.arch.attrs);
const dataLoadedCallback = (datas) => {
  props.curViewType === 'form' ? data.value = datas : null;
}

const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick', 'selectClick'])

const buttonClick = (button, model, datas) => {
  emits('buttonClick', button, model, datas)
}
const getDetailClick = (data, index) => {
  emits('getDetailClick', data, index)
}

const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}


const editClick = (e, data) => {
  disabled.value = false
}
const createClick = (e, data) => {
  disabled.value = false
}
const importClick = (e, data) => {

}
const deleteClick = (e, data) => {

}

const handleSave = () => {
  disabled.value = true
}
const handleCancel = () => {
  disabled.value = true
}
const selectClick = (rows) => {
  const dataVal = {};
  for (const row of rows) {
    for (const field of Object.keys(row)) {
      !dataVal[field] ? dataVal[field] = [] : '';
      dataVal[field].push(row[field])
    }
  }
  data.value = dataVal;
  emits('selectClick', rows)
}

defineExpose({
  formview_ref, listview_ref, data
})
</script>

<style lang="less" scoped>
.controller-panel {
  position: relative;
  z-index: 3;
  border-bottom: 1px solid #ced4da;
  text-align: left;
  vertical-align: middle;
  align-items: center;
  display: flex;
  justify-content: space-between;

}

.el-main {
  margin: 0;
  padding: 0;
}

.row-bg {
  width: 100%;
}

.grid-content {
  background-color: #ee0000;
  min-height: 36px;
}
</style>