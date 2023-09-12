<template>

  <el-form-item
      v-if="!(parseDomain(viewFields[children.attrs?.name]?.invisible
      || children.attrs?.invisible, data)
      ||children.attrs?.invisible) && children.tag==='field'"
      :style="{width: !Object.keys(treeViewFields).includes(children.attrs?.name)?'30%':'100%'}"
      :prop="viewType==='form'?['formData',children.attrs?.name]:viewType==='tree'?['treeData',treeField,index, children.attrs.name]:[index,children.attrs.name]"
      :label="viewType==='form' && !Object.keys(treeViewFields).includes(children.attrs?.name)? viewFields[children.attrs?.name]?.string:''"
      :rules="viewFields[children.attrs.name]?.rules||[{
        required: parseDomain(viewFields[children.attrs.name]?.required, data),
        message: viewFields[children.attrs.name]?.string + '不能为空!',
        trigger: 'blur'
        }]">
    <component :is="FIELD_VIEW_MAP[viewFields[children.attrs?.name]?.type]"
               :data="data"
               :model="model"
               :attrs="children.attrs"
               :viewType="viewType"
               :treeData="treeData"
               :treeViewFields="treeViewFields"
               :viewFields="viewFields"
               :field="children.attrs?.name"
               :option="viewFields[children.attrs?.name]"
               :readonly="!!parseDomain(viewFields[children.attrs?.name]?.readonly||children.attrs.readonly, data)"
               :disabled="disabled"
               :loading="loading"
    >
      <template v-if="((children.children || []))?.length" v-for="subChildren in (children.children || [])">
        <RenderField
            :children="subChildren"
            :parent="children"
            :extras="extras"
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
        />
      </template>
    </component>
  </el-form-item>
  <component v-else-if="children.tag==='form'" :is="FormView"
             :data="data"
             :treeData="treeData"
             viewType="form"
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
          :extras="extras"
          :activeTab="activeTab"
          :treeViewFields="treeViewFields"
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
      />
    </template>
  </component>
  <component v-else-if="children.tag==='tree'" :is="TableView"
             :formData="data"
             :attributes="extras?.attributes?extras?.attributes[children.field]:{}"
             :fields="fields[children.field]"
             :treeField="children.field"
             :model="viewFields[children.field].relation"
             :option="viewFields[children.field]"
             :readonly="parseDomain(children.attrs.readonly, data)"
             :disabled="disabled"
             :loading="loading"
             :treeData="treeData"
             :arch="children"
             :action="{res_model:viewFields[children.field].relation, limit:1000,domain:['|',['id', 'in', data[children.field] ||[]],
              [viewFields[children.field].relation_field, '=', data['id']]]}"
             :viewFields="viewFields[children.field]?.views?.tree?.fields"
             :formViewInfo="{
                arch:children.formViewInfo.arch,
                base_model: viewFields[children.field].relation,
                viewFields:children.formViewInfo?.fields
             }"
             @getDetailClick="getLineDetailClick"
             @deleteLineClick="deleteLineClick"
             @addLineClick="addLineClick"
  >
    <template v-if="(children.children || [])?.length" v-for="subChildren in (children.children || [])">
      <RenderField
          :children="subChildren"
          :parent="children"
          :extras="extras"
          :treeViewFields="treeViewFields"
          :activeTab="activeTab"
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
      />
    </template>
  </component>
  <component v-else-if="!(['field', 'form', 'tree'].includes(children.tag))" :is="createComponent(children, parent)">
    <template v-if="!parseDomain(children.attrs?.invisible, data)">
      <div v-if="(children.children || []).filter(r=>r.tag==='button')?.length">
        <template v-for="subChildren in (children.children || []).filter(r=>r.tag==='button')">
          <el-button :class="['btn-group',children.class]"
                     v-if="(!subChildren.attrs?.states
                     || (subChildren.attrs?.states||'')?.split(',').includes(data.state)
                      && !parseDomain(subChildren.attrs.invisible, data))&&disabled"
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
        <RenderField
            v-else
            :children="subChildren"
            :parent="children"
            :extras="extras"
            :activeTab="activeTab"
            :model="model"
            :data="data"
            :index="index"
            :treeField="treeField"
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
        />
      </template>
    </template>
  </component>
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
const tabsModel = ref("订单行")

const props = defineProps({
  children: {
    type: Object,
    default: {}
  }, viewType: {
    type: String,
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
  }, index: {
    type: Number,
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
        if (!(parseDomain(props.viewFields[arch.children[0].attrs.name].invisible, props.data)
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

const emits = defineEmits(['handleButtonClick', 'getLineDetailClick', 'deleteLineClick', 'addLineClick'])
const handleButtonClick = (e, button) => {
  e.stopPropagation();
  emits('handleButtonClick', button)
}

const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
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