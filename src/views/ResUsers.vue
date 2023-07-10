<template>
  <PageHeader title="用户管理"/>
  <el-dialog v-model="dialogVisible" title="删除" width="40%" draggable destroy-on-close modal>
    <div>确定要删除这条记录吗？</div>
    <template #footer>
            <span class="dialog-footer">
        <el-button v-loading.fullscreen.lock="loading"
                   element-loading-text="正在加载..."
                   @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDel">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
  <RecordView :params="params" :extras="extras" @deleteRow="deleteRow"/>
</template>

<script lang="ts" setup>
import {inject, reactive, ref} from "vue";
import {ElMessage} from "element-plus";
import {callKw} from "../service/module/call";

const supplier_id = parseInt(inject('supplier_id'));
const user_id = parseInt(inject('user_id'));
const dialogVisible = ref(false);
let delParams = {}
const loading = ref(false);
const params = reactive({
  title: '用户管理',
  model: 'res.users',
  name: 'res_users',
  canDel: true,
  domain: [['partner_id', '=', supplier_id], ['parent_id', '=', user_id]],
  fields: ['name', 'login', 'email', 'hide_menu_ids']
})

const extras = {
  buttons: [
    {
      type: 'edit',
      text: '编辑',
      showType: ['form'],
      attributes: {
        invisible: [['if_print', '=', true]]
      }
    }, {
      type: 'create',
      showType: ['list', 'form'],
      text: '创建'
    }
  ],
  attributes: {
    password: {
      type: 'password'
    },
    email: {
      type: 'email'
    },
    login: {
      string: '用户名'
    }
  },
  required: ['name', 'login', 'email', 'hide_menu_ids']
}

const deleteRow = (row, reload) => {
  delParams = {
    row: row,
    reload: reload
  }
  dialogVisible.value = true
}

const confirmDel = () => {
  loading.value = true;
  callKw({
    model: params.model,
    method: 'unlink',
    args: [delParams.row.id],
  }).then(res => {
    if (res.error) {
      loading.value = false;
      ElMessage({
        message: res.error.data.message,
        type: 'error'
      });
      return false
    }
    ElMessage({
      message: '删除成功',
      type: 'success'
    });
    dialogVisible.value = false;
    delParams.reload()
    loading.value = false;
  })
}
</script>

<style scoped>

</style>