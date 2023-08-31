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
      <RenderField :children="children"
                   :data="datas"
                   :model="model"
                   :activeTab="activeTab"
                   viewType="form"
                   :disabled="disabled"
                   :viewFields="viewFields"
                   @handleButtonClick="buttonClick"
                   @getLineDetailClick="getLineDetailClick"
      />
    </template>
  </el-form>
</template>

<script lang="ts" setup>

import {computed, defineEmits, defineExpose, defineProps, ref} from "vue";
import {callRead} from "../../service/module/call";
import RenderField from '../../components/base/RenderField.vue'


import {useRoute} from "vue-router";


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

const datas = ref({})
if (!props.isDialog && !props.data) {
  callRead({
    model: props.model,
    args: [parseInt(id), Object.keys(props.viewFields || {})],
  }).then(async res => {
    datas.value = res[0];
  })
} else if (props.data) {
  datas.value = props.data;
} else {
  const data = {};
  for (const field of Object.keys(props.viewFields)) {
    data[field] = '';
  }
  datas.value = data;
}


const emits = defineEmits(['buttonClick', 'getLineDetailClick']);
const buttonClick = (button) => {
  emits('buttonClick', button, props.model, datas.value)
}
const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
}

defineExpose({
  datas
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