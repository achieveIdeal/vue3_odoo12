<template>
  <el-form-item
      v-if="!(
        parseDomain(
          (
            !!treeField.length
            ?treeViewFields[treeField]
            : viewFields
          )[children.attrs?.name]?.invisible
          || children.attrs?.invisible, data)
          ||children.attrs?.invisible
        )
      && children.tag==='field'"
      :style="{width: !Object.keys(treeViewFields).includes(children.attrs?.name)?'30%':'100%',margin: viewType==='tree'?0:null}"
      :prop="viewType==='form'?['formData',children.attrs?.name]:viewType==='tree'
        ?['treeData',treeField,index, children.attrs.name]:[index,children.attrs.name]"
      :label="viewType==='form'
        && !Object.keys(treeViewFields).includes(children.attrs?.name)
          ? (
            !!treeField.length
            ?treeViewFields[treeField]
            : viewFields
          )[children.attrs?.name]?.string:''"
      :rules="(
          !!treeField.length
          ?treeViewFields[treeField]
          : viewFields
        )[children.attrs.name]?.rules
        ||[{
        required: parseDomain(
          (
            !!treeField.length
            ?treeViewFields[treeField]
            : viewFields
          )[children.attrs.name]?.required, data
        ),
        message: (
          !!treeField.length
          ?treeViewFields[treeField]
          : viewFields
        )[children.attrs.name]?.string + '不能为空!',
        trigger: 'blur'
        }]">
    <component
        :is="FIELD_VIEW_MAP[(!!treeField.length?treeViewFields[treeField]: viewFields)[children.attrs?.name]?.type]"
        v-if="Object.keys(data||{}).length"
        :data="data"
        :model="model"
        :formModel="formModel"
        :formData="formData"
        :attrs="children.attrs"
        :viewType="viewType"
        :treeData="treeData"
        :treeField="treeField"
        :treeViewFields="treeViewFields"
        :viewFields="viewFields"
        :field="children.attrs?.name"
        :option="(!!treeField.length?treeViewFields[treeField]: viewFields)[children.attrs?.name]"
        :readonly="!!parseDomain((!!treeField.length?treeViewFields[treeField]: viewFields)[children.attrs?.name]?.readonly
        ||children.attrs.readonly, data)"
        :disabled="disabled"
        :loading="loading"
    >
      <template v-if="((children.children || []))?.length" v-for="subChildren in (children.children || [])">
        <RenderField
            :children="subChildren"
            :parent="children"
            :extras="extras"
            :isDialog="isDialog"
            :relation_field="relation_field"
            :formModel="formModel"
            :formData="formData"
            :viewType="viewType"
            :treeViewFields="treeViewFields"
            :activeTab="activeTab"
            :data="data"
            :index="index"
            :treeField="treeField"
            :model="model"
            :fields="fields"
            :treeData="treeData"
            :field="subChildren.attrs?.name"
            :option="viewFields[subChildren.attrs?.name]"
            :readonly="parseDomain(subChildren.attrs?.readonly, data)"
            :disabled="disabled"
            :viewFields="viewFields"
            @getLineDetailClick="getLineDetailClick"
            @deleteLineClick="deleteLineClick"
            @addLineClick="addLineClick"
            @lineButtonClick="lineButtonClick"
        />
      </template>
    </component>
  </el-form-item>
  <component v-else-if="children.tag==='form'" :is="FormView"
             :data="data"
             :treeData="treeData"
             viewType="form"
             :formModel="formModel"
             :formData="formData"
             :model="model"
             :field="children.attrs?.name"
             :option="viewFields[children.attrs?.name]"
             :treeViewFields="treeViewFields"
             :readonly="parseDomain(children.attrs.readonly, data)"
             :disabled="disabled"
             :loading="loading"
             :arch="children"
             :viewFields="viewFields[children.attrs?.name].props.option.views?.form.fields"
  >
    <template v-if="(children.children || [])?.length" v-for="subChildren in (children.children || [])">
      <RenderField
          :children="subChildren"
          :parent="children"
          :isDialog="isDialog"
          :extras="extras"
          :relation_field="relation_field"
          :activeTab="activeTab"
          :treeViewFields="treeViewFields"
          :data="data"
          :index="index"
          :treeField="treeField"
          :formModel="formModel"
          :formData="formData"
          :model="model"
          :fields="fields"
          :treeData="treeData"
          :viewType="viewType"
          :field="subChildren.attrs?.name"
          :option="viewFields[subChildren.attrs?.name]"
          :readonly="parseDomain(subChildren.attrs?.readonly, data)"
          :disabled="disabled"
          :viewFields="viewFields"
          @deleteLineClick="deleteLineClick"
          @addLineClick="addLineClick"
          @lineButtonClick="lineButtonClick"
      />
    </template>
  </component>
  <component v-else-if="children.tag==='tree'" :is="TableView"
             :formData="data"
             :isDialog="isDialog"
             :attributes="extras?.attributes?extras?.attributes[children.field]:{}"
             :fields="fields[children.field]"
             :treeField="children.field"
             :model="viewFields[children.field].relation"
             :formModel="model"
             :relation_field="viewFields[children.field].relation_field"
             :option="viewFields[children.field]"
             :readonly="parseDomain(children.attrs.readonly, data)"
             :disabled="disabled"
             :loading="loading"
             :treeViewFields="treeViewFields"
             :viewFields="viewFields"
             :treeData="treeData"
             :arch="children"
             :action="{res_model:viewFields[children.field].relation, domain:['|',['id', 'in', data[children.field] ||[]],
              [viewFields[children.field].relation_field, '=', data['id']]]}"
             :formViewInfo="{
                arch:children.formViewInfo.arch,
                base_model: viewFields[children.field].relation,
                viewFields:children.formViewInfo?.fields
             }"
             @getDetailClick="getLineDetailClick"
             @deleteLineClick="deleteLineClick"
             @addLineClick="addLineClick"
             @lineButtonClick="lineButtonClick"
  >
    <template v-if="(children.children || [])?.length" v-for="subChildren in (children.children || [])">
      <RenderField
          :children="subChildren"
          :isDialog="isDialog"
          :parent="children"
          :extras="extras"
          :relation_field="relation_field"
          :treeViewFields="treeViewFields"
          :activeTab="activeTab"
          :formModel="formModel"
          :formData="formData"
          :data="data"
          :index="index"
          :treeField="treeField"
          :model="model"
          :fields="fields"
          :treeData="treeData"
          :viewType="viewType"
          :field="subChildren.attrs?.name"
          :option="viewFields[subChildren.attrs?.name]"
          :readonly="parseDomain(subChildren.attrs?.readonly, data)"
          :disabled="disabled"
          :viewFields="viewFields"
          @deleteLineClick="deleteLineClick"
          @addLineClick="addLineClick"
          @lineButtonClick="lineButtonClick"
      />
    </template>
  </component>
  <component v-else-if="!(['field', 'form', 'tree','button'].includes(children.tag))"
             :is="createComponent(children, parent)">
    <template v-if="!parseDomain(children.attrs?.invisible, data)">
      <div v-if="(children.children || []).filter(r=>r.tag==='button')?.length">
        <template v-for="subChildren in (children.children || []).filter(r=>r.tag==='button')">
          <el-button :class="['btn-group',children.class]"
                     v-if="(!subChildren.attrs?.states
                     || (subChildren.attrs?.states||'')?.split(',').includes(data.state)
                      && !parseDomain(subChildren.attrs.invisible, data))&&(children.tag ==='footer' || disabled)"
                     @click="(e)=> handleButtonClick(e,subChildren)">
            {{ subChildren.attrs.string }}
          </el-button>
        </template>
      </div>
      <template v-if="(children.children || []).filter(r=>r.tag!=='button')?.length"
                v-for="subChildren in (children.children || []).filter(r=>r.tag!=='button')">
        <el-steps v-if="subChildren.attrs?.name==='state'"
                  :active="viewFields['state'].selection.map(r=>r[0]).indexOf(data['state'])" align-center
                  class="state-bar"
                  simple>
          <el-step class="state-bar-item" v-for="state in viewFields[subChildren.attrs?.name].selection"
                   :title="state[1]">
            <template #icon></template>
          </el-step>
        </el-steps>
        <template v-else-if="!subChildren.tag">
          {{ subChildren }}
        </template>
        <template v-else>
        </template>
        <RenderField
            v-else
            :children="subChildren"
            :isDialog="isDialog"
            :parent="children"
            :extras="extras"
            :activeTab="activeTab"
            :model="model"
            :data="data"
            :index="index"
            :relation_field="relation_field"
            :treeField="treeField"
            :formModel="formModel"
            :formData="formData"
            :fields="fields"
            :treeData="treeData"
            :treeViewFields="treeViewFields"
            :viewType="viewType"
            :field="subChildren.attrs?.name"
            :option="viewFields[subChildren.attrs?.name]"
            :readonly="parseDomain(subChildren.attrs?.readonly, data)"
            :disabled="disabled"
            :viewFields="viewFields"
            @getLineDetailClick="getLineDetailClick"
            @deleteLineClick="deleteLineClick"
            @addLineClick="addLineClick"
            @lineButtonClick="lineButtonClick"
        />
      </template>
    </template>
  </component>

  <el-button :class="['btn-group',children.class]"
             v-else-if="(children.tag==='button' && !children.attrs?.states
                     || (children.attrs?.states||'')?.split(',').includes(data.state)
                      && !parseDomain(children.attrs.invisible, data))&&disabled"
             @click="()=> lineButtonClick(treeField,data,children, model)">
    {{ children.attrs.string }}
  </el-button>
</template>

<script lang="ts" setup>
import {FIELD_VIEW_MAP} from "../../store/constants";
import {createVNode, defineEmits, defineProps, ref} from "vue";
import {defineComponent} from "vue";
import TableView from '../views/TableView.vue'
import FormView from '../views/FormView.vue'
import {onchangeField, parseDomain} from "../../tools";
import {useRoute} from "vue-router";
import {ElTabPane} from "element-plus";


const route = useRoute();
const tabsModel = ref("")

const props = defineProps({
  children: {
    type: Object,
    default: {}
  }, viewType: {
    type: String,
    default: ''
  }, formModel: {
    default: ''
  }, activeTab: {
    type: String,
    default: ''
  }, model: {
    type: String,
    default: ''
  }, treeField: {
    type: String,
    default: ''
  }, relation_field: {
    type: String,
    default: ''
  }, index: {
    type: Number,
  }, isDialog: {
    type: Boolean,
    default: false
  },
  parent: {
    type: Object,
    default: {}
  }, treeData: {
    type: Object,
    default: {}
  },
  viewFields: {
    type: Object,
    default: {}
  },
  treeViewFields: {
    type: Object,
    default: {}
  },
  data: {
    type: Object,
    default: {}
  }, formData: {
    type: Object,
    default: {}
  },
  attrs: {
    type: Object,
    default: {}
  }, extras: {
    type: Object,
    default: {}
  }, fields: {
    type: Object,
    default: []
  },
  disabled: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: true
  }
})
if (props.activeTab) {
  tabsModel.value = props.activeTab
}
const createComponent = (arch, parent) => {
  return defineComponent({
    setup(compProps, {slots, emit}) {
      let tag = arch.tag;
      const newProps = {...compProps}
      if (tag === 'sheet') {
        newProps.style = {
          ...newProps.style,
          textAlign: 'left',
        };
      }
      if (tag === 'header') {
        newProps.style = {
          ...newProps.style,
          display: 'flex',
          borderBottom: '1px solid #ced4da',
          alignItems: 'center',
          marginBottom: '20px',
          justifyContent: 'space-between'
        };
      }
      if (tag === 'notebook') {
        return () => createVNode(
            ElTabs,
            {...newProps, 'modelValue': tabsModel.value},
            () => slots.default && slots.default()
        );
      }
      if (tag === 'page') {
        newProps.style = {
          ...newProps.style,
          position: 'relative',
          width: '100%'
        };
        if (!(parseDomain(props.viewFields[arch.children[0].attrs.name]?.invisible, props.data)
            || parseDomain(arch.children[0].attrs?.invisible, props.data)
            || parseDomain(arch.attrs.invisible, props.data))) {
          return () => createVNode(
              ElTabPane,
              {...newProps, label: arch.attrs.string, name: arch.children[0].attrs.name},
              () => slots.default && slots.default()
          );
        }
      }
      return () => createVNode(
          tag, newProps,
          [
            slots.default && slots.default()
          ]
      );
    },
  });
}

const emits = defineEmits(['handleButtonClick', 'getLineDetailClick', 'deleteLineClick', 'addLineClick',
  'lineButtonClick'])
const handleButtonClick = (e, button) => {
  e.stopPropagation();
  emits('handleButtonClick', button)
}
const lineButtonClick = (field, row, button, model) => {
  emits('lineButtonClick', field, row, button, model)
}

const getLineDetailClick = (data, index, formViewInfo, relation_field) => {
  emits('getLineDetailClick', data, index, formViewInfo, relation_field)
}

const deleteLineClick = (treeField, index, treeData, row, noAddCallback) => {
  emits('deleteLineClick', treeField, index, treeData, row, noAddCallback)
}
const addLineClick = (treeField, treeData, newLine, noAddCallback) => {
  emits('addLineClick', treeField, treeData, newLine, noAddCallback)
}

</script>

<style lang="less" scoped>
.state-bar {
  width: 50%;
  height: 7px;
  padding-right: 10px;
  padding-left: 10px;
  background-color: #fff;
}

.state-bar :deep(.el-step__title) {
  font-size: 12px;
}

.btn-group {
  margin-left: 10px;
}

.group-container {
  display: flex;
  justify-content: space-around;
}

.el-tab-pane {
  width: 100%;

  .el-form-item__content {
    width: 100%;
  }

  .el-form {
    width: 100%;
  }
}
</style>