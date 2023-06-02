<template>
  <template v-for="field in params.fields" :key="field">
    <el-form-item
        class="form-item"
        :label="options[field]?.string"
        :prop="['formData', field]"
        :rules="[{
          required: options[field]?.required,
          message: options[field]?.string + '不能为空!',
          trigger: 'blur'
          }]"
        v-if="noLoadFields.indexOf(field) === -1 && !options[field]?.invisible"
    >
      <template v-if="is2One(options[field]?.type)">
        <el-select class="form-input alien-left"
                   v-model="datas[field]"
                   placeholder="请选择"
                   clearable
                   filterable
                   remote
                   :loading="loading"
                   @change="onchangeField({
                      field: field,
                      datas: datas,
                      model: params.model,
                      options: options,
                      treeDatas: treeDatas
                  })"
                   :remote-method="searchSelection(options[field])"
                   :disabled="options[field]?.readonly || disabled"
        >
          <el-option
              v-for="(item,index) in options[field]?.selection"
              :key="item[0]"
              :disabled="options[field]?.readonly || disabled"
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
                   @change="onchangeField({
                  field: field,
                  datas: datas,
                  model: params.model,
                  options: options,
                  treeDatas: treeDatas
                })"
                   :disabled="options[field]?.readonly || disabled"
        >
          <el-option
              v-for="item in options[field]?.selection"
              :key="item[0]"
              :disabled="options[field]?.readonly || disabled"
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
                   collapse-tags-tooltip
                   clearable
                   filterable
                   remote
                   @change="onchangeField({
                field: field,
                datas: datas,
                model: params.model,
                options: options,
                treeDatas: treeDatas
              })" :disabled="options[field]?.readonly || disabled"
                   :remote-method="searchSelection(options[field])"
        >
          <el-option
              v-for="item in options[field]?.selection"
              :key="item[0]"
              :label="item[1]"
              :value="item[0]"
          ></el-option>
        </el-select>

      </template>

      <template v-else-if="fieldTypeMap[options[field]?.type]==='checkbox'">
        <div class="form-input alien-left">
          <input type="checkbox" v-model="datas[field]" :disabled="options[field]?.readonly || disabled">
        </div>
      </template>
      <template v-else-if="fieldTypeMap[options[field]?.type] === 'number'">
        <span style="display: none;">{{ datas[field] ? datas[field] : datas[field] = 0 }}</span>
        <el-input-number v-model="datas[field]"
                         class="form-input"
                         :precision="options[field]?.precision || options[field]?.digits?.length&&options[field]?.digits[1]"
                         controls-position="right"
                         :min="options[field]?.min"
                         :max="options[field]?.max"
                         @blur="onchangeField({
              field: field,
              datas: datas,
              model: params.model,
              options: options,
              treeDatas: treeDatas
            })"
                         :disabled="options[field]?.readonly || disabled"/>
      </template>
      <template v-else-if="isFile(options[field]?.type)">
        <div class="file-content form-input">
          <el-upload
              :class="{'upload-file-edit': options[field]?.readonly || disabled}"
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
              :disabled="options[field]?.readonly || disabled"
          >
            <template #trigger>
              <el-button v-if="!(options[field]?.readonly || disabled)" type="primary">选择文件</el-button>
            </template>
          </el-upload>
        </div>
      </template>
      <template v-else-if="options[field]">
        <el-input v-model="datas[field]" :type="fieldTypeMap[options[field]?.type]" class="form-input"
                  :maxlength="options[field]?.maxlength"
                  @blur="onchangeField({
              field: field,
              datas: datas,
              model: params.model,
              options: options,
              treeDatas: treeDatas
            })"
                  :disabled="options[field]?.readonly || disabled"/>
      </template>
    </el-form-item>
  </template>
  <el-form-item
      class="form-item"></el-form-item>
</template>

<script setup lang="ts">
import {inject, PropType, ref} from "vue";
import {genFileId} from 'element-plus'
import type {UploadInstance, UploadProps, UploadRawFile} from 'element-plus'
import {useTypeStore} from "../../store";
import type {DataType, FieldOptionType, ModuleDataType} from "../../types";
import {onchangeField, searchFieldSelection, downLoadFile, encodeFileToBase64} from "../../tools";

const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const is2One = typeStore.is2One;
const is2Many = typeStore.is2Many;
const isSelection = typeStore.isSelection;
const isFile = typeStore.isFile;
const noLoadFields = inject<string[]>('noloadFields');
const props = defineProps({
  options: {
    type: Object as PropType<FieldOptionType>
  },
  datas: {
    type: Object as PropType<DataType>

  },
  params: {
    type: Object as PropType<ModuleDataType>
  },
  treeDatas: {
    type: Object as PropType<DataType>,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: true
  }
})
const upload = ref<UploadInstance>();

let zero = 0

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
  loading.value = true
  searchFieldSelection(option, query).then(r => {
    loading.value = false;
  });
}


defineExpose({
  upload
})
</script>

<style lang="less">
.form-input {
  width: 400px;
}

.form-item {
  width: 600px;
  padding: 0;
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
</style>