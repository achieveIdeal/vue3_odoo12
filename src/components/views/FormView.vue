<template>
  <el-form
      v-if="Object.keys(datas||{}).length"
      ref="form_ref"
      :inline="true"
      :model="{formData:datas, treeData}"
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
                   :extras="extras"
                   :fields="fields"
                   :activeTab="activeTab"
                   viewType="form"
                   :disabled="disabled"
                   :loading="loading"
                   :viewFields="viewFields"
                   :treeViewFields="treeViewFields"
                   @handleButtonClick="buttonClick"
                   @getLineDetailClick="getLineDetailClick"
                   @deleteLineClick="deleteLineClick"
                   @addLineClick="addLineClick"
                   @fieldOnchange="fieldOnchange"
      />
    </template>
  </el-form>
</template>

<script lang="ts" setup>

import {computed, defineEmits, defineExpose, defineProps, onMounted, ref, watch} from "vue";
import {callKw, callRead, callSearchRead} from "../../service/module/call";
import RenderField from '../../components/base/RenderField.vue'


import {useRoute} from "vue-router";
import {parseXMlToJson} from "../../tools";
import {initListData, setFormAttribute, setTreeAttribute} from "../../tools/init";

const route = useRoute();
let real_id = parseInt(route.query.id);
const form_ref = ref('')

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
  }, extras: {
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

watch(route, async (f, t) => {
  const data_id = t.query.id;
  if (data_id) {
    real_id = parseInt(data_id);
    await loadData(real_id)
  }
})

const fields = ref([]);
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
console.log(props.viewFields);
const formatArch = async (arch) => {
  for (const children of (arch.children instanceof Array?arch.children:[])) {
    if (Object.keys(props.viewFields[children.attrs?.name]?.views || {}).length) {
      let formView = props.viewFields[children.attrs?.name]?.views?.form;
      let treeView = props.viewFields[children.attrs?.name]?.views?.tree;
      const model = props.viewFields[children.attrs?.name].relation;
      const formArch = props.viewFields[children.attrs?.name]?.views?.form?.arch;
      const treeArch = props.viewFields[children.attrs?.name]?.views?.tree?.arch;
      if (formArch) {
        formView.arch = typeof formArch === "string" ? parseXMlToJson(props.viewFields[children.attrs?.name]?.views?.form?.arch) : formArch;
        formView.base_model = model
      } else {
        const res = await callKw({   // 若为定义form,请求后端获取form
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
        const res = await callKw({  // 若为定义tree,请求后端获取tree
          model: model,
          method: 'load_views',
          args: [[[false, 'tree']]]
        })
        treeView = {
          ...res.fields_views.tree,
          base_model: model,
          arch: parseXMlToJson(res.fields_views.tree.arch)
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
    children.children?.length && await formatArch(children)
  }
}


const getFields = async () => {
  const arch = props.arch;
  await formatArch(arch)
  const fields = {self: []};
  const recursion = (arch, parent) => {
    const treeFields = []
    for (const children of arch.children instanceof Array?arch.children:[]) {
      if (arch.tag === 'tree') {
        treeFields.push(children.attrs.name)
      } else if (children.tag === 'field') {
        fields.self.push(children.attrs.name)
      }
      recursion(children, arch)
    }
    if (arch.tag === 'tree') {
      fields[parent.attrs.name] = treeFields
    }
  }
  recursion(arch)
  return fields
}

const loadData = async (data_id) => {
  if (data_id) {
    const res = await callRead({
      model: props.model,
      args: [data_id, Object.keys(props.viewFields || {})],
    })
    datas.value = res[0];
    for (const treeField of Object.keys(treeViewFields.value || {})) {
      setTreeAttribute(treeField, props.extras, treeViewFields.value);
      const res = await callSearchRead({
        model: props.viewFields[treeField].relation,
        fields: Object.keys(treeViewFields.value[treeField]),
        offset: 0,
        limit: 100,
        domain: ['|', ['id', 'in', datas.value[treeField] || []],
          [props.viewFields[treeField].relation_field, '=', datas.value['id']]],
      })
      treeData.value[treeField] = res.records;
    }
    emits('dataLoadedCallback', datas, treeData);
  } else {
    const fields = await getFields();
    const res = await callKw({
      model: props.model,
      method: 'default_get',
      args: [fields['self']]
    })
    const data = {};
    for (const field of fields['self']) {
      data[field] = res[field] || ''
      if (['float', 'integer'].includes(props.viewFields[field].type)) {
        data[field] = parseFloat(res[field]) || 0
      }
    }
    datas.value = data;
    for (const treeField of Object.keys(treeViewFields.value || {})) {
      setTreeAttribute(treeField, props.extras, treeViewFields.value);
      treeData.value[treeField] = [];

    }
    emits('dataLoadedCallback', datas, treeData);
  }
}
const datas = ref();  // 抬头数据
const treeData = ref({});  // 表格数据
if (props.extras) {
  setFormAttribute(props.extras, props.viewFields);
}
const emits = defineEmits(['buttonClick', 'getLineDetailClick', 'dataLoadedCallback', 'deleteLineClick', 'addLineClick', 'fieldOnchange']);
const main = async () => {
  fields.value = await getFields();
  if (!props.data) {   // 加载详情时，不需要请求后端获取抬头数据
    await loadData(real_id);
  } else {
    datas.value = props.data;
    for (const treeField of Object.keys(treeViewFields.value || {})) {
      setTreeAttribute(treeField, props.extras, treeViewFields.value);
      const res = callSearchRead({
        model: props.viewFields[treeField].relation,
        fields: Object.keys(treeViewFields.value[treeField]),
        offset: 0,
        limit: 100,
        domain: ['|', ['id', 'in', datas.value[treeField] || []],
          [props.viewFields[treeField].relation_field, '=', datas.value['id']]],
      })
      treeData.value[treeField] = res.records;
    }
    emits('dataLoadedCallback', datas, treeData);
  }
}

main()

const buttonClick = (button) => {
  emits('buttonClick', button, props.model, datas.value)
}
const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}

const deleteLineClick = (treeField, index, treeData, row, noDeleteCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noDeleteCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

const fieldOnchange = (params, noChange) => {
  console.log(2222);
  emits('fieldOnchange', params, noChange)
}
defineExpose({
  form_ref
})
</script>

<style lang="less">

.el-form-item__content {
  min-width: 220px;
}

.el-form-item__label {
  font-weight: 700;
}
</style>