<template>
  <el-form-item v-if="children.tag==='field'"
                :style="{width: !Object.keys(treeViewFields).includes(children.attrs?.name)?'30%':'100%'}"
                :prop="children.attrs?.name"
                :label="viewType==='form' && !Object.keys(treeViewFields).includes(children.attrs?.name)? viewFields[children.attrs?.name]?.string:''">
    <component :is="FIELD_VIEW_MAP[viewFields[children.attrs?.name]?.type]"
               v-if="!(parseDomain(children.attrs?.invisible, data) ||  viewFields[children.attrs?.name]?.invisible)"
               :data="data"
               :model="model"
               :attrs="children.attrs"
               :viewType="viewType"
               :treeData="treeData"
               :treeViewFields="treeViewFields"
               :viewFields="viewFields"
               :field="children.attrs?.name"
               :option="viewFields[children.attrs?.name]"
               :readonly="parseDomain(children.attrs.readonly, data) || viewFields[children.attrs?.name]?.readonly"
               :disabled="disabled"
               :loading="loading"
    >
      <template v-if="((children.children || []))?.length" v-for="subChildren in (children.children || [])">
        <RenderField
            :children="subChildren"
            :parent="children"
            :viewType="viewType"
            :treeViewFields="treeViewFields"
            :activeTab="activeTab"
            :data="data"
            :model="model"
            :treeData="treeData"
            :field="subChildren.attrs?.name"
            :option="viewFields[subChildren.attrs?.name]"
            :readonly="parseDomain(subChildren.attrs?.readonly, data)"
            :disabled="disabled"
            :viewFields="viewFields"
            @getLineDetailClick="getLineDetailClick"
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
          :activeTab="activeTab"
          :treeViewFields="treeViewFields"
          :data="data"
          :model="model"
          :treeData="treeData"
          :viewType="viewType"
          :field="subChildren.attrs?.name"
          :option="viewFields[subChildren.attrs?.name]"
          :readonly="parseDomain(subChildren.attrs?.readonly, data)"
          :disabled="disabled"
          :viewFields="viewFields"
      />
    </template>
  </component>
  <component v-else-if="children.tag==='tree'" :is="TableView"
             :fromData="data"
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
  >
    <template v-if="(children.children || [])?.length" v-for="subChildren in (children.children || [])">
      <RenderField
          :children="subChildren"
          :parent="children"
          :treeViewFields="treeViewFields"
          :activeTab="activeTab"
          :data="data"
          :model="model"
          :treeData="treeData"
          :viewType="viewType"
          :field="subChildren.attrs?.name"
          :option="viewFields[subChildren.attrs?.name]"
          :readonly="parseDomain(subChildren.attrs?.readonly, data)"
          :disabled="disabled"
          :viewFields="viewFields"
      />
    </template>
  </component>
  <component v-else :is="createComponent(children, parent)">
    <template v-if="!parseDomain(children.attrs?.invisible, data)">
      <div v-if="(children.children || []).filter(r=>r.tag==='button')?.length">
        <template v-for="subChildren in (children.children || []).filter(r=>r.tag==='button')">
          <el-button :class="['btn-group',children.class]"
                     v-if="!subChildren.attrs?.states || (subChildren.attrs?.states||'')?.split(',').includes(data.state) && !parseDomain(subChildren.attrs.invisible, data)"
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
            :activeTab="activeTab"
            :model="model"
            :data="data"
            :treeData="treeData"
            :treeViewFields="treeViewFields"
            :viewType="viewType"
            :field="subChildren.attrs?.name"
            :option="viewFields[subChildren.attrs?.name]"
            :readonly="parseDomain(subChildren.attrs?.readonly, data)"
            :disabled="disabled"
            :viewFields="viewFields"
            @getLineDetailClick="getLineDetailClick"
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
import {parseDomain} from "../../tools";
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
    setup(props, {slots, emit}) {
      let tag = arch.tag;
      const newProps = {...props}
      if (tag === 'sheet' || (arch.children || [])[0]?.tag === 'group') {
        newProps.style = {
          ...newProps.style,
          textAlign: 'left',
        };
      }
      if (tag === 'group' && parent.children?.length) {
        newProps.style = {
          ...newProps.style,
          flexDirection: 'column',
          padding: '10px',
        };
      }
      if (tag === 'header') {
        newProps.style = {
          ...newProps.style,
          display: 'flex',
          borderBottom: '1px solid #ced4da',
          alignItems: 'center',
          justifyContent: 'space-between'
        };
      }
      if (['group', 'header', 'form'].includes(tag)) {
        tag = 'div'
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
        return () => createVNode(
            ElTabPane,
            {...newProps, label: arch.attrs.string, name: arch.children[0].attrs.name},
            () => slots.default && slots.default()
        );
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

const emits = defineEmits(['handleButtonClick', 'getLineDetailClick'])
const handleButtonClick = (e, button) => {
  e.stopPropagation();
  emits('handleButtonClick', button)
}

const getLineDetailClick = (data, index, formViewInfo) => {
  emits('getLineDetailClick', data, index, formViewInfo)
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