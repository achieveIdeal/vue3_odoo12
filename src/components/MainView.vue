<template>
  <template v-for="(dialog, index) in dialogStack" :key="index">
    <DialogView
        ref="dialog_ref"
        :isDialog="true"
        :index="index"
        :dataDialog="dialog.dataDialog"
        :preDialogReload="dialog.preDialogReload"
        :relation_field="dialog.relation_field"
        :actionDialog="dialog.actionDialog"
        :fieldViewInfoDialog="dialog.fieldViewInfoDialog"
        :formViewInfoDialog="dialog.formViewInfoDialog"
        :searchViewInfoDialog="dialog.searchViewInfoDialog"
        :archDialog="dialog.archDialog"
        :curViewTypeDialog="dialog.curViewTypeDialog"
        @getDetailClick="getDetailClick"
        @getLineDetailClick="getLineDetailClick"
        @buttonClick="buttonClick"
        @deleteLineClick="deleteLineClick"
        @addLineClick="addLineClick"
    />
  </template>
  <RecordView
      ref="record_ref"
      v-if="Object.keys(arch).length"
      :arch="arch"
      :action="action"
      :extras="extras"
      :curViewType="curViewType"
      :fieldViewInfo="fieldViewInfo"
      :formViewInfo="formViewInfo"
      :searchViewInfo="searchViewInfo"
      @getDetailClick="getDetailClick"
      @getLineDetailClick="getLineDetailClick"
      @buttonClick="buttonClick"
      @deleteLineClick="deleteLineClick"
      @addLineClick="addLineClick"

  />
</template>


<script lang="ts" setup>
import {callAction, callCreate, callKw, callViews} from "../service/module/call";
import {defineEmits, defineProps, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {formatArch} from "../tools";
import RecordView from '../components/RecordView.vue'
import DialogView from './views/DialogView.vue'


const props = defineProps({
  action_name: {
    default: ''
  },
  extras: {
    default: {}
  }
})

const route = useRoute();
const router = useRouter();

const curViewType = ref(route.query.type || 'tree');
const action_id = ref(parseInt(route.query.action_id || '0') || props.action_name);
const record_ref = ref([])

const action = ref({});
const fieldViewInfo = ref({});
const searchViewInfo = ref({});
const treeViewInfo = ref({});
const formViewInfo = ref({});
const arch = ref({});

const dialogStack = ref([]);

const dialog_ref = ref([]);

const loadViews = async (action, res_views, is_button) => {
  const views = await callViews(action.res_model, res_views)
  let viewType = curViewType.value;
  if (is_button) {
    viewType = action.view_mode;
  }
  const fieldViewInfo = views.find(r => r.type === viewType);
  const searchViewInfo = views.find(r => r.type === 'search');
  const formViewInfo = views.find(r => r.type === 'form');
  const treeViewInfo = views.find(r => r.type === 'tree' || r.type === 'list');
  const arch = fieldViewInfo.arch
  formatArch(arch)
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

const loadAction = async (action_id, is_button) => {
  const action = await callAction(action_id);
  const res_views = action.views?.length ? action.views : false;
  res_views.push([false, 'search'])
  if (action.res_model) {
    return await loadViews(action, res_views || [[false, 'search'], [false, 'tree'], [false, 'form']])
  }
}

const emits = defineEmits(['deleteLineClick', 'addLineClick'])

watch(route, (f, t) => {
  const vType = t.query.type
  curViewType.value = !vType ? 'tree' : 'form';
  fieldViewInfo.value = !vType ? treeViewInfo.value : formViewInfo.value;
  arch.value = fieldViewInfo.value.arch
  formatArch(arch.value);  // 格式化xml诗句为json
})

const deleteLineClick = (treeField, index, treeData, row, noAddCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noAddCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

const buttonClick = async (button, model, datas, selectRows) => {
  const curDialog = dialog_ref.value[dialog_ref.value.length - 1];
  const curDialogData = dialogStack.value.filter(r=>r.visible)[dialogStack.value.filter(r=>r.visible) - 1];
  if (button.attrs.type === 'action') {  // 类型为action的按钮点击时
    const action_id = parseInt(button.attrs.name);  // 获取action id
    loadAction(action_id, true).then(res => {
      dialogStack.value.push({  // 向弹框栈里推入加载弹框需要的数据
        fieldViewInfoDialog: res.fieldViewInfo,
        archDialog: res.arch,
        visible: true,
        curViewTypeDialog: res.viewType,
        searchViewInfoDialog: res.searchViewInfo,
        dataDialog: null,
        actionDialog: res.action,
        formViewInfoDialog: res.formViewInfo,
        active_ids: selectRows?.id || [datas.id],
        preDialogReload: dialogStack.value.length ? record_ref.value.formview_ref.main : dialog_ref.value.record_ref?.formview_ref.main
      })
    })
  } else if (button.attrs.type === 'object') {  // 类型为object的按钮点击时
    if (!curDialogData?.dataDialog && !datas?.id) {  // 如果是弹框上的object，需调用创建
      datas.id = await callCreate({model, data: datas})
    }
    callKw({
      model: model,
      method: button.attrs.name || button.name,
      args: [datas.id],
      kwargs: {
        context: {
          'active_id': curDialogData?.active_ids[0] || datas.id,
          'active_ids': curDialogData?.active_ids || selectRows.id
        }
      }
    }).then(async res => {
      if (res.type === 'ir.actions.act_window') {
        const viewInfo = await loadViews(res, res.views, true)
        dialogStack.value.push({
          fieldViewInfoDialog: viewInfo.fieldViewInfo,
          archDialog: viewInfo.arch,
          curViewTypeDialog: viewInfo.viewType,
          searchViewInfoDialog: viewInfo.searchViewInfo,
          dataDialog: datas,
          visible: true,
          actionDialog: viewInfo.action,
          formViewInfoDialog: viewInfo.formViewInfo,
          active_ids: selectRows?.id || [datas.id],
          preDialogReload: dialogStack.value.length ? record_ref.value.formview_ref.main : dialog_ref.value.record_ref?.formview_ref.main
        })
      } else if (curDialog?.dialogVisible && res) {  // 加载完成需隐藏弹框
        curDialog.dialogVisible = false;
        curDialogData.visible = false;
        curDialogData.preDialogReload();  // 重载前一个页面
      }
    })
  } else {
    if (curDialog?.dialogVisible) {
      curDialog.dialogVisible = false;
      curDialogData.visible = false;
    }
  }
}


const getDetailClick = (data) => {  // 列表页进入详情跳转
  router.push({
    path: router.currentRoute.value.fullPath,
    query: {
      action_id: router.currentRoute.value.query.action_id,
      type: 'form',
      id: data.id
    }
  })
}


const getLineDetailClick = (dataLine, index, formViewInfo, relation_field) => {  // 加载行详情
  dialogStack.value.push({
    fieldViewInfoDialog: formViewInfo,  // 表单试图数据
    archDialog: formViewInfo.arch,  // 详情xml数据
    curViewTypeDialog: 'form',  // 加载详情视图为表单
    dataDialog: dataLine, // 弹框的初始加载数据， 加载行详情时传
    relation_field: relation_field,  // 关联的抬头字段
    visible: true,
    actionDialog: {},  // 详情弹框没有action
    preDialogReload: !dialogStack.value.length   // 重载前一个弹框或者界面
        ? record_ref.value.formview_ref.main
        : dialog_ref.value[dialog_ref.value.length - 1].record_ref?.formview_ref.main
  })
}


const main = () => {
  loadAction(action.value.id || action_id.value).then(res => {
    action_id.value = res.action.id;  // odoo xml的action id
    action.value = res.action;   // odoo返回的action参数
    fieldViewInfo.value = res.fieldViewInfo;  // 当前视图的数据
    searchViewInfo.value = res.searchViewInfo;  // 搜索框视图数据
    treeViewInfo.value = res.treeViewInfo;  // 列表页驶入数据
    formViewInfo.value = res.formViewInfo;  // 表单页试图数据
    arch.value = res.arch;  // 当前页xml解析数据
  });
}

main()

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