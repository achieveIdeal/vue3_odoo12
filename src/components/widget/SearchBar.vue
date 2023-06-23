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
          :label="'分组:' + searcher.searchOptions[field]?.string"
          :value="field"
      ></el-option>
    </el-select>
    <template v-if="!!Object.keys(searcher.searchOptions||{}).length" v-for="field in Object.keys(searcher.searchOptions||{})" :key="field">
      <el-select
          v-if="is2Many(searcher.searchOptions[field]?.type) || is2One(searcher.searchOptions[field]?.type) && !searcher.searchOptions[field].noSelect"
          class="form-input"
          v-model="searchVal[field]"
          :placeholder="'搜索:' + searcher.searchOptions[field]?.string"
          collapse-tags
          collapse-tags-tooltip
          clearable
          :multiple="searcher.searchOptions[field]?.multiple"
          :loading="loading"
          filterable
          remote
          :remote-method="searchSelection(field)"
      >
        <el-option
            v-for="(item, index) in searchOptionCopy[field]?.selection"
            :key="index"
            :label="item[1]"
            :value="item[0]"
        ></el-option>
      </el-select>
      <el-select v-else-if="isSelection(searcher.searchOptions[field]?.type) && !searcher.searchOptions[field].noSelect"
                 class="form-input"
                 v-model="searchVal[field]"
                 :placeholder="'搜索:' + searcher.searchOptions[field]?.string"
                 multiple
                 collapse-tags
                 clearable
                 filterable
      >
        <el-option
            v-for="(item, index) in searcher.searchOptions[field]?.selection"
            :key="index"
            :label="item[1]"
            :value="item[0]"
        ></el-option>
      </el-select>
      <template v-else-if="fieldTypeMap[searcher.searchOptions[field]?.type]==='checkbox'">
        <span>
            {{ searcher.searchOptions[field]?.string }}: <input class="check-box" type="checkbox" v-model="searchVal[field]">
        </span>
      </template>
      <template v-else-if="fieldTypeMap[searcher.searchOptions[field]?.type] === 'number'">
        <el-input-number v-model="searchVal[field]"
                         class="form-input"
                         :precision="searcher.searchOptions[field]?.precision || searcher.searchOptions[field]?.digits?.length&&searcher.searchOptions[field]?.digits[1]"
                         controls-position="right"
                         :min="searcher.searchOptions[field]?.min"
                         :max="searcher.searchOptions[field]?.max"/>
      </template>
      <template v-else>
        <el-input
            clearable
            class="form-input"
            v-model="searchVal[field]"
            :type="searcher.searchOptions[field]?.type"
            :placeholder="'搜索:' + searcher.searchOptions[field]?.string"
        />
      </template>
    </template>
    <el-button v-if="!!Object.keys(searcher.searchOptions||{}).length" ref="do_search" :icon="Search" @click="searchClick"/>
  </div>
</template>

<script lang="ts" setup>
import {defineExpose, onMounted, reactive, ref} from "vue";
import {Search} from "@element-plus/icons-vue";
import {searchFieldSelection} from "../../tools";
import {useTypeStore} from "../../store";

let props = defineProps({
  searcher:{
    type: Object,
    default: {
      searchOptions:{'1': 1}
    }
  },
  groupby: {
    type: Object,
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
const groupbyVal = ref('');
const groupbyItemRef = ref({});
const searchOptionCopy = ref({});
onMounted( () => {
  const searchOptions = props.searcher.searchOptions || {}
  let groupbyDefault;
  if (groupbyItemRef?.value?.length) {
    groupbyVal.value = props.groupbyDefault
    groupbyDefault = groupbyItemRef.value.find((r) => {
      return r.value === groupbyVal.value
    })
  }
  const fields = Object.keys(searchOptions);
  if (fields.length) {
    let hasDefault = false;
    for (const field of fields) {
      if (searchOptions[field]?.default) {
        hasDefault = true;
        searchVal[field] = searchOptions[field]?.default
      }
    }
    hasDefault ? do_search.value?.$.vnode.el?.click() : groupbyDefault?.$emit('click');
  }
})
const emits = defineEmits(['searchClick', 'groupbyClick']);

let loading = ref(false)
let do_search = ref(null)

const searchSelection = (field) => (query: string) => {
  loading.value = true
  searchOptionCopy.value = JSON.parse(JSON.stringify(props.searcher?.searchOptions))
  const limit = searchOptionCopy.value[field].limit
  searchFieldSelection(searchOptionCopy.value[field], query, [], limit).then(r => {
    loading.value = false;
  });
}

const getDomain = () => {
  let domain = []
  for (let field of Object.keys(searchVal || {})) {
    let operate = '=';
    let reDateTime = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])\s+(20|21|22|23|[0-1]\d):[0-5]\d:[0-5]\d$/;
    let reDate =/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
    let isDate = reDateTime.test(searchVal[field]) || reDate.test(searchVal[field]);
    if (!searchVal[field] || searchVal[field] instanceof Array && !searchVal[field].length) {
      if (props.searcher?.searchOptions[field]?.type !== 'boolean') {
        continue
      }
    }
    if (searchVal[field] instanceof Array && !!searchVal[field].length) {
      operate = 'in';
    }
    if (typeof searchVal[field] === 'string' && !isDate) {
      searchVal[field]= searchVal[field].trim()
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
  const domain = getDomain();
  if (groupbyVal.value.length) {
    emits('groupbyClick', groupbyVal.value, domain)
  } else {
    emits('searchClick', domain);
  }
}
document.onkeydown = e => {
  if (e.keyCode === 13) {
    do_search.value?.$.vnode.el?.click()
  }
}

defineExpose({
  getDomain
})

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