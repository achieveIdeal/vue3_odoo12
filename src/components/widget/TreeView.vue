<template>
  <el-tabs v-model="active">
    <template v-for="treeField in Object.keys(params||{})" :key="treeField">
      <el-tab-pane v-if="!parseDomain(formOptions[treeField]?.invisible, formData)" :label="params[treeField]?.title"
                   :name="treeField">
        <div class="tree-btn-group" v-if="!disabled&&attributes[treeField]?.importTemplate">
          <el-upload v-model:file-list="fileList" class="import-excel"
                     :before-upload="before(treeField)"
                     :limit="1" accept="xlsx,xls">
            <el-button ref="importButtonRef" type="success">导入</el-button>
          </el-upload>
          <el-button style="margin-right: 2px;" @click="importClick(importButtonRef)" type="success">导入</el-button>
          <el-button v-if="!disabled"
                     class="el-button--cancel"
                     @click.prevent="handleDownTemplate(attributes[treeField].importTemplate)">
            下载模板
          </el-button>
        </div>
        <el-table class="table-item" :data="datas[treeField]?.slice(params[treeField]?.offset,    // 分页
          params[treeField]?.offset + params[treeField]?.limit)"
                  show-summary
                  fit
                  :summary-method="getSummaries(treeField)"
                  sum-text="总计"
                  :row-style="handleTreeRowStyle(treeField)"
                  stripe>
          <template v-for="field in params[treeField].fields"
                    :key="field">
            <template
                v-if="noLoadFields.indexOf(field) === -1 && !parseDomain(options[treeField][field]?.invisible, formData)">
              <el-table-column
                  :show-overflow-tooltip="options[treeField][field]?.showOverflowTooltip"
                  :width="options[treeField][field]?.width">
                <template #header>
                  <span v-if="options[treeField][field]?.required" style="color: red;">*</span>
                  {{ options[treeField][field]?.string }}
                </template>
                <template #default="scoped">
                  <el-form-item :prop="['treeData', treeField,scoped.$index, field]" class="table-form-item"
                                :rules="options[treeField][field]?.rules||[{
                      required: options[treeField][field]?.required,
                      message: options[treeField][field]?.string + '不能为空!',
                      trigger: 'blur',
                    }]">
                    <template v-if="(disabled || parseDomain(formOptions[treeField]?.readonly,
                          {...formData, [treeField]: scoped.row})|| attributes[treeField]?.fields?.readonly==='_all_'||
                          parseDomain(options[treeField][field]?.readonly,
                          {...formData, [treeField]: scoped.row})) && !isFile(options[treeField][field]?.type)">
                      <span :style="options[treeField][field].style"
                            v-if="is2One(options[treeField][field]?.type)"> {{
                          (options[treeField][field]?.selection.find(r => r[0] === scoped.row[field]) || [''])[1]
                        }}</span>
                      <span :style="options[treeField][field].style"
                            v-else-if="isSelection(options[treeField][field]?.type)">{{
                          (options[treeField][field]?.selection.find(r => r[0] === scoped.row[field]) || [''])[1]
                        }}</span>
                      <span :style="options[treeField][field].style"
                            v-else-if="is2Many(options[treeField][field]?.type)">{{
                          options[treeField][field]?.selection.filter(r => scoped.row[field].includes(r[0])).map(r => r[1]).join(', ')
                        }}</span>
                      <span :style="options[treeField][field].style" class="form-input alien-left"
                            v-else-if="isBool(options[treeField][field]?.type)">
                        <input type="checkbox" disabled v-model="scoped.row[field]">
                      </span>
                      <span :style="options[treeField][field].style"
                            v-else-if="isDigit(options[treeField][field]?.type)">
                         {{
                          (scoped.row[field] || 0).toFixed(options[treeField][field]?.precision ||
                              options[treeField][field]?.digits?.length && options[treeField][field]?.digits[1])
                        }}
                      </span>
                      <span :style="options[treeField][field].style" v-else>{{ scoped.row[field] }}</span>
                    </template>
                    <template v-else-if="is2One(options[treeField][field]?.type)">
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
                      >
                        <el-option
                            v-for="item in options[treeField][field]?.selection"
                            :key="item[0]"
                            :label="item[1] || ''"
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
                      >
                        <el-option
                            v-for="item in options[treeField][field]?.selection"
                            :key="item[0]"
                            :label="item[1] || ''"
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
                            :label="item[1] || ''"
                            :value="item[0]"
                        ></el-option>
                      </el-select>
                    </template>
                    <template v-else-if="isBool(options[treeField][field]?.type)">
                      <div class="form-inut alien-left">
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
                          })">
                      </div>
                    </template>
                    <template v-else-if="isDigit(options[treeField][field]?.type)">
                      <el-input-number v-model="scoped.row[field]"
                                       controls-position="right"
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
                      })"/>
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
                        >
                          <template #trigger>
                            <el-icon class="edit-upload-file"
                                     v-if="!(parseDomain(options[treeField][field]?.readonly , {...formData, [treeField]: scoped.row}) || disabled)">
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
                        })"/>
                    </template>
                  </el-form-item>
                </template>
              </el-table-column>
            </template>
          </template>
          <template v-if="!(parseDomain(formOptions[treeField]?.readonly, {...formData}) || disabled)"
                    v-for="(button, index) in attributes[treeField]?.buttons|| []" :key="index">
            <el-table-column :width="button.width|| 130" fixed="right" :label="button.text">
              <template #default="scoped">
                <el-button :type="button.classify || 'primary'"
                           v-if="parseDomain(!button.invisible,{...formData, [treeField]: scoped.row})"
                           @click="handleButtonClick(treeField, scoped.row, button)"
                >{{ button.text }}
                </el-button>
              </template>
            </el-table-column>
          </template>
          <el-table-column fixed="right" label="操作"
                           v-if="!(parseDomain(formOptions[treeField]?.readonly, {...formData}) || disabled)"
                           width="120">

            <template #default="scoped">
              <el-button link
                         v-if="!parseDomain(attributes[treeField]?.undel,{...formData, [treeField]: scoped.row})"
                         size="small"
                         type="danger"
                         @click="handleDeleteLine(scoped.$index, treeField,scoped.row)"
              >删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button
            v-if="!(disabled || parseDomain(formOptions[treeField]?.readonly, {...formData})) && !attributes[treeField]?.unadd"
            class="mt-4"
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
            :total="datas[treeField]?.length || 0"
            @current-change="handleCurrentChange(treeField)"
        />
        <div v-if="params[treeField]?.totalFields">

        </div>
      </el-tab-pane>
    </template>
  </el-tabs>
</template>

<script lang="ts" setup>
import {inject, onMounted, PropType, reactive, ref} from "vue";
import {ElMessage, genFileId, UploadInstance, UploadProps, UploadRawFile, UploadUserFile} from "element-plus";
import {Edit} from "@element-plus/icons-vue";
import {useTypeStore} from "../../store";
import type {FieldOptionType, ModuleDataType, DataType} from "../../types";
import {onchangeField, searchFieldSelection, downLoadFile, encodeFileToBase64, parseDomain,dateFtt} from "../../tools";
import {read, utils} from 'xlsx';
import {callNames} from "../../service/module/call";

const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const is2One = typeStore.is2One;
const is2Many = typeStore.is2Many;
const isSelection = typeStore.isSelection;
const isDigit = typeStore.isDigit;
const isBool = typeStore.isBool;
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
let importButtonRef = ref('')
let currentPage = ref<number>(1)
let invisible = reactive<{ [prop: string]: boolean }>({})
let selection: {
  [prop: string]: {
    relation: string,
    selection: [[number, string | number]]
  }
} = reactive({})

onMounted(() => {
  active = props.activeTable;
})

let loading = ref(false)

const handleDownTemplate = (template) => {
  if (template) {
    location.href = template
  } else {
    ElMessage({
      message: '请指定模板资源路径!',
      type: 'error'
    })

  }
}


const fileList = ref<UploadUserFile[]>([])

const readFile = (file: File) => {
  return new Promise(resolve => {
    let reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = ev => {
      resolve(ev.target?.result);
    }
  });
}

const importClick = (uploadButtonRef) => {
  uploadButtonRef[0].$.vnode.el.click()
}


const readExcelFile = async (treeField, file: File, sheetIndex: number) => {
  let datas = await readFile(file);
  const importFields = props.params[treeField].import_fields;
  let workbook = read(datas, {type: 'binary', cellDates: true});
  let worksheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
  datas = utils.sheet_to_json(worksheet, {header: 1});
  const result = []
  const headerLen = datas[0].length;
  for (const data of datas.slice(1, datas.length)) {
    let hasContent = false;
    for (let i = 0; i < importFields.length; i++) {
      const fieldOption = props.options[treeField][importFields[i]]
      const fieldType = fieldOption.type
      data[i] = data[i] || fieldOption.default
      if (data[i] instanceof Date) {
        data[i] = dateFtt("yyyy-MM-dd", data[i])
        if (fieldType === 'datetime') {
          data[i] = dateFtt("yyyy-MM-dd hh:mm:ss", data[i])
        }
      } else if (isDigit(fieldType)) {
        data[i] = parseFloat(data[i] || 0)
      } else if (isSelection(fieldType)) {
        data[i] = fieldOption.selection.find(r => r[0] === data[i])
      } else if (is2One(fieldType) || is2Many(fieldType)) {
        const res = await callNames({
          model: fieldOption.relation,
          args: [],
          kwargs: {
            'name': data[i],
            'args': [],
            'operator': '=',
            'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true}
          }
        })
        data[i] = res.result;
      }
    }
    data.length && data.length < headerLen ? data.length = headerLen : null;
    for (let index = 0; index < data.length; index++) {
      !!data[index] ? hasContent = true : null;
    }
    hasContent && result.push(data)
  }
  if (!importFields?.length) {
    ElMessage({
      message: '没有指定导入字段！',
      type: 'error'
    })
    return false;
  }
  for (const res of result) {
    const importRes = {}
    for (let i = 0; i < importFields.length; i++) {
      importRes[importFields[i]] = res[i]
    }
    props.params[treeField].count ++;
    props.datas[treeField].push(importRes)
  }
}
const before = (treeField) => (file: any) => {
  readExcelFile(treeField, file, 0)
  return false
}
const searchSelection = (option: FieldOptionType) => (query: string) => {
  loading.value = true;
  searchFieldSelection(option, query, [], option.limit).then(() => {
    loading.value = false;
  });
}

let emits = defineEmits(['pageChange', 'editClick', 'addLineClick', 'deleteLineClick', 'lineButtonClick', 'fieldOnchange'])

const getSummaries = (treeField) => (table) => {
  const sums = [];
  for (const data of table.data) {
    let index = 0;
    for (const field of props.params[treeField]?.fields) {
      if (noLoadFields.indexOf(field) !== -1 ||
          parseDomain(props.options[treeField][field]?.invisible, {...props.formData, [treeField]: data})) {
        continue
      }
      sums[index] = !sums[index] ? 0 : sums[index];
      if (props.options[treeField][field]?.sum && isDigit(props.options[treeField][field]?.type)) {
        sums[index] = parseFloat((sums[index] || 0) + parseFloat(data[field] || 0).toFixed(props.options[treeField][field]?.precision ||
            props.options[treeField][field]?.digits &&
            props.options[treeField][field]?.digits?.length && props.options[treeField][field]?.digits[1] || 0));
      } else {
        sums[index] = ''
      }
      index++;
    }
  }
  sums[0] = props.params[treeField].totalTitle || sums[0] || '总计:'
  return sums
}

const handleTreeRowStyle = (treeField) => (row) => {
  const colorMap = {
    success: '#28a745',
    warning: '#ffc400',
    error: '#dc3545',
    info: '#606266'
  }
  let curColor = 'info'
  let colors = props?.attributes[treeField]?.colors || {}
  for (const color of Object.keys(colors)) {
    if (parseDomain(colors[color], row.row)) {
      curColor = color;
    }
  }
  return {
    color: colorMap[curColor]
  }
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

.tree-btn-group {
  text-align: left;
}

.import-excel {
  display: none;
}

</style>