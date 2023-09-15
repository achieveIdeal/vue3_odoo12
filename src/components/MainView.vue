<template>
  <template v-for="(dialog, index) in dialogStack" :key="index">
    <DialogView
        ref="dialog_ref"
        :isDialog="true"
        :index="index"
        :dataDialog="dialog.dataDialog"
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
const record_ref = ref()

const action = ref({});
const fieldViewInfo = ref({});
const searchViewInfo = ref({});
const treeViewInfo = ref({});
const formViewInfo = ref({});
const arch = ref({});

const dialogStack = ref([]);

const dialog_ref = ref([]);

const loadAction = async (action_id, is_button) => {
  const action = await callAction(action_id);
  if (action.res_model) {
    const views = await callViews(action.res_model, [[false, 'search'], [false, 'tree'], [false, 'form']])
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
}

const emits = defineEmits(['deleteLineClick', 'addLineClick'])

// const dialogCreateClick = (data) => {
//   console.log(dataDialog,'dataDialog');
//   console.log(datas,'datas');
//   for (const field of Object.keys(dataDialog || {})) {
//     dataDialog[field] = '';
//   }
// }

watch(route, (f, t) => {
  const vType = t.query.type
  curViewType.value = !vType ? 'tree' : 'form';
  fieldViewInfo.value = !vType ? treeViewInfo.value : formViewInfo.value;
  arch.value = fieldViewInfo.value.arch
  formatArch(arch.value);
})

const deleteLineClick = (treeField, index, treeData, row, noAddCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noAddCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

const buttonClick = async (button, model, datas, selectRows) => {
  const curDialog = dialog_ref.value[dialog_ref.value.length - 1];
  if (button.attrs.type === 'action') {
    const action_id = parseInt(button.attrs.name);
    loadAction(action_id, true).then(res => {
      dialogStack.value.push({
        fieldViewInfoDialog: res.fieldViewInfo,
        archDialog: res.arch,
        curViewTypeDialog: res.viewType,
        searchViewInfoDialog: res.searchViewInfo,
        dataDialog: null,
        actionDialog: res.action,
        formViewInfoDialog: res.formViewInfo,
        active_ids: selectRows?.id || [datas.id],
        preDialogReload: dialogStack.value[dialogStack.value.length - 1]?.preDialogReload
            || record_ref.value.formview_ref.main
      })
    })
  } else if (button.attrs.type === 'object') {
    const curDialogData = dialogStack.value[dialog_ref.value.length - 1];
    if (!curDialogData?.dataDialog && !datas?.id) {
      datas.id = await callCreate({model, data: datas})
    }
    callKw({
      model: model,
      method: button.attrs.name,
      args: [datas.id],
      kwargs: {
        context: {
          'active_id': curDialogData?.active_ids[0] || datas.id,
          'active_ids': curDialogData?.active_ids || selectRows.id
        }
      }
    }).then(res => {
      if (curDialog?.dialogVisible && res) {
        curDialog.dialogVisible = false;
        curDialogData.preDialogReload();
      }
    })
  } else {
    if (curDialog?.dialogVisible) {
      curDialog.dialogVisible = false;
    }
  }
}
const getDetailClick = (data) => {
  router.push({
    path: router.currentRoute.value.fullPath,
    query: {
      action_id: router.currentRoute.value.query.action_id,
      type: 'form',
      id: data.id
    }
  })
}


const getLineDetailClick = (dataLine, index, formViewInfo,relation_field) => {
  dialogStack.value.push({
    fieldViewInfoDialog: formViewInfo,
    archDialog: formViewInfo.arch,
    curViewTypeDialog: 'form',
    dataDialog: dataLine,
    relation_field: relation_field,
    visible: true,
    actionDialog: {},
  })
}


const main = () => {
  loadAction(action.value.id || action_id.value).then(res => {
    action_id.value = res.action.id;
    action.value = res.action;
    fieldViewInfo.value = res.fieldViewInfo;
    searchViewInfo.value = res.searchViewInfo;
    treeViewInfo.value = res.treeViewInfo;
    formViewInfo.value = res.formViewInfo;
    arch.value = res.arch;
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