<template>
  <el-dialog v-model="dialogVisible" :title="actionDialog.name">
    <RecordView
        :isDialog="true"
        :data="dataDialog"
        :action="actionDialog"
        :fieldViewInfo="fieldViewInfoDialog"
        :formViewInfo="formViewInfoDialog"
        :searchViewInfo="searchViewInfoDialog"
        :arch="archDialog"
        :curViewType="curViewTypeDialog"
        @getDetailClick="dialogGetDetailClick"
        @getLineDetailClick="dialogGetLineDetailClick"
        @buttonClick="buttonClick"
    />
  </el-dialog>
  <RecordView
      ref="record_ref"
      v-if="Object.keys(arch).length"
      :arch="arch"
      :action="action"
      :curViewType="curViewType"
      :fieldViewInfo="fieldViewInfo"
      :formViewInfo="formViewInfo"
      @getDetailClick="getDetailClick"
      @getLineDetailClick="getLineDetailClick"
      @buttonClick="buttonClick"
  />
</template>

<script lang="ts" setup>
import {callAction, callKw, callViews} from "../service/module/call";
import {ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useMenusStore} from "../store";
import {formatArch, loadActiveAction} from "../tools";
import RecordView from '../components/RecordView.vue'


const route = useRoute();
const router = useRouter();

const useMenu = useMenusStore();
const menus = ref({});
const hasMenus = ref(false);
const action_id = route.query.action_id;
const parent_id = route.query.parent_id;
const curViewType = route.query.viewType;
useMenu.getMenus(parent_id).then(res => {
  hasMenus.value = true;
  menus.value = res;
});

const record_ref = ref()

const action = ref({});
const fieldViewInfo = ref({});
const searchViewInfo = ref({});
const formViewInfo = ref({});
const arch = ref({});

const dialogVisible = ref(false);
const actionDialog = ref({});
const fieldViewInfoDialog = ref({});
const searchViewInfoDialog = ref({});
const formViewInfoDialog = ref({});
let curViewTypeDialog = ref('form');
const archDialog = ref({});
const dataDialog = ref<{} | []>();

const loadAction = async (action_id, is_button) => {
  const action = await callAction(action_id);
  if (action.res_model) {
    const views = await callViews(action.res_model, action.views)
    let viewType = curViewType === 'list' ? 'tree' : curViewType;
    if (is_button) {
      viewType = action.view_mode;
    }
    const fieldViewInfo = views.find(r => r.type === viewType);
    const searchViewInfo = views.find(r => r.type === 'search');
    const formViewInfo = views.find(r => r.type === 'form');
    const arch = fieldViewInfo.arch
    formatArch(arch)
    return {
      action,
      viewType,
      fieldViewInfo,
      searchViewInfo,
      formViewInfo,
      arch,
    }
  }
}
loadAction(action_id).then(res => {
  action.value = res.action;
  fieldViewInfo.value = res.fieldViewInfo;
  searchViewInfo.value = res.searchViewInfo;
  formViewInfo.value = res.formViewInfo;
  arch.value = res.arch;
});


const buttonClick = (button, model, datas) => {
  if (button.attrs.type === 'action') {
    const action_id = parseInt(button.attrs.name);
    loadAction(action_id, true).then(res => {
      actionDialog.value = res.action;
      fieldViewInfoDialog.value = res.fieldViewInfo;
      searchViewInfoDialog.value = res.searchViewInfo;
      formViewInfoDialog.value = res.formViewInfo;
      archDialog.value = res.arch;
      dataDialog.value = datas;
      curViewTypeDialog.value = res.viewType
      dialogVisible.value = true;
    })
  } else if (button.attrs.type === 'object') {
    callKw({
      model: model,
      method: button.attrs.name,
      args: [datas.id],
      kwargs: {context: {'active_id': record_ref.value.formview_ref.datas.id}}
    }).then(res => {
      dialogVisible.value = false;
    })
  } else {
    dialogVisible.value = false;
  }
}


const menuClick = (curMenu) => {
  const action_id = loadActiveAction(curMenu);
  router.replace({
    name: 'action',
    query: {
      action_id,
      parent_id,
      viewType: curViewType
    }
  })
  loadAction(action_id);
}

const getDetailClick = (data) => {
  router.replace({
    name: 'action',
    query: {
      action_id,
      parent_id,
      viewType: 'form',
      id: data.id
    }
  })
}
const dialogGetDetailClick = (data, index, formViewInfo) => {
  console.log(data);

}
const dialogGetLineDetailClick = (data, index, formViewInfo) => {
  console.log(data);
}
const getLineDetailClick = (data, index, formViewInfo) => {
  console.log(formViewInfo);
  fieldViewInfoDialog.value = formViewInfo;
  archDialog.value = formViewInfo.arch;
  curViewTypeDialog.value = 'form'
  dialogVisible.value = true;
  dataDialog.value = data;
  actionDialog.value = {};
}

</script>

<style lang="less" scoped>

.row-bg {
  width: 100%;
}

.grid-content {
  background-color: #ee0000;
  min-height: 36px;
}
</style>