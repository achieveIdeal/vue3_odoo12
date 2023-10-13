<template>
  <el-button style="display: none" v-loading.fullscreen.lock="loading" element-loading-text="正在加载..."/>
  <template v-for="(dialog, index) in dialogStack" :key="index">
    <DialogView
        ref="dialog_ref"
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
      v-if="Object.keys(arch ||{}).length"
      :arch="arch"
      :loaded_data="loaded_data"
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
      @actionItemClick="buttonClick"

  />
</template>


<script lang="ts" setup>
import {callAction, callCreate, callKw, callMethod, callViews} from "../service/module/call";
import {defineEmits, defineProps, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {formatArch, generateViews} from "../tools";
import RecordView from '../components/RecordView.vue'
import DialogView from './views/DialogView.vue'


const props = defineProps({
  action_name: {
    default: ''
  },
  extras: {
    default: {}
  },
  params: {
    type: Object
  }
})

const loading = ref(false);
const route = useRoute();
const router = useRouter();

const curViewType = ref(route.query.type || 'tree');
const action_id = ref(parseInt(route.query.action_id || '0') || props.action_name);
const model = ref(route.query.model);
const view_id = ref(parseInt(route.query.view_id));
const loaded_data = ref({id: parseInt(route.query.id)})
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
  const search = res_views.find(r => r[1] === 'search')
  if (!search) {
    res_views.push([false, 'search'])
  }
  if (action.res_model) {
    return await loadViews(action, res_views || [[false, 'search'], [false, 'tree'], [false, 'form']], is_button)
  }
}

const emits = defineEmits(['deleteLineClick', 'addLineClick'])

watch(route, (f, t) => {
  const vType = t.query.type
  curViewType.value = !vType ? 'tree' : 'form';
  fieldViewInfo.value = !vType ? treeViewInfo.value : formViewInfo.value;
  arch.value = fieldViewInfo.value.arch;
  dialog_ref.value = [];
  dialogStack.value = [];
  formatArch(arch.value);  // 格式化xml诗句为json

})

const deleteLineClick = (treeField, index, treeData, row, noAddCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noAddCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}


const evalContext = (context, data) => {
  if (!context) return;
  const regex = /'([^']+)'\s*:\s*([^,]+)/g;
  const replacedData = context.replace(regex, (match, key, value) => {
    const trimmedValue = value.trim();
    let replacement = trimmedValue;
    if (data.hasOwnProperty(trimmedValue)) {
      replacement = data[trimmedValue];
      if (fieldViewInfo.value.viewFields[trimmedValue].type === 'many2one') {
        return `"${key}": ${replacement[0]}`;
      }
      return `"${key}": "${replacement}"`;
    }
    return `"${key}": ${replacement}`;
  });
  const fixedData = replacedData.replace(/'/g, '"');
  return JSON.parse(fixedData.replace(/\s*,\s*}/g, '}'));
};


const handleActionButton = (button, res_model, curDialog_ref, dialogId, datas, selectRows) => {
  /*
  * 处理类型未action的按钮点击时间
  * button: 点击的按钮参数
  * res_model: 迪纳基的按钮所属的模型
  * curDialog_ref: 最前弹框的ref引用
  * dialogId: 弹框的唯一标识
  * datas: form数据
  * selectRows： 选中行数据
  * */
  let curDialogData = dialogStack.value.find(r => r.dialogId === dialogId);
  if (curDialogData) {  // 重复打开相同弹框  需更新其active_ids
    curDialogData.active_ids = selectRows?.id || [datas.id]
  }
  const action_id = parseInt(button.attrs.name);  // 获取action id
  let index = dialogStack.value.indexOf(curDialogData)
  if (index !== -1) {   //  找到已存在的dialog显示
    curDialog_ref = dialog_ref.value[index]
    curDialog_ref.dialogVisible = true;
    return true;
  }

  loadAction(action_id, true).then(res => {
    let preDialogReload = record_ref.value.formview_ref?.main || record_ref.value.listview_ref?.main;
    if (dialogStack.value.length) {
      preDialogReload = dialog_ref.value.record_ref?.formview_ref.main;
    }
    dialogStack.value.push({  // 向弹框栈里推入加载弹框需要的数据
      dialogId: dialogId,
      fieldViewInfoDialog: res.fieldViewInfo,
      archDialog: res.arch,
      curViewTypeDialog: res.viewType,
      searchViewInfoDialog: res.searchViewInfo,
      dataDialog: null,
      actionDialog: res.action,
      formViewInfoDialog: res.formViewInfo,
      active_ids: selectRows?.id || [datas.id],
      context: evalContext(button.attrs.context, datas || selectRows),
      preDialogReload: preDialogReload
    })
  })
}

const checkDialogData = (res_model, curDialog_ref, curDialogData, datas) => {
  console.log(curDialogData, 'curDialogData');
  return new Promise((resolve, reject) => {
    const formEl = curDialog_ref?.record_ref.formview_ref.form_ref;
    if (!formEl) {
      resolve(true);
      return
    }
    if (curDialogData?.dataDialog?.id || datas?.id) {
      resolve(true)
      return
    }
    formEl.validate(async (valid) => {
      if (valid && !curDialogData?.dataDialog?.id && !datas?.id) {  // 如果是弹框上的object，需调用创建
        datas.id = await callCreate({model: res_model, data: datas})
      }
      resolve(valid)
    })
  })
}

const handleObjectButton = async (button, res_model, curDialog_ref, curDialogData, datas, selectRows) => {
  /*
* 处理类型未action的按钮点击时间
* button: 点击的按钮参数
* res_model: 迪纳基的按钮所属的模型
* curDialog_ref: 最前弹框的ref引用
* dialogId: 弹框的唯一标识
* datas: form数据
* selectRows： 选中行数据
* */
  const isValid = await checkDialogData(res_model, curDialog_ref, curDialogData, datas)
  if (!isValid) return
  let context = {};  //  按钮上绑定的context
  let buttonContext;
  if (curDialogData?.context) {
    context = curDialogData.context
  }
  if (button.attrs.context) {
    buttonContext = evalContext(button.attrs.context, datas || selectRows)
    for (const field of Object.keys(buttonContext)) {
      context[field] = buttonContext[field]
    }
  }
  callKw({
    model: res_model,
    method: button.attrs.name || button.name,
    args: [datas.id],
    kwargs: {
      context: {
        'active_id': curDialogData?.active_ids.length ? curDialogData?.active_ids[0] : (datas || selectRows).id,
        'active_ids': curDialogData?.active_ids || selectRows.id,
        ...context
      }
    }
  }).then(async res => {
    let dialogId = res?.res_id + res?.res_model;
    let curDialogData = dialogStack.value[dialogStack.value.length - 1];
    if (res.type === 'ir.actions.act_window') {  // 返回action时
      let curDialogData = dialogStack.value.find(r => r.dialogId === dialogId);
      const viewInfo = await loadViews(res, res.views, true);
      if (res.target === 'new') {
        let index = dialogStack.value.indexOf(curDialogData)
        if (index !== -1) {
          curDialog_ref = dialog_ref.value[index]
          curDialog_ref.dialogVisible = true;
          curDialogData.dataDialog.id = null;
          curDialog_ref.record_ref?.setDataEmpty();
          return true;
        }
        let preDialogReload = record_ref.value.formview_ref?.main || record_ref.value.listview_ref?.main;
        if (dialogStack.value.length) {
          preDialogReload = dialog_ref.value.record_ref?.formview_ref.main;
        }
        dialogStack.value.push({  // 弹框
          dialogId: dialogId,
          fieldViewInfoDialog: viewInfo.fieldViewInfo,
          archDialog: viewInfo.arch,
          curViewTypeDialog: viewInfo.viewType,
          searchViewInfoDialog: viewInfo.searchViewInfo,
          dataDialog: {id: res.res_id},
          actionDialog: res,
          formViewInfoDialog: viewInfo.formViewInfo,
          active_ids: selectRows?.id || [datas.id],
          preDialogReload: preDialogReload
        })
      } else {  // 替换当前界面
        router.push({
          path: '/action',
          query: {
            id: res.res_id,
            name: res.name,
            view_id: res.views[0][0],
            model: res.res_model,
            type: res.views[0][1]
          }
        })
      }
    } else if (curDialog_ref?.dialogVisible && res) {  // 加载完成需隐藏弹框
      curDialog_ref.dialogVisible = false;
      curDialogData.preDialogReload();  // 重载前一个页面
    } else if (res.type === 'ir.actions.act_url') {
      window.open(res.url, '_blank')
    }
  })
}
const buttonClick = async (button, res_model, datas, selectRows) => {
  let curDialog_ref = dialog_ref.value[dialog_ref.value.length - 1];
  let curDialogData = dialogStack.value[dialogStack.value.length - 1];
  const dialogId = button.attrs?.name;
  if (button.attrs.type === 'action') {  // 类型为action的按钮点击时
    handleActionButton(button, res_model, curDialog_ref, dialogId, datas, selectRows)
  } else if (button.attrs.type === 'object') {  // 类型为object的按钮点击时
    await handleObjectButton(button, res_model, curDialog_ref, curDialogData, datas, selectRows)
  } else {
    if (curDialog_ref?.dialogVisible) {
      curDialog_ref.dialogVisible = false;
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
  const dialogId = dataLine
  const curDialogData = dialogStack.value.find(r => r.dialogId === dialogId)
  let dialogIndex = dialogStack.value.indexOf(curDialogData)
  if (dialogIndex !== -1) {
    let curDialog_ref = dialog_ref.value[dialogIndex];
    curDialog_ref.dialogVisible = true;
    return true;
  }
  let preDialogReload = record_ref.value.formview_ref?.main || record_ref.value.listview_ref?.main;
  if (dialogStack.value.length) {
    preDialogReload = dialog_ref.value.record_ref?.formview_ref.main;
  }
  dialogStack.value.push({
    dialogId: dialogId,
    fieldViewInfoDialog: formViewInfo,  // 表单试图数据
    archDialog: formViewInfo.arch,  // 详情xml数据
    curViewTypeDialog: 'form',  // 加载详情视图为表单
    dataDialog: dataLine, // 弹框的初始加载数据， 加载行详情时传
    relation_field: relation_field,  // 关联的抬头字段
    actionDialog: {},  // 详情弹框没有action
    preDialogReload: preDialogReload
  })
}


const main = () => {
  if (props.params) {
    generateViews(props.params).then(res => {
      const vType = route.query.type
      formViewInfo.value = res.formViewInfo;
      treeViewInfo.value = res.treeViewInfo;
      fieldViewInfo.value = !vType ? treeViewInfo.value : formViewInfo.value;
      arch.value = fieldViewInfo.value.arch;  // 当前页xml解析数据
      action.value = {
        res_model: props.params.model,
        domain: props.params.domain,
        limit: 80
      }
    })
    // searchViewInfo.value = res.searchViewInfo;  // todo 搜索框视图数据
  } else if (action.value.id || action_id.value) {
    loadAction(action.value.id || action_id.value).then(res => {
      action_id.value = res.action.id;  // odoo xml的action id
      action.value = res.action;   // odoo返回的action参数
      fieldViewInfo.value = res.fieldViewInfo;  // 当前视图的数据
      searchViewInfo.value = res.searchViewInfo;  // 搜索框视图数据
      treeViewInfo.value = res.treeViewInfo;  // 列表页驶入数据
      formViewInfo.value = res.formViewInfo;  // 表单页试图数据
      arch.value = res.arch;  // 当前页xml解析数据
    });
  } else {
    loadViews({res_model: model.value}, [[view_id.value, curViewType.value]]).then(res => {
      action_id.value = res.action.id;  // odoo xml的action id
      action.value = res.action;   // odoo返回的action参数
      fieldViewInfo.value = res.fieldViewInfo;  // 当前视图的数据
      searchViewInfo.value = res.searchViewInfo;  // 搜索框视图数据
      treeViewInfo.value = res.treeViewInfo;  // 列表页驶入数据
      formViewInfo.value = res.formViewInfo;  // 表单页试图数据
      arch.value = res.arch;  // 当前页xml解析数据
    })
  }
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