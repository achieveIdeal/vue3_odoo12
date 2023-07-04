<template>
  <div :style="{left: params.left|| '2.2%',  position: 'relative','text-align': 'left'}">
    <template v-for="field in params.fields" :key="field">
      <el-form-item
          class="form-item"
          :style="{width: params.width|| (isDialog && '43%' || '47%')}"
          :label="options[field]?.string"
          :prop="['formData', field]"
          :label-width="options[field]?.labelWidth"
          :rules="options[field]?.rules||[{
        required: options[field]?.required,
        message: options[field]?.string + '不能为空!',
        trigger: 'blur'
        }]"
          v-if="noLoadFields.indexOf(field) === -1 && !parseDomain(options[field]?.invisible, datas)"
      >
        <template v-if="(disabled || parseDomain(options[field]?.readonly,datas)) && !isFile(options[field]?.type)">
          <span class="disabled-form-item" :style="options[field].style" v-if="is2One(options[field]?.type)">
            {{ (options[field]?.selection.find(r => r[0] === datas[field]) || [''])[1] || '　' }}
          </span>
          <span class="disabled-form-item" :style="options[field].style" v-else-if="isSelection(options[field]?.type)">
            {{ (options[field]?.selection.find(r => r[0] === datas[field]) || [''])[1] || '　' }}
          </span>
          <span class="disabled-form-item to-many-disabled" :style="options[field].style"
                v-else-if="is2Many(options[field]?.type)">
            {{ options[field]?.selection.filter(r => datas[field].includes(r[0])).map(r => r[1]).join(', ') }}
          </span>
          <span :style="options[field].style" class="form-input alien-left" v-else-if="isBool(options[field]?.type)">
            <input type="checkbox" disabled v-model="datas[field]">
          </span>
          <span class="disabled-form-item" :style="options[field].style"
                v-else-if="isDigit(options[field]?.type)">
          {{
              (datas[field] || 0).toFixed(options[field]?.precision ||
                  options[field]?.digits?.length && options[field]?.digits[1])
            }}
          </span>
          <span class="disabled-form-item" :style="options[field].style" v-else>{{ datas[field] || '　' }}</span>
        </template>
        <template v-else-if="is2One(options[field]?.type)">
          <el-select class="form-input alien-left"
                     v-model="datas[field]"
                     placeholder="请选择"
                     clearable
                     filterable
                     remote
                     :loading="loading"
                     @change="fieldOnchange({
              field: field,
              datas: datas,
              attributes: attributes,
              treeOptions: treeOptions,
              model: params.model,
              options: options,
              treeData: treeData
            })"
                     :remote-method="searchSelection(options[field])"
                     :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
          >
            <el-option
                v-for="item in options[field]?.selection"
                :key="item[0]"
                :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
                :label="item[1]"
                :value="item[0]"/>
          </el-select>
        </template>
        <template v-else-if="isSelection(options[field]?.type)">
          <el-select class="form-input"
                     v-model="datas[field]"
                     placeholder="请选择"
                     clearable
                     collapse-tags
                     collapse-tags-tooltip
                     filterable
                     @change="fieldOnchange({
              field: field,
              datas: datas,
              attributes: attributes,
              treeOptions: treeOptions,
              model: params.model,
              options: options,
              treeData: treeData
            })"
                     :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
          >
            <el-option
                v-for="item in options[field]?.selection"
                :key="item[0]"
                :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
                :label="item[1]"
                :value="item[0]"/>
          </el-select>
        </template>
        <template v-else-if="is2Many(options[field]?.type)">
          <el-select class="form-input"
                     v-model="datas[field]"
                     placeholder="请选择"
                     multiple
                     collapse-tags
                     :loading="loading"
                     collapse-tags-tooltip
                     clearable
                     filterable
                     remote
                     @change="fieldOnchange({
              field: field,
              attributes: attributes,
              datas: datas,
              treeOptions: treeOptions,
              model: params.model,
              options: options,
              treeData: treeData
            })"
                     :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
                     :remote-method="searchSelection(options[field])"
          >
            <el-checkbox
                class="check-all-box"
                :id="'check-all-box' + field"
                v-model="checkAll"
                @change="handleCheckAllChange(field)"
            />
            <label :for="'check-all-box' + field">全选</label>
            <el-option
                v-for="item in options[field]?.selection"
                :key="item[0]"
                :label="item[1]"
                :value="item[0]"
            ></el-option>
          </el-select>

        </template>
        <template v-else-if="isBool(options[field]?.type)">
          <div class="form-input alien-left">
            <input type="checkbox" v-model="datas[field]"
                   :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
                   @change="fieldOnchange({
                field: field,
                datas: datas,
                attributes: attributes,
                model: params.model,
                treeOptions: treeOptions,
                options: options,
                treeData: treeData
              })">
          </div>
        </template>
        <template v-else-if="isDigit(options[field]?.type)">
          <span style="display: none;">{{ datas[field] ? datas[field] : datas[field] = 0 }}</span>
          <el-input-number v-model="datas[field]"
                           class="form-input"
                           :precision="options[field]?.precision || options[field]?.digits?.length&&options[field]?.digits[1]"
                           controls-position="right"
                           :min="options[field]?.min"
                           :max="options[field]?.max"
                           @blur="fieldOnchange({
              field: field,
              datas: datas,
              attributes: attributes,
              model: params.model,
              options: options,
              treeOptions: treeOptions,
              treeData: treeData
            })"
                           :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"/>
        </template>
        <template v-else-if="isFile(options[field]?.type)">
          <div class="file-content form-input">
            <el-upload
                :class="{'upload-file-edit':parseDomain(options[field]?.readonly, datas) || disabled}"
                ref="upload"
                :data-index="field"
                action="#"
                :limit="1"
                :file-list="datas[options[field].filename]?[{name: datas[options[field].filename]}]:[]"
                :list-type="options[field]?.list_type?.split(',')"
                :on-change="handleFileChange(field)"
                :on-remove="handleFileRemove(field)"
                :on-exceed="handleExceed(field)"
                :auto-upload="false"
                :on-preview="downLoadFile(datas[field], datas[options[field]?.filename])"
                :disabled="parseDomain(options[field]?.readonly, datas)  || disabled"
            >
              <template #trigger>
                <el-button v-if="!(parseDomain(options[field]?.readonly, datas) || disabled)" type="primary">选择文件
                </el-button>
              </template>
            </el-upload>
          </div>
        </template>
        <template v-else-if="options[field]">
          <el-input v-model="datas[field]" :type="options[field]?.type || fieldTypeMap[options[field]?.type]"
                    class="form-input"
                    clearable
                    :maxlength="options[field]?.maxlength"
                    @blur="fieldOnchange({
              field: field,
              attributes: attributes,
              datas: datas,
              model: params.model,
              options: options,
              treeOptions: treeOptions,
              treeData: treeData
              })"
                    :disabled="parseDomain(options[field]?.readonly, datas) || disabled"/>
        </template>
      </el-form-item>
    </template>
  </div>

</template>

<script setup lang="ts">
import {inject, PropType, ref, computed, defineEmits} from "vue";
import {genFileId} from 'element-plus'
import type {UploadInstance, UploadProps, UploadRawFile} from 'element-plus'
import {useTypeStore} from "../../store";
import type {DataType, FieldOptionType, ModuleDataType} from "../../types";
import {onchangeField, searchFieldSelection, downLoadFile, encodeFileToBase64, parseDomain} from "../../tools";

const checkAll = ref(false);
const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const is2One = typeStore.is2One;
const is2Many = typeStore.is2Many;
const isBool = typeStore.isBool;
const isDigit = typeStore.isDigit;
const isSelection = typeStore.isSelection;
const isFile = typeStore.isFile;
const noLoadFields = inject<string[]>('noloadFields');
const props = defineProps({
  options: {
    type: Object as PropType<FieldOptionType>,
    default: {}
  },
  treeOptions: {
    type: Object as PropType<FieldOptionType>,
    default: {}
  },
  datas: {
    type: Object as PropType<DataType>,
    default: {}
  },
  params: {
    type: Object as PropType<ModuleDataType>,
    default: {}
  },
  treeData: {
    type: Object as PropType<DataType>,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  },
  isDialog: {
    type: Boolean,
    default: false
  },
  attributes: {
    type: Object,
    default: {}
  }
})
const upload = ref<UploadInstance>();

let zero = 0;

const emits = defineEmits(['fieldOnchange'])

const handleCheckAllChange = (field) => {
  if (checkAll.value) {
    props.datas[field] = props.options[field]?.selection.map(r => r[0]);
  } else {
    props.datas[field] = [];
  }
  onchangeField({
    field: field,
    attributes: props.attributes,
    datas: props.datas,
    model: props.params.model,
    options: props.options,
    treeOptions: props.treeOptions,
    treeData: props.treeData
  }, checkAll)
};

const handleFileRemove = (field) => () => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === field
  })
  props.datas[field] = ''
  props.datas[props.options[field].filename] = ''
  curFile!.clearFiles()
}
const handleFileChange = (field) => async (files) => {
  const file = files as UploadRawFile;
  props.datas[field] = await encodeFileToBase64(file.raw);
  props.datas[props.options[field].filename] = file.name
}
const handleExceed: UploadProps['onExceed'] = (field) => (files) => {
  const curFile = upload.value.find(r => {
    return r.$attrs['data-index'] === field
  })
  curFile!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  curFile!.handleStart(file)
}
let loading = ref(false)

const searchSelection = (option: FieldOptionType) => (query: string) => {
  loading.value = true;
  checkAll.value = false;
  searchFieldSelection(option, query, [], option.limit).then(r => {
    loading.value = false;
  });
}

const fieldOnchange = (params) => {
  emits('fieldOnchange', params);
  onchangeField(params, checkAll)
}

defineExpose({
  upload
})
</script>

<style lang="less">
.form-item .el-form-item__label {
  font-weight: 700;
}

.form-input {
  width: 100%;
}

.alien-left {
  text-align: left;
}

.upload-file-edit {
  height: 30px;
}

.upload-file-edit .el-upload-list {
  top: -41px;
}

.check-all-box {
  vertical-align: sub;
  margin-left: 20px;
}

.to-many-disabled {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-word;
}

.to-many-disabled:hover {
  overflow: visible;
  white-space: normal;
}

.disabled-form-item {
  width: 100%;
  border-bottom: 1px solid #eef1fa;
}

</style>