<template>
  <template v-for="(dialog, index) in dialogStack" :key="index">
    <DialogView
        :visible="dialog.visible"
        :isDialog="true"
        :index="index"
        :dataDialog="dialog.dataDialog"
        :actionDialog="dialog.actionDialog"
        :fieldViewInfoDialog="dialog.fieldViewInfoDialog"
        :formViewInfoDialog="dialog.formViewInfoDialog"
        :searchViewInfoDialog="dialog.searchViewInfoDialog"
        :archDialog="dialog.archDialog"
        :curViewTypeDialog="dialog.curViewTypeDialog"
        @getDetailClick="getDetailClick"
        @getLineDetailClick="getLineDetailClick"
        @buttonClick="buttonClick"
        @closeDialog="closeDialog"
    />
  </template>
  <RecordView
      ref="record_ref"
      v-if="Object.keys(arch).length"
      :arch="arch"
      :action="action"
      :curViewType="curViewType"
      :fieldViewInfo="fieldViewInfo"
      :formViewInfo="formViewInfo"
      :searchViewInfo="searchViewInfo"
      @getDetailClick="getDetailClick"
      @getLineDetailClick="getLineDetailClick"
      @buttonClick="buttonClick"
  />
</template>

<script lang="ts" setup>
import {callAction, callKw, callViews} from "../service/module/call";
import {defineProps, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {formatArch} from "../tools";
import RecordView from '../components/RecordView.vue'
import DialogView from './views/DialogView.vue'


const props = defineProps({
  action: {
    default: ''
  }
})

const route = useRoute();
const router = useRouter();

const curViewType = route.query.type || 'tree';
const action_id = ref(parseInt(route.query.action_id || '0') || props.action);

const record_ref = ref()

const action = ref({});
const fieldViewInfo = ref({});
const searchViewInfo = ref({});
const treeViewInfo = ref({});
const formViewInfo = ref({});
const arch = ref({});

const dialogStack = ref([]);

const dialogVisible = ref(false);
const loadAction = async (action_id, is_button) => {
  const action = await callAction(action_id);
  if (action.res_model) {
    const views = await callViews(action.res_model, action.views.concat([[false, 'search']]))
    let viewType = curViewType;
    if (is_button) {
      viewType = action.view_mode;
    }
    const fieldViewInfo = views.find(r => r.type === viewType);
    const searchViewInfo = views.find(r => r.type === 'search');
    const formViewInfo = views.find(r => r.type === 'form');
    const treeViewInfo = views.find(r => r.type === 'tree' || r.type === 'list');
    const arch = fieldViewInfo.arch
    formatArch(arch)
    console.log(searchViewInfo);
    return {
      action,
      viewType,
      fieldViewInfo,
      treeViewInfo,
      searchViewInfo,
      formViewInfo,
      arch,
    }
  }
}

loadAction(props.action).then(res => {
  action_id.value = res.id;
  action.value = res.action;
  fieldViewInfo.value = res.fieldViewInfo;
  searchViewInfo.value = res.searchViewInfo;
  treeViewInfo.value = res.treeViewInfo;
  formViewInfo.value = res.formViewInfo;
  arch.value = res.arch;
});

const buttonClick = (button, model, datas) => {
  if (button.attrs.type === 'action') {
    const action_id = parseInt(button.attrs.name);
    loadAction(action_id, true).then(res => {
      dialogStack.value.push({
        fieldViewInfoDialog: res.fieldViewInfo,
        archDialog: res.arch,
        curViewTypeDialog: res.viewType,
        dialogVisible: true,
        searchViewInfoDialog: res.searchViewInfo,
        dataDialog: datas,
        actionDialog: res.action,
        visible: true,
        formViewInfoDialog: res.formViewInfo,
      })
    })
  } else if (button.attrs.type === 'object') {
    debugger
    callKw({
      model: model,
      method: button.attrs.name,
      args: [datas.id],
      kwargs: {context: {'active_id': record_ref.value.data.id, 'active_ids': record_ref.value.data.id}}
    }).then(res => {
      dialogVisible.value = false;
    })
  } else {
    dialogVisible.value = false;
  }
}

const getDetailClick = (data) => {
  router.push({
    path: router.currentRoute.value.fullPath,
    query: {
      action_id: action_id.value,
      type: 'form',
      id: data.id
    }
  })
}
const dialogGetDetailClick = (data, index, formViewInfo) => {
  console.log(data);
}
const closeDialog = (e, index) => {
  dialogStack.value[index].visible = false;
}

const dialogGetLineDetailClick = (data, index, formViewInfo) => {
  console.log(data);
}
const getLineDetailClick = (data, index, formViewInfo) => {
  console.log(data, 'detail data');
  dialogStack.value.push({
    fieldViewInfoDialog: formViewInfo,
    archDialog: formViewInfo.arch,
    curViewTypeDialog: 'form',
    dialogVisible: true,
    dataDialog: data,
    visible: true,
    actionDialog: {},
  })
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