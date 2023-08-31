<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <PagerHeader :title="action.name" v-if="!isDialog"/>
  <el-header class="controller-panel">
    <!--    <MenuView v-if="hasMenus" :menus="menus" @menuClick="menuClick"/>-->
    <div>
      <el-button v-if="disabled && parseDomain(arch.attrs.edit, data)" type="primary"
                 @click="(e)=> editClick(e,data)">
        创建
      </el-button>
      <el-button v-if="disabled && parseDomain(arch.attrs.edit, data)" type="primary"
                 @click="(e)=> createClick(e,data)">
        编辑
      </el-button>
      <el-button v-if="disabled && parseDomain(arch.attrs.edit, data)" type="success"
                 @click="(e)=> importClick(e,data)">
        导入
      </el-button>
      <el-button v-if="disabled && parseDomain(arch.attrs.edit, data)" type="danger"
                 @click="(e)=> deleteClick(e,data)">
        删除
      </el-button>
      <template v-if="!disabled">
        <el-button type="primary" @click.prevent="handleSave">
          保存
        </el-button>
        <el-button @click.prevent="handleCancel">
          取消
        </el-button>
      </template>
    </div>
  </el-header>
  <el-container>
    <el-main>
      <FormView ref="formview_ref" v-if="curViewType==='form' &&Object.keys(arch).length"
                :arch="arch"
                :data="data"
                :isDialog="isDialog"
                :disabled="disabled"
                :loading="loading"
                :model="fieldViewInfo.base_model"
                :viewFields="fieldViewInfo.viewFields"
                @buttonClick="buttonClick"
                @getLineDetailClick="getLineDetailClick"
      />
      <ListView ref="listview_ref" v-if="curViewType==='tree' && Object.keys(arch).length" :action="action"
                :arch="arch"
                :data="data"
                :disabled="disabled"
                :loading="loading"
                :model="fieldViewInfo.base_model"
                :isDialog="isDialog"
                :formViewInfo="formViewInfo"
                :viewFields="fieldViewInfo.viewFields"
                @getDetailClick="getDetailClick"
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
  }, data: {
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
const attrs = props.arch.attrs;

attrs['create'] = JSON.parse(attrs['create'] || 'true');
attrs['edit'] = JSON.parse(attrs['edit'] || 'true');
attrs['delete'] = JSON.parse(attrs['delete'] || 'true');
attrs['import'] = JSON.parse(attrs['import'] || 'true');


const emits = defineEmits(['buttonClick', 'getDetailClick', 'getLineDetailClick'])

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

defineExpose({
  formview_ref, listview_ref
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