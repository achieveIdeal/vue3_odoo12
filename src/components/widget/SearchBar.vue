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
          :label="'分组:' + searchOptions[field]?.string"
          :value="field"
      ></el-option>
    </el-select>
    <template v-if="!!Object.keys(options).length" v-for="field in Object.keys(options)" :key="field">
      <el-select v-if="is2Many(searchOptions[field]?.type) || is2One(searchOptions[field]?.type)"
                 class="form-input"
                 v-model="searchVal[field]"
                 :placeholder="'搜索:' + searchOptions[field]?.string"
                 collapse-tags
                 collapse-tags-tooltip
                 clearable
                 :multiple="searchOptions[field]?.multiple"
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
      <el-select v-else-if="isSelection(searchOptions[field]?.type)"
                 class="form-input"
                 v-model="searchVal[field]"
                 :placeholder="'搜索:' + searchOptions[field]?.string"
                 multiple
                 collapse-tags
                 clearable
                 filterable
      >
        <el-option
            v-for="(item, index) in searchOptions[field]?.selection"
            :key="index"
            :label="item[1]"
            :value="item[0]"
        ></el-option>
      </el-select>
      <template v-else-if="fieldTypeMap[searchOptions[field]?.type]==='checkbox'">
        <span>
            {{ searchOptions[field]?.string }}: <input class="check-box" type="checkbox" v-model="searchVal[field]">
        </span>
      </template>
      <template v-else-if="fieldTypeMap[searchOptions[field]?.type] === 'number'">
        <el-input-number v-model="searchVal[field]"
                         class="form-input"
                         :precision="searchOptions[field]?.precision || searchOptions[field]?.digits?.length&&searchOptions[field]?.digits[1]"
                         controls-position="right"
                         :min="searchOptions[field]?.min"
                         :max="searchOptions[field]?.max"/>
      </template>
      <template v-else>
        <el-input
            class="form-input"
            v-model="searchVal[field]"
            :type="searchOptions[field]?.type"
            :placeholder="'搜索:' + searchOptions[field]?.string"
        />
      </template>
    </template>
    <el-button v-if="!!Object.keys(options).length" ref="do_search" :icon="Search" @click="searchClick"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue";
import {Search} from "@element-plus/icons-vue";
import {searchFieldSelection} from "../../tools";
import {callFields} from "../../service/module/call";
import {useTypeStore} from "../../store";
import {initSearchBar} from "../../tools/init";

let props = defineProps({
  options: {
    type: Object,
    default: {}
  },
  model: {
    type: String,
    default: ''
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
const searchOptions = ref({});
const searchOptionCopy = ref({});

onMounted(async () => {
  let groupbyDefault;
  if (groupbyItemRef?.value?.length) {
    groupbyVal.value = props.groupbyDefault
    groupbyDefault = groupbyItemRef.value.find((r) => {
      return r.value === groupbyVal.value
    })
  }
  const fields = Object.keys(props.options);
  if (fields.length) {
    const result = await callFields({
      model: props.model,
      args: [0, fields]
    })
    searchOptions.value = initSearchBar({search_fields: props.options, groupby: props.groupby}, result.result);
    let hasDefault = false;
    for (const field of fields) {
      searchVal[field] = searchOptions.value[field]?.default
      if (searchOptions.value[field]?.default) {
        hasDefault = true;
        searchVal[field] = searchOptions.value[field]?.default
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
  searchOptionCopy.value = JSON.parse(JSON.stringify(searchOptions.value))
  const limit = searchOptionCopy.value[field].limit
  searchFieldSelection(searchOptionCopy.value[field], query, [], limit).then(r => {
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