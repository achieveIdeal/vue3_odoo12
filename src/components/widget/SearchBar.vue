<template>
  <div class="search-bar">
    <el-select v-if="!!groupby.length"
               class="group-by"
               v-model="groupbyVal"
               placeholder="分组查询"
               collapse-tags
               clearable
               filterable
    >
      <el-option
          @click="groupbyClick"
          ref="groupbyItemRef"
          v-for="(field, index) in groupby"
          :key="index"
          :label="'分组:' + options[field]?.string"
          :value="field"
      ></el-option>
    </el-select>
    <template v-if="!!searchFields.length" v-for="field in searchFields" :key="field">
      <el-select v-if="is2Many(options[field]?.type) || is2One(options[field]?.type)"
                 class="form-input"
                 v-model="searchVal[field]"
                 :placeholder="'搜索:' + options[field]?.string"
                 collapse-tags
                 collapse-tags-tooltip
                 clearable
                 multiple
                 :loading="loading"
                 filterable
                 remote
                 :remote-method="searchSelection(field)"
      >
        <el-option
            v-for="(item, index) in searchOptions[field]?.selection"
            :key="index"
            :label="item[1]"
            :value="item[0]"
        ></el-option>
      </el-select>
      <el-select v-else-if="isSelection(options[field]?.type)"
                 class="form-input"
                 v-model="searchVal[field]"
                 :placeholder="'搜索:' + options[field]?.string"
                 multiple
                 collapse-tags
                 clearable
                 filterable
      >
        <el-option
            v-for="(item, index) in options[field]?.selection"
            :key="index"
            :label="item[1]"
            :value="item[0]"
        ></el-option>
      </el-select>
      <template v-else-if="fieldTypeMap[options[field]?.type]==='checkbox'">
        <span>
            {{ options[field]?.string }}: <input class="check-box" type="checkbox" v-model="searchVal[field]">
        </span>
      </template>
      <template v-else-if="fieldTypeMap[options[field]?.type] === 'number'">
        <el-input-number v-model="searchVal[field]"
                         class="form-input"
                         :precision="options[field]?.precision || options[field]?.digits?.length&&options[field]?.digits[1]"
                         controls-position="right"
                         :min="options[field]?.min"
                         :max="options[field]?.max"/>
      </template>
      <template v-else>
        <el-input
            class="form-input"
            v-model="searchVal[field]"
            :type="options[field]?.type"
            :placeholder="'搜索:' + options[field]?.string"
        />
      </template>
    </template>
    <el-button ref="do_search" :icon="Search" @click="searchClick"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue";
import {Search} from "@element-plus/icons-vue";
import {searchFieldSelection} from "../../tools";
import {useTypeStore} from "../../store";

let props = defineProps({
  options: {
    type: Object,
    default: {}
  },
  groupby: {
    type: Object,
    default: []
  },
  searchFields: {
    type: Array,
    default: []
  },
  groupbyDefault: {
    type: String,
    default: ''
  }
})


const typeStore = useTypeStore();
const fieldTypeMap = typeStore.types;
const isSelection = typeStore.isSelection;
const is2Many = typeStore.is2Many;
const is2One = typeStore.is2One;
const searchVal = reactive({});
const groupbyVal = ref(props.groupbyDefault);
const groupbyItemRef = ref({})
let searchOptions = reactive({})

onMounted(() => {
  if (groupbyItemRef?.value?.length) {
    const groupbyDefault = groupbyItemRef.value.find((r) => {
      return r.value === groupbyVal.value
    })
    groupbyDefault?.$emit('click')
  }
})
const emits = defineEmits(['searchClick', 'groupbyClick']);

let loading = ref(false)
let do_search = ref(null)

const searchSelection = (field) => (query: string) => {
  loading.value = true
  searchOptions = JSON.parse(JSON.stringify(props?.options));
  searchFieldSelection(searchOptions[field], query).then(r => {
    loading.value = false;
  });
}

const getDomain = () => {
  let domain = []
  for (let field of Object.keys(searchVal || {})) {
    let operate = '=';
    let isDate = !isNaN(Date.parse(searchVal[field]))
    if (!searchVal[field] || searchVal[field] instanceof Array && !searchVal[field].length) {
      if (props.options[field]?.type !== 'boolean') {
        continue
      }
    }
    if (searchVal[field] instanceof Array && !!searchVal[field].length) {
      operate = 'in';
    }
    if (typeof searchVal[field] === 'string' && !isDate) {
      operate = 'ilike';
    }
    domain.push([field, operate, searchVal[field]]);
  }
  return domain
}

const groupbyClick = () => {
  const domain = getDomain();
  emits('groupbyClick', groupbyVal.value, domain)
}

const searchClick = () => {
  groupbyVal.value = ''
  const domain = getDomain();
  emits('searchClick', domain);
}
document.onkeydown = e => {
  if (e.keyCode === 13) {
    do_search.value?.$.vnode.el?.click()
  }
}

</script>

<style scoped>
.form-input {
  background-color: #fff;
  width: 200px;
  margin-right: 20px;
}

.check-box {
  vertical-align: middle;
}

.search-bar {
  margin: 10px;
}

.group-by {
  width: 210px;
  margin-right: 10px;
}
</style>