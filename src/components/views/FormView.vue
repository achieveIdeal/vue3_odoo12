<template>
  <el-form
      v-if="Object.keys(datas||{}).length || isDialog"
      ref="form_ref"
      :inline="true"
      :model="{formData:datas, treeData}"
      label-position="left"
      label-width="120px"
      class="form-inline">
    <template v-for="children in arch.children"
              :key="children.attrs.name">
      <RenderField :children="children"
                   :data="datas"
                   :treeData="treeData"
                   :model="model"
                   :isDialog="isDialog"
                   :extras="extras"
                   :fields="fields"
                   :activeTab="activeTab"
                   viewType="form"
                   :disabled="disabled"
                   :loading="loading"
                   :viewFields="viewFields"
                   :treeViewFields="treeViewFields"
                   @handleButtonClick="buttonClick"
                   @lineButtonClick="lineButtonClick"
                   @getLineDetailClick="getLineDetailClick"
                   @deleteLineClick="deleteLineClick"
                   @addLineClick="addLineClick"
      />
    </template>
  </el-form>
</template>

<script lang="ts" setup>

import {computed, defineEmits, defineExpose, defineProps, onMounted, ref, watch} from "vue";
import {callKw, callParseDomain, callRead, callSearchRead} from "../../service/module/call";
import RenderField from '../../components/base/RenderField.vue'


import {useRoute} from "vue-router";
import {parseXMlToJson, eventBus} from "../../tools";
import {initFormData, initTreeData, setFormAttribute, setTreeAttribute} from "../../tools/init";

const route = useRoute();
const form_ref = ref('')

const props = defineProps({
  model: {
    type: String,
    default: '',
  }, data_id: {
    type: Number,
    default: 0,
  },
  arch: {
    type: Object,
    default: {}
  }, data: {
    type: Object,
  }, extras: {
    type: Object,
  }, relation_field: {
    type: String,
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
    default: false
  }, loading: {
    type: Boolean,
    default: true
  }
})

const fields = ref([]);
const activeTab = computed(  // 打开弹窗后会变
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
  /*
  * 格式化arch，将arch转为js数据，如果没有定义tree或form视图，请求后端加载默认的tree或form视图
  * */
  for (const children of (arch.children instanceof Array ? arch.children : [])) {
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
        const res = await callKw({   // 若未定义form,请求后端获取form
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
      children.children = [{  // 将获取的视图数据保存到当前的children在加载界面时渲染这些数据
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
  const recursion = async (arch, parent) => {
    const treeFields = [];
    for (const children of arch.children instanceof Array ? arch.children : []) {
      const fieldName = children.attrs?.name;
      if (arch.tag === 'tree' && Object.keys(treeViewFields.value || {}).length) {
        treeFields.push(fieldName);
        if (treeViewFields.value[parent.attrs.name][fieldName]) {
          treeViewFields.value[parent.attrs.name][fieldName].onchange = children.attrs.on_change
        }
      } else if (children.tag === 'field') {
        fields.self.push(fieldName);
        for (const attr of Object.keys(children.attrs || {})) {  // 将xml中的attr都同步到viewFields中
          props.viewFields[fieldName][attr] = children.attrs[attr]
          if (attr === 'domain') {
            props.viewFields[fieldName][attr] = await callParseDomain(children.attrs[attr])
          }
        }
      }
      recursion(children, arch)
    }
    if (arch.tag === 'tree' && Object.keys(treeViewFields.value || {}).length) {
      fields[parent.attrs.name] = treeFields;  // 保存一对多关联字段的字段属性
    }
  }
  await recursion(arch)
  return fields
}

const loadData = async (data_id) => {
  eventBus.emit('requestCallback')
  if (data_id) {
    const res = await callRead({
      model: props.model,
      args: [data_id, Object.keys(props.viewFields || {})],
    })
    datas.value = initFormData(res[0], props.viewFields);
    const treeViewFieldsInfo = {};
    for (const treeField of Object.keys(treeViewFields.value || {})) {
      setTreeAttribute(treeField, props.extras, treeViewFields.value);  // 将自定义的字段属性同步到viewFields中
      const res = await callSearchRead({
        model: props.viewFields[treeField].relation,
        fields: Object.keys(treeViewFields.value[treeField]),
        offset: 0,
        sort: props.viewFields[treeField]?.views?.tree?.arch?.attrs?.default_order || 'id',
        limit: props.viewFields[treeField]?.views?.tree?.arch?.attrs?.limit || 100,
        domain: ['|', ['id', 'in', datas.value[treeField] || []],
          [props.viewFields[treeField].relation_field, '=', datas.value['id']]],
      })
      treeViewFieldsInfo[treeField] = props.viewFields[treeField]?.views?.tree?.fields || {}
      treeData.value[treeField] = res.records;
    }
    initTreeData(treeData.value, treeViewFieldsInfo);
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
      datas.value[treeField] = []
    }
    emits('dataLoadedCallback', datas, treeData);
  }
  eventBus.emit('responseCallback')
  if (props.relation_field) {  // 如果时查看详情，保留关联字段的值
    datas.value[props.relation_field] = props.data[props.relation_field]
  }
}
const datas = ref();  // 抬头数据
const treeData = ref({});  // 表格数据
if (props.extras) {
  setFormAttribute(props.extras, props.viewFields);
}
const emits = defineEmits(['buttonClick', 'getLineDetailClick', 'dataLoadedCallback', 'deleteLineClick', 'addLineClick']);
const main = async () => {
  fields.value = await getFields();
  await loadData(props.data?.id || props.data_id);
}

main()

const buttonClick = (button) => {
  emits('buttonClick', button, props.model, datas.value)
}

const lineButtonClick = (field, row, button, model) => {
  emits('buttonClick', button, model, row)
}
const getLineDetailClick = (data, index, formViewInfo, relation_field) => {
  emits('getLineDetailClick', data, index, formViewInfo, relation_field)
}

const deleteLineClick = (treeField, index, treeData, row, noDeleteCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noDeleteCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

defineExpose({
  form_ref, main
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