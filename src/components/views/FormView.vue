<template>
  <el-form
      v-if="Object.keys(datas||{}).length"
      ref="formRef"
      :inline="true"
      :model="datas"
      label-position="left"
      label-width="120px"
      class="form-inline">
    <template v-for="children in arch.children"
              :key="children.attrs.name">
      <RenderField v-if="Object.keys(treeData||{}).length || !Object.keys(treeViewFields||{}).length"
                   :children="children"
                   :data="datas"
                   :treeData="treeData"
                   :model="model"
                   :activeTab="activeTab"
                   viewType="form"
                   :disabled="disabled"
                   :loading="loading"
                   :viewFields="viewFields"
                   :treeViewFields="treeViewFields"
                   @handleButtonClick="buttonClick"
                   @getLineDetailClick="getLineDetailClick"
      />
    </template>
  </el-form>
</template>

<script lang="ts" setup>

import {computed, defineEmits, defineExpose, defineProps, onMounted, ref} from "vue";
import {callKw, callRead, callSearchRead} from "../../service/module/call";
import RenderField from '../../components/base/RenderField.vue'


import {useRoute} from "vue-router";
import {parseXMlToJson} from "../../tools";
import {initListData} from "../../tools/init";


const route = useRoute();
const id = route.query.id;
const props = defineProps({
  model: {
    type: String,
    default: '',
  },
  arch: {
    type: Object,
    default: {}
  }, data: {
    type: Object,
  },
  viewFields: {
    type: Object,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  }, isDialog: {
    type: Boolean,
    default: true
  }, loading: {
    type: Boolean,
    default: true
  }
})

const activeTab = computed(
    () => {
      const viewFields = props.viewFields
      for (const field of Object.keys(viewFields)) {
        if (Object.keys(viewFields[field]?.views || {}).length) {
          return field
        }
      }
    }
)

const treeViewFields = computed(() => {
  const viewFields = props.viewFields;
  const treeOption = {};
  for (const field of Object.keys(viewFields)) {
    if (Object.keys(viewFields[field]?.views || {}).length) {
      treeOption[field] = viewFields[field]?.views?.tree?.fields
    }
  }
  return treeOption
})

const formatArch = async (arch) => {
  for (const children of arch.children) {
    if (Object.keys(props.viewFields[children.attrs?.name]?.views || {}).length) {
      let formView = props.viewFields[children.attrs?.name]?.views?.form;
      let treeView = props.viewFields[children.attrs?.name]?.views?.tree;
      const model = props.viewFields[children.attrs?.name].relation;
      const formArch = props.viewFields[children.attrs?.name]?.views?.form?.arch;
      const treeArch = props.viewFields[children.attrs?.name]?.views?.tree?.arch;
      if (formArch) {
        formView.arch = typeof formArch === "string" ? parseXMlToJson(props.viewFields[children.attrs?.name]?.views?.form?.arch) : treeArch;
        formView.base_model = model
      } else {
        const res = await callKw({
          model: model,
          method: 'load_views',
          args: [[[false, 'form']]]
        })
        formView = {
          ...res.fields_views.form,
          base_model: model,
          arch: parseXMlToJson(res.fields_views.form.arch)
        }
        props.viewFields[children.attrs.name].views.form = formView
      }
      if (treeArch) {
        treeView.arch = typeof treeArch === "string" ? parseXMlToJson(props.viewFields[children.attrs?.name]?.views?.tree?.arch) : treeArch;
        treeView.base_model = model
      } else {
        const res = await callKw({
          model: model,
          method: 'load_views',
          args: [[[false, 'tree']]]
        })
        treeView = {
          ...res,
          base_model: model,
          arch: parseXMlToJson(res.arch)
        }
        props.viewFields[children.attrs.name].views.tree = treeView
      }
      children.children = [{
        ...treeView.arch,
        formViewInfo: formView,
        field: children.attrs?.name,
        string: props.viewFields[children.attrs?.name]?.string
      }]
    }
    children.children && formatArch(children)
  }
}


onMounted(async () => {
  formatArch(props.arch)
})

const datas = ref({});
const treeData = ref({})
const emits = defineEmits(['buttonClick', 'getLineDetailClick', 'dataLoadedCallback']);
if (!props.data) {
  callRead({
    model: props.model,
    args: [parseInt(id), Object.keys(props.viewFields || {})],
  }).then(async res => {
    datas.value = res[0];
    for (const treeField of Object.keys(treeViewFields.value || {})) {
      callSearchRead({
        model: props.viewFields[treeField].relation,
        fields: Object.keys(treeViewFields.value[treeField]),
        offset: 0,
        limit: 100,
        domain: ['|', ['id', 'in', datas.value[treeField] || []],
          [props.viewFields[treeField].relation_field, '=', datas.value['id']]],
      }).then(async res => {
        treeData.value[treeField] = await initListData(res.records, props.viewFields);
        emits('dataLoadedCallback', {...datas.value, ...treeData.value});
      })
    }
  })
} else {
  datas.value = props.data;
  for (const treeField of Object.keys(treeViewFields.value || {})) {
    callSearchRead({
      model: props.viewFields[treeField].relation,
      fields: Object.keys(treeViewFields.value[treeField]),
      offset: 0,
      limit: 100,
      domain: ['|', ['id', 'in', datas.value[treeField] || []],
        [props.viewFields[treeField].relation_field, '=', datas.value['id']]],
    }).then(async res => {
      treeData.value[treeField] = await initListData(res.records, props.viewFields);
      emits('dataLoadedCallback', {...datas.value, ...treeData.value});
    })
  }
}


const buttonClick = (button) => {
  emits('buttonClick', button, props.model, datas.value)
}
const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}

defineExpose({
  datas, treeData
})

</script>

<style lang="less">
.item-text {
  border-bottom: 1px solid #eef1fa;
}

.el-form-item__content {
  min-width: 220px;
}

.el-form-item__label {
  font-weight: 700;
}
</style>