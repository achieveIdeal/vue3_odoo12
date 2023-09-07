<template>
  <el-form-item class="btn-container">
    <template v-for="button in buttons.buttonOptions" :key="button">
      <template v-if="(button.showType || []).indexOf(params.type) !== -1
     && !parseDomain(button.attributes?.invisible,data) && !button.attributes?.noRowInvisible">
        <template v-if="button.type==='edit'">
          <template v-if="disabled">
            <el-button class="el-button--primary" @click.prevent="handleEdit">
              {{ button.text || '编辑' }}
            </el-button>
          </template>
          <template v-if="!disabled && params.id">
            <el-button class="el-button--primary" @click.prevent="handleSave">
              {{ button.confirmText || '保存' }}
            </el-button>
            <el-button class="info" @click.prevent="()=>handleCancel(params.id)">
              {{ button.cancelText || '取消' }}
            </el-button>
          </template>
        </template>
        <template v-else-if="button.type==='create'">
          <el-button
              v-if="disabled"
              class="el-button--primary" @click.prevent="handleCreate">
            {{ button.text || '创建' }}
          </el-button>
          <template v-if="!disabled && !params.id">
            <el-button class="el-button--primary" @click.prevent="handleSave">
              {{ button.confirmText || '保存' }}
            </el-button>
            <el-button class="info" @click.prevent="()=>handleCancel(params.id)">
              {{ button.cancelText || '取消' }}
            </el-button>
          </template>
        </template>
        <template v-else-if="(disabled || button.show)&&button.type==='import'">
          <el-upload v-model:file-list="fileList" class="import-excel" :before-upload="before"
                     :limit="1" accept="xlsx,xls">
            <el-button type="success">导入</el-button>
          </el-upload>
          <el-button v-if="disabled"
                     class="el-button--cancel" @click.prevent="handleDownTemplate(button.template)">
            下载模板
          </el-button>
        </template>
        <template v-else-if="(disabled || button.show)&&button.type==='object'">
          <el-button :type="button.classify||'primary'" :name="button.method"
                     @click.prevent="handleObject(button.method)">
            {{ button.text }}
          </el-button>
        </template>
        <template v-else-if="( disabled || button.show)&&button.type==='custom'">
          <el-button :type="button.classify" @click.prevent="handleCustom(button)">
            {{ button.text }}
          </el-button>
        </template>
        <template v-else-if="(disabled || button.show)&&button.type==='export'">
          <el-button :type="button.classify" @click.prevent="handleExport">
            {{ button.text || '导出' }}
          </el-button>
        </template>
        <template v-else-if="(disabled || button.show)&&button.type==='any'">
          <el-button :type="button.classify" @click.prevent="handleAny(button)">
            {{ button.text }}
          </el-button>
        </template>
      </template>
    </template>
  </el-form-item>
</template>

<script lang="ts" setup>
import {useRouter} from "vue-router";
import {read, utils} from 'xlsx';
import {parseDomain} from "../../tools";


import {ref} from "vue";
import {ElMessage, UploadUserFile} from "element-plus";

const router = useRouter();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: true
  },
  params: {
    type: Object,
    default: {}
  },
  buttons: {
    type: Object,
    default: {}
  },
  data: {
    type: Object,
    default: {}
  }
})

const emits = defineEmits(['editClick', 'saveClick', 'cancelClick', 'exportClick',
  'createClick', 'objectClick', 'importClick', 'downTmpClick', 'customClick', 'anyClick'
])
const handleCustom = (button) => {
  emits('customClick', button)
}
const handleEdit = () => {
  emits('editClick');
}
const handleSave = function () {
  emits('saveClick');
}

const handleExport = () => {
  emits("exportClick")
}
const handleCancel = function (real_id) {
  if (!props.params.id) {
    router.back()
  }
  emits('cancelClick', real_id);
}
const handleObject = function (name) {
  emits('objectClick', name);
}
const handleCreate = function () {
  router.push({
    path: props.params.name,
    query: {
      type: 'form',
      id: 0
    }
  })
  emits('createClick');
}

const handleAny = (button) => {
  emits('anyClick', button)
}
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
/**
 * 把文件按照二进制进行读取
 * @param file
 * @returns
 */
const readFile = (file: File) => {
  return new Promise(resolve => {
    let reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = ev => {
      resolve(ev.target?.result);
    }
  });
}
/**
 * 根据sheet索引读取Excel文件中的数据
 /**@param file 文件
 /** @param sheetIndex excel文件中sheet表索引 默认是从0开始
 /**@returns  将表中的数据以json形式的数据返回
 */
const readExcelFile = async (file: File, sheetIndex: number) => {
  let datas = await readFile(file);
  let workbook = read(datas, {type: 'binary', cellDates: true});
  let worksheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
  datas = utils.sheet_to_json(worksheet, {header: 1});
  const result = []
  const headerLen = datas[0].length;
  for (const data of datas.slice(1, datas.length)) {
    let hasContent = false;
    data.length && data.length < headerLen ? data.length = headerLen : null;
    for (let index = 0; index < data.length; index++) {
      !data[index] ? data[index] = '' : null;
      !!data[index] ? hasContent = true : null;
    }
    hasContent && result.push(data)
  }
  emits('importClick', result)
}
const before = (file: any) => {
  readExcelFile(file, 0)
  return false
}
</script>

<style lang="less" scoped>

.btn-container {
  margin: 10px;
}

.import-excel {
  margin-top: 9px;
  margin-right: 10px;
  margin-left: 10px;
}

</style>