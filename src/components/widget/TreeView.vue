<template>
  <el-tabs v-model="active">
    <template v-if="!!Object.keys(datas||{}).length" v-for="treeField in Object.keys(params||{})" :key="treeField">
      <el-tab-pane v-if="!formOptions[treeField]?.invisible" :label="params[treeField]?.title" :name="treeField">
        <el-table class="table-item" :data="datas[treeField]?.slice(params[treeField]?.offset,    // 分页
          params[treeField]?.offset + params[treeField]?.limit)"
          show-summary
          table-layout="auto"
          :summary-method="getSummaries(treeField)"
          sum-text="总计"
          stripe>
          <template v-for="field in params[treeField].fields"
                    :key="field">
            <template v-if="noLoadFields.indexOf(field) === -1 && !options[treeField][field]?.invisible">
              <el-table-column
                  :width="options[treeField][field]?.width || 150">
                <template #header>
                  <span v-if="options[treeField][field]?.required" style="color: red;">*</span>
                  {{ options[treeField][field]?.string }}              {{options[treeField][field]?.width }}

                </template>
                <template #default="scoped">
                  <el-form-item :prop="['treeData', treeField,scoped.$index, field]" class="table-form-item"
                    :rules="[{
                      required: options[treeField][field]?.required,
                      message: options[treeField][field]?.string + '不能为空!',
                      trigger: 'blur',
                    }]">
                    <template v-if="is2One(options[treeField][field]?.type)">
                      <el-select
                        v-model="scoped.row[field]"
                        placeholder="请选择"
                        filterable
                        clearable
                        remote
                        @change="fieldOnchange({
                          field: field,
                          datas: scoped.row,
                          attributes: attributes[treeField]?.fields,
                          model: params[treeField]?.model,
                          options: options[treeField],
                          form:{
                            field: treeField,
                            attributes: attributes,
                            datas: formData,
                            model: model,
                            options: formOptions
                          }
                      })"
                        :loading="loading"
                        reserve-keyword
                        :remote-method="searchSelection(options[treeField][field])"
                        :disabled="parseDomain(formOptions[treeField]?.readonly,
                          {...formData, [treeField]: scoped.row}) ||
                          parseDomain(options[treeField][field]?.readonly,
                          {...formData, [treeField]: scoped.row})  || disabled"
                    >
                        <el-option
                          v-for="item in options[treeField][field]?.selection"
                          :key="item[0]"
                          :label="item[1]"
                          :value="item[0]"/>
                      </el-select>
                    </template>
                    <template v-else-if="isSelection(options[treeField][field]?.type)">
                      <el-select
                        v-model="scoped.row[field]"
                        placeholder="请选择"
                        clearable
                        @change="fieldOnchange({
                          field: field,
                          datas: scoped.row,
                          attributes: attributes[treeField]?.fields,
                          model: params[treeField]?.model,
                          options: options[treeField],
                          form:{
                            attributes: attributes,
                            field: treeField,
                            datas: formData,
                            model: model,
                            options: formOptions
                          }
                        })"
                        filterable
                        :disabled="parseDomain(formOptions[treeField]?.readonly,
                          {...formData, [treeField]: scoped.row}) ||
                          parseDomain(options[treeField][field]?.readonly ,
                          {...formData, [treeField]: scoped.row})  || disabled"
                        >
                        <el-option
                          v-for="item in options[treeField][field]?.selection"
                          :key="item[0]"
                          :label="item[1]"
                          :value="item[0]"/>
                      </el-select>
                    </template>
                    <template v-else-if="is2Many(options[treeField][field]?.type)">
                      <el-select
                        v-model="scoped.row[field]"
                        placeholder="请选择"
                        multiple
                        filterable
                        clearable
                        remote
                        reserve-keyword
                        :disabled="parseDomain(formOptions[treeField]?.readonly,
                          {...formData, [treeField]: scoped.row}) ||
                          parseDomain(options[treeField][field]?.readonly,
                          {...formData, [treeField]: scoped.row}) || disabled"
                        @change="fieldOnchange({
                        field: field,
                        attributes: attributes[treeField]?.fields,
                        datas: scoped.row,
                        model: params[treeField]?.model,
                        options: options[treeField],
                        form:{
                          attributes: attributes,
                          field: treeField,
                          datas: formData,
                          model: model,
                          options: formOptions
                          }
                        })"
                        :loading="loading"
                        :remote-method="searchSelection(options[treeField][field])"
                        collapse-tags
                        collapse-tags-tooltip
                      >
                        <el-option
                            v-for="item in options[treeField][field]?.selection"
                            :key="item[0]"
                            :label="item[1]"
                            :value="item[0]"
                        ></el-option>
                      </el-select>
                    </template>
                    <template v-else-if="options[treeField][field]?.type==='checkbox'">
                      <div class="form-input alien-left">
                        <input type="checkbox" v-model="scoped.row[field]"
                          @change="fieldOnchange({
                            field: field,
                            attributes: attributes[treeField]?.fields,
                            datas: scoped.row,
                            model: params[treeField]?.model,
                            options: options[treeField],
                            form:{
                              field: treeField,
                              attributes: attributes,
                              datas: formData,
                              model: model,
                              options: formOptions
                            }
                          })"
                          :disabled="parseDomain(formOptions[treeField]?.readonly,
                            {...formData, [treeField]: scoped.row}) ||
                            parseDomain(options[treeField][field]?.readonly ,
                            {...formData, [treeField]: scoped.row}) || disabled">
                      </div>
                    </template>
                    <template v-else-if="fieldTypeMap[options[treeField][field]?.type] === 'number'">
                      <el-input-number v-model="scoped.row[field]"
                        controls-position="right"
                        :style="{width: options[treeField][field]?.width || 130+ 'px'}"
                        :min="options[treeField][field]?.min"
                        :max="options[treeField][field]?.max"
                        :precision="options[treeField][field]?.precision ||
                        options[treeField][field]?.digits&&
                        options[treeField][field]?.digits?.length&&options[treeField][field]?.digits[1]"
                        @change="fieldOnchange({
                          field: field,
                          datas: scoped.row,
                          attributes: attributes[treeField]?.fields,
                          model: params[treeField]?.model,
                          options: options[treeField],
                          form:{
                            field: treeField,
                            datas: formData,
                            attributes: attributes,
                            model: model,
                            options: formOptions
                          }
                      })"
                       :disabled="parseDomain(formOptions[treeField]?.readonly,
                       {...formData, [treeField]: scoped.row}) ||
                        parseDomain(options[treeField][field]?.readonly , {...formData, [treeField]: scoped.row}) || disabled"/>
                    </template>
                    <template v-else-if="isFile(options[treeField][field]?.type)">
                      <div class="file-content form-input">
                        <el-upload
                          ref="upload"
                          class="upload-file-tree"
                          :data-index="treeField+'_' + scoped.$index+'_' + field"
                          action="#"
                          :limit="1"
                          :file-list="scoped.row[options[treeField][field]?.filename]?[{name: scoped.row[options[treeField][field]?.filename]}]:[]"
                          :list-type="options[treeField][field]?.list_type?.split(',')"
                          :on-change="handleFileChange(scoped.$index, treeField, field)"
                          :on-remove="handleFileRemove(scoped.$index, treeField, field)"
                          :on-exceed="handleExceed(treeField, scoped.$index, field)"
                          :auto-upload="false"
                          :on-preview="downLoadFile(scoped.row[field], scoped.row[options[treeField][field]?.filename])"
                          :disabled="parseDomain(options[treeField][field]?.readonly , {...formData, [treeField]: scoped.row}) || disabled"
                        >
                          <template #trigger>
                            <el-icon class="edit-upload-file" v-if="!(parseDomain(options[treeField][field]?.readonly , {...formData, [treeField]: scoped.row}) || disabled)">
                              <Edit/>
                            </el-icon>
                          </template>
                        </el-upload>
                      </div>
                    </template>
                    <template v-else>
                      <el-input v-model="scoped.row[field]" :type="fieldTypeMap[options[treeField][field]?.type]"
                        :maxlength="options[treeField][field]?.maxlength"
                        clearable
                        @change="fieldOnchange({
                          field: field,
                          datas: scoped.row,
                          attributes: attributes[treeField]?.fields,
                          model: params[treeField]?.model,
                          options: options[treeField],
                          form:{
                            attributes: attributes,
                            field: treeField,
                            datas: formData,
                            model: model,
                            options: formOptions
                          }
                        })"
                        :disabled="parseDomain(formOptions[treeField]?.readonly,
                          {...formData, [treeField]: scoped.row}) ||
                          parseDomain(options[treeField][field]?.readonly ,
                          {...formData, [treeField]: scoped.row})|| disabled"/>
                    </template>
                  </el-form-item>
                </template>
              </el-table-column>
            </template>
          </template>
          <template v-if="!(parseDomain(formOptions[treeField]?.readonly, {...formData}) || disabled)" v-for="(button, index) in attributes[treeField]?.buttons|| []" :key="index">
            <el-table-column :width="button.width || 130" fixed="right" :label="button.text" v-if="!button.invisible">
              <template #default="scoped">
                <el-button :type="button.classify || 'primary'"
                           @click="handleButtonClick(treeField, scoped.row, button)"
                >{{ button.text }}
                </el-button>
              </template>
            </el-table-column>
          </template>
          <el-table-column  fixed="right" label="操作" v-if="!attributes[treeField]?.undel
          && !(parseDomain(formOptions[treeField]?.readonly, {...formData}) || disabled)"
                           width="120">
            <template #default="scoped">
              <el-button link
                         size="small"
                         type="danger"
                         @click="handleDeleteLine(scoped.$index, treeField,scoped.row)"
              >删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button v-if="!(disabled || parseDomain(formOptions[treeField]?.readonly, {...formData})) && !attributes[treeField]?.unadd" class="mt-4"
                   style="width: 100%"
                   @click="onAddItem(treeField)"
        >添加一行
        </el-button>
        <el-pagination
            hide-on-single-page
            class="list-pagination"
            v-model:current-page="currentPage"
            :page-size="params[treeField].limit || 10"
            small
            background
            layout="total, prev, pager, next"
            :total="params[treeField].count||0"
            @current-change="handleCurrentChange(treeField)"
        />
      </el-tab-pane>
    </template>
  </el-tabs>
</template>

<script lang="ts" setup>
import {inject, PropType, reactive, ref, watch} from "vue";
import {genFileId, UploadInstance, UploadProps, UploadRawFile} from "element-plus";
import {Edit} from "@element-plus/icons-vue";
import {useTypeStore} from "../../store";
import type {FieldOptionType, ModuleDataType, DataType} from "../../types";
import {onchangeField, searchFieldSelection, downLoadFile, encodeFileToBase64, parseDomain} from "../../tools";

const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const is2One = typeStore.is2One;
const is2Many = typeStore.is2Many;
const isSelection = typeStore.isSelection;
const isFile = typeStore.isFile;
const noLoadFields = inject<string[]>('noloadFields');
const upload = ref<UploadInstance>();
const props = defineProps({
  options: {
    type: Object as PropType<PropFieldOptionType>,
    default: {}
  },
  formOptions: {
    type: Object as PropType<FieldOptionType>,
    default: {}
  },
  params: {
    type: Object as PropType<ModuleDataType>,
    default: {}
  },
  formData: {
    type: Object as PropType<DataType>,
    default: {}
  },
  datas: {
    type: Object as PropType<DataType>,
    default: {}
  },
  attributes: {
    type: Object,
    default: {}
  },
  model: {
    type: String
  },
  activeTable: {
    type: String
  },
  disabled: {
    type: Boolean,
    default: true
  }
})

let active = ref('')
let currentPage = ref<number>(1)
let invisible = reactive<{ [prop: string]: boolean }>({})
let selection: {
  [prop: string]: {
    relation: string,
    selection: [[number, string | number]]
  }
} = reactive({})

watch(props, () => {
  active = props.activeTable;
})

let loading = ref(false)

const searchSelection = (option: FieldOptionType) => (query: string) => {
  loading.value = true;
  searchFieldSelection(option, query, [], option.limit).then(()=> {
    loading.value = false;
  });
}

let emits = defineEmits(['pageChange', 'editClick', 'addLineClick',
  'deleteLineClick', 'lineButtonClick', 'fieldOnchange'])

const getSummaries = (treeField) => (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 0;
    for (const field of props.params[treeField]?.fields) {
      if (noLoadFields.indexOf(field) !== -1 || props.options[treeField][field]?.invisible) {
        continue
      }
      sums[index] = !sums[index] ? 0 : sums[index];
      if (props.options[treeField][field]?.sum) {
        sums[index] += data[field];
      } else {
        sums[index] = ''
      }
      index++;
    }
  }
  return sums
}

const handleDeleteLine = (index, field, row) => {  //  行删除
  const delFiles = upload.value?.filter(r => {
    return r.$attrs['data-index'].indexOf(field + '_' + index) !== -1;
  })
  for (const file of delFiles || []) {
    file.clearFiles();
  }
  emits('deleteLineClick', field, index, row);
}
const onAddItem = (treeField) => {
  emits('addLineClick', treeField);
}
const handleCurrentChange = (treeField) => {
  emits('pageChange', currentPage.value, treeField);
}

const handleButtonClick = (field, row, button) => {
  emits('lineButtonClick', field, row, button);
}

const handleFileRemove = (index, treeField, field) => () => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === treeField + '_' + index + '_' + field;
  })
  props.datas[treeField][index][field] = ''
  props.datas[treeField][index][props.options[treeField][field].filename] = ''
  curFile!.clearFiles()
}
const handleFileChange = (index, treeField, field) => async (files) => {
  const file = files as UploadRawFile;
  props.datas[treeField][index][field] = await encodeFileToBase64(file.raw);
  props.datas[treeField][index][props.options[treeField][field].filename] = file.name;
}
const handleExceed: UploadProps['onExceed'] = (treeField, index, field) => (files) => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === treeField + '_' + index + '_' + field;
  })
  curFile!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  curFile!.handleStart(file);
}
const fieldOnchange = (params) => {
  emits('fieldOnchange', params)
  onchangeField(params)
}

</script>

<style lang="less" scoped>

:deep(.el-upload-list) {
  width: 130px;
  height: 50px;
  top: -43px;
}

.edit-upload-file {
  z-index: 2;
  left: -10px;
}

.table-form-item {
  padding: 0;
  margin: 0;
}

.upload-file-tree {
  height: 30px;
}

.list-pagination {
  margin-top: 20px;
  float: right;
}
.table-item {
  text-align: center;
}
:deep(.el-table__footer) {
  display: inline-block;
}
</style>