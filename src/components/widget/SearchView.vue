<template>

  <div aria-autocomplete="list" class="search-bar" role="search">
    <div class="o_searchview_input_container">
      <ul v-show="showSelects" class="dropdown-menu o_searchview_autocomplete" role="menu">
        <template v-for="(searchItem, index) of searchItems" :key="index">
          <li ref="searchItemRef" @click="searchItemClick(searchItem)" class="dropdown-item filter-item"><a
              href="javascript:void(0)">搜索
            <em>{{ searchItem.string }}</em>为 :
            <strong>{{
                searchItem.text[0]
              }}</strong></a>
          </li>
        </template>
      </ul>
      <Search style="width:16px;margin-right: 6px;"/>
      <Facet :searchFacets="searchFacets" @facetCloseClick="removeSearchItem"/>
      <input @input="searchInputInput" accesskey="Q" aria-haspopup="true" v-model="searchInputValue"
             @keydown="listenDeleteDown"
             class="o_searchview_input" placeholder="搜索..." role="searchbox"
             type="text">
    </div>
    <div class="o_cp_right">
      <div class="btn-group o_search_options" role="search">
        <div style="">
          <div class="btn-group">
            <button class="btn" type="button" accesskey="M" @click="clearFiltersClick"
                    aria-keyshortcuts="Alt+Shift+A" style="position: relative;">清除
            </button>
          </div>
          <div class="btn-group o_dropdown">
            <button aria-expanded="false" data-boundary="viewport" data-flip="false" data-toggle="dropdown"
                    @click="toggleShowFilter"
                    class="o_dropdown_toggler_btn btn dropdown-toggle filter-item" tabindex="-1">
              筛选
            </button>
            <div v-show="showFilter" class="dropdown-menu" role="menu">
              <div class="o_menu_item" data-id="__filter__10" v-for="filterOption of filterOptions"
                   :key="filterOptions.field" @click="filterItemClick(filterOption)">
                <a href="javascript:void(0)" role="menuitemcheckbox" aria-checked="false"
                   class="dropdown-item filter-item">
                  <Check :class="{hidden: checkedFilterItem.indexOf(filterOption.value) === -1}"
                         class="check-right"/>
                  {{ filterOption.text }}
                </a>
              </div>
            </div>
          </div>
          <div class="btn-group o_dropdown">
            <button aria-expanded="false" data-boundary="viewport" data-flip="false" data-toggle="dropdown"
                    class="o_dropdown_toggler_btn btn dropdown-toggle filter-item" tabindex="-1"
                    @click="toggleShowGroupby"> 分组
            </button>
            <div v-show="showGroupby" class="dropdown-menu" role="menu">
              <div class="o_menu_item" data-id="__groupby__7" v-for="groupbyOption of groupbyOptions"
                   :key="groupbyOption.groupby">
                <a href="javascript:void(0)" role="menuitemcheckbox" aria-checked="false"
                   class="dropdown-item filter-item"
                   @click="groupbyItemClick(groupbyOption)">
                  <Check :class="{hidden: checkedGroupItem.indexOf(groupbyOption.groupby) === -1}"
                         class="check-right"/>
                  {{ groupbyOption.text }}
                </a>
              </div>
            </div>
          </div>
          <div class="btn-group o_dropdown filter-item">
            <button aria-expanded="false" data-toggle="dropdown"
                    class="o_dropdown_toggler_btn btn dropdown-toggle filter-item"
                    tabindex="-1" @click="toggleShowDateRange"> 时间范围
            </button>
            <div v-show="showDateRange" class="dropdown-menu filter-item" role="menu">
              <div class="dropdown-item-text filter-item">
                <label for="date_field_selector filter-item">基于</label>
                <select class="o_input filter-item" v-model="curDateRangeField"
                        @change="dateRangeFieldChange">
                  <option v-for="field of dateFields" :key="field" :value="field" class="filter-item">
                    {{ searcher.searchOptions[field]?.string }}
                  </option>
                </select>
              </div>
              <div v-if="searcher.searchOptions[curDateRangeField]?.searchType==='range'"
                   class="dropdown-item-text filter-item">
                <label for="time_range_selector filter-item">范围</label>
                <select class="o_input filter-item" v-model="curDateRangeVal">
                  <option style='display: none' value=""></option>
                  <option v-for="dateSelect of dateOptions[curDateRangeField]" :key="dateSelect.key" class="filter-item"
                          :value="dateSelect.key">
                    {{ dateSelect.text }}
                  </option>
                </select>
              </div>
              <div v-else class="dropdown-item-text filter-item" role="menuitem">
                  <span class="o_searchview_extended_prop_value filter-item" style="font-size: 13px;color:#000000;">
                  从:<input class="o_input filter-item" type="date" v-model="dateStart"> <br>
                  至:<input class="o_input filter-item" type="date" v-model="dateEnd">
                </span>
              </div>
              <div class="dropdown-item-text filter-item">
                <button class="btn filter-item" type="button" accesskey="M" @click="dateRangeClick"
                        aria-keyshortcuts="Alt+Shift+M" style="position: relative;">应用
                </button>
                <button class="btn filter-item" type="button" accesskey="M" @click="dateRangeClearClick"
                        aria-keyshortcuts="Alt+Shift+L" style="position: relative;left: 15px;">清除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref, watch} from "vue";
import {Search, Check} from "@element-plus/icons-vue";
import {dateFtt, getDateTypeValue} from "../../tools";

const props = defineProps({
  searcher: {
    type: Object,
    default: {
      searchOptions: {}
    }
  },
  groupby: {
    type: Object,
    default: []
  },
  groupbyDefault: {
    type: Object,
    default: []
  }
})


const dateStart = ref( dateFtt("yyyy-MM-dd",new Date()))
const dateEnd = ref( dateFtt("yyyy-MM-dd",new Date()))

const dateRangeSelect = {
  last_3_days: {
    text: '过去3天',
  }, last_7_days: {
    text: '过去7天',
  },
  last_14_days: {
    text: '过去14天',
  },
  last_30_days: {
    text: '过去30天',
  },
  last_365_days: {
    text: '过去365天',
  },
  today: {
    text: '今日',
  },
  this_week: {
    text: '本周',
  },
  this_month: {
    text: '本月',
  },
  this_quarter: {
    text: '本季度',
  },
  this_year: {
    text: '本年度',
  },
  yesterday: {
    text: '昨天',
  },
  last_week: {
    text: '上周',
  },
  last_month: {
    text: '上月',
  },
  last_quarter: {
    text: '上季度',
  },
  last_year: {
    text: '上年',
  },
}

const searchInputValue = ref('');
const emits = defineEmits(['groupbyClick', 'searchClick']);
const showSelects = ref(false);
const searchFacets = ref([]);
const searchItems = ref([]);
const searchItemRef = ref({});

const showFilter = ref(false);
const showGroupby = ref(false);
const showDateRange = ref(false);

const filterOptions = ref([]);
const groupbyOptions = ref([]);
const dateFields = ref([]);
const dateOptions = ref({});

const checkedFilterItem = ref([]);
const checkedGroupItem = ref([]);

const curDateRangeField = ref('')
const curDateRangeVal = ref('')

const getDomain = () => {
  let domain = []
  for (let searchFacet of searchFacets.value) {
    if (searchFacet.groupby) continue;
    let operate = '=';
    let isDate = searchFacet.value[0] instanceof Date;
    let value = searchFacet.value.length === 1 ? searchFacet.value[0] : searchFacet.value;
    const field = searchFacet.field;
    if (!value || value instanceof Array && !value.length) {
      if (props.searcher?.searchOptions[field]?.type !== 'boolean') {
        continue
      }
    }
    if (value instanceof Array && !!value.length) {
      operate = 'in';
    }
    if (typeof value === 'string' && !isDate && props.searcher.searchOptions[field].type !== 'selection') {
      value = value.trim()
      operate = 'ilike';
    }
    if (isDate) {
      let start = 0;
      let end = 0;
      const fieldType = props.searcher.searchOptions[field].type;
      if (fieldType === 'date') {
        start = dateFtt("yyyy-MM-dd", value[0]);
        end = dateFtt("yyyy-MM-dd", value[1]);
      }
      if (fieldType === 'datetime') {
        start = dateFtt("yyyy-MM-dd hh:mm:ss", value[0]);
        end = dateFtt("yyyy-MM-dd hh:mm:ss", value[1]);
      }
      domain = domain.concat([[field, '>=', start], [field, '<=', end]]);
    } else {
      domain.push([field, operate, value]);
    }
  }
  return domain
}

const doSearch = () => {
  const groupbys = searchFacets.value.filter(r => r.groupby).map(r => r.groupby);
  if (groupbys?.length) {
    emits('groupbyClick', groupbys)
  } else {
    emits('searchClick');
  }
}


onMounted(() => {
  const searchOptions = props.searcher.searchOptions || [];
  const fields = Object.keys(searchOptions);
  if (fields.length) {
    let hasDefault = false;
    for (const field of fields) {
      const fieldOption = searchOptions[field]
      if (['range', 'customRange'].includes(fieldOption.searchType)) {
        !curDateRangeField.value ? curDateRangeField.value = field : null;
        dateFields.value.push(field);
        for (const dateVal of fieldOption.options) {
          !dateOptions.value[field] ? dateOptions.value[field] = [{
            key: dateVal,
            text: dateRangeSelect[dateVal].text,
            value: dateRangeSelect[dateVal].value,
            string: fieldOption.string
          }] : dateOptions.value[field].push({
            key: dateVal,
            text: dateRangeSelect[dateVal].text,
            value: dateRangeSelect[dateVal].value,
            string: fieldOption.string
          })
        }
      }
      if (fieldOption.searchType === 'filter') {
        for (const selectVal of fieldOption.options) {
          if (fieldOption.type === 'selection') {
            filterOptions.value.push({
              field: field,
              text: fieldOption.selection.find(r => r[0] === selectVal)[1],
              value: selectVal,
              string: fieldOption.string
            })
          } else {
            filterOptions.value.push({
              field: field,
              text: selectVal,
              value: selectVal,
              string: fieldOption.string
            })
          }
        }
      }
      if (props.groupby.indexOf(field) !== -1) {
        groupbyOptions.value.push({
          groupby: field,
          text: fieldOption.string,
          string: '分组:',
          value: field,
        })
      }
      if (!fieldOption.searchType) {
        const searchItem = {
          field: field,
          text: [searchOptions[field]?.default],
          string: searchOptions[field]?.string,
          value: [searchOptions[field]?.default],
        }
        searchItems.value.push(searchItem)
      }
      if (searchOptions[field]?.default) {  // 默认值必须是数组
        checkedFilterItem.value = checkedFilterItem.value.concat(searchOptions[field]?.default)
        hasDefault = true;
        let text = searchOptions[field]?.default;
        if (fieldOption.type === 'selection') {
          text = fieldOption.selection.filter(r => text.indexOf(r[0]) !== -1).map(r => r[1]);

        }
        searchFacets.value.push({
          field: field,
          string: searchOptions[field]?.string,
          value: searchOptions[field]?.default,
          text: text
        })
      }
    }
    if (props.groupbyDefault.length) {
      hasDefault = true;
      for (const groupby of props.groupbyDefault) {
        checkedGroupItem.value.push(groupby)
        searchFacets.value.push({
          groupby: groupby,
          text: [searchOptions[groupby]?.string],
          string: '分组:',
          value: [groupby],
        })
      }
    }
    hasDefault && doSearch();
  }
})


const hideSearchWidget = () => {
  showFilter.value = false;
  showGroupby.value = false;
  showDateRange.value = false;
  showSelects.value = false;
}

const toggleShowFilter = () => {
  showFilter.value = !showFilter.value;
  showGroupby.value = false;
  showDateRange.value = false;
}
const toggleShowGroupby = () => {
  showFilter.value = false;
  showDateRange.value = false;
  showGroupby.value = !showGroupby.value;
}
const toggleShowDateRange = () => {
  showFilter.value = false;
  showGroupby.value = false;
  showDateRange.value = !showDateRange.value;
}

const searchInputInput = () => {
  hideSearchWidget();
  setTimeout(() => {
    const value = searchInputValue.value
    for (const searchItem of searchItems.value) {
      if (searchItem.groupby) continue;
      searchItem.value = [value]
      searchItem.text = [value]
    }
    showSelects.value = !!value;
  }, 500)
}


const filterItemClick = (filterOption) => {
  const value = filterOption.value
  if (checkedFilterItem.value.indexOf(value) === -1) {
    checkedFilterItem.value.push(value);
    const existFilter = searchFacets.value.find(r => r.field === filterOption.field);
    if (existFilter?.field) {
      if (existFilter.value.indexOf(filterOption.value) === -1) {
        existFilter.value = existFilter.value.concat(filterOption.value)
        existFilter.text = existFilter.text.concat(filterOption.text)
      }
    } else {
      searchFacets.value.push({
        field: filterOption.field,
        string: filterOption.string,
        value: [filterOption.value],
        text: [filterOption.text]
      })
    }
  } else {
    checkedFilterItem.value.splice(checkedFilterItem.value.indexOf(value), 1);
    const delFilter = searchFacets.value.find(r => r.value.indexOf(filterOption.value) !== -1);
    if (delFilter?.value) {
      delFilter?.value.splice(delFilter?.value.indexOf(filterOption.value), 1);
      delFilter?.text.splice(delFilter?.text.indexOf(filterOption.text), 1);
      if (!delFilter.value.length) {
        searchFacets.value.splice(searchFacets.value.indexOf(delFilter), 1);
      }
    }
  }
  doSearch();
}


watch(dateStart, () => {
  dateEnd.value = dateStart.value;
})
watch(curDateRangeField, ()=>{
    curDateRangeVal.value = '';

})

const groupbyItemClick = (groupbyOption) => {
  const field = groupbyOption.groupby;
  if (checkedGroupItem.value.indexOf(field) === -1) {
    checkedGroupItem.value.push(field);
    const existGroupby = searchFacets.value.find(r => r.groupby === groupbyOption.groupby);
    if (!existGroupby?.groupby) {
      searchFacets.value.push({
        groupby: groupbyOption.groupby,
        text: [groupbyOption.text],
        string: '分组:',
        value: [groupbyOption.value],
      })
    }
  } else {
    checkedGroupItem.value.splice(checkedGroupItem.value.indexOf(field), 1);
    const delGroupby = searchFacets.value.find(r => r.groupby === groupbyOption.groupby);
    searchFacets.value.splice(searchFacets.value.indexOf(delGroupby), 1)
  }
  doSearch();
}

const dateRangeClick = () => {
  if (!curDateRangeVal.value && props.searcher.searchOptions[curDateRangeField.value].searchType === 'range') return;
  const dateKey = curDateRangeVal.value;
  const dateSelect = dateRangeSelect[dateKey];
  const existFilter = searchFacets.value.find(r => r.field === curDateRangeField.value);
  const dateRange = getDateTypeValue(dateKey)
  const start = new Date(Date.parse(dateStart.value))
  const end = new Date(Date.parse(dateEnd.value))
  const text = [dateSelect?.text || [dateFtt("yyyy-MM-dd", start), dateFtt("yyyy-MM-dd", end)].join('~')]
  if (props.searcher.searchOptions[curDateRangeField.value].searchType !== 'range') {
    dateRange[0] = start;
    dateRange[1] = end
  }
  if (existFilter?.field) {
    existFilter.value = dateRange
    existFilter.text = text
  } else {
    searchFacets.value.push({
      field: curDateRangeField.value,
      string: props.searcher.searchOptions[curDateRangeField.value].string,
      value: dateRange,
      text: text
    })
  }
  doSearch()
}
const dateRangeClearClick = () => {
  curDateRangeVal.value = '';
  const dateRangeFilters = searchFacets.value.filter(r => props.searcher?.searchOptions[r.field]?.searchType === 'date');
  for (const dateRangeFilter of dateRangeFilters) {
    searchFacets.value.splice(searchFacets.value.indexOf(dateRangeFilter), 1)
  }
  if (dateRangeFilters.length) {
    doSearch();
  }
}
const clearFiltersClick = () => {
  const canDo = searchFacets.value.length;
  searchFacets.value = [];
  checkedFilterItem.value = [];
  checkedGroupItem.value = [];
  canDo && doSearch();
}

const searchItemClick = (searchItem) => {
  showSelects.value = false;
  searchInputValue.value = ''
  const existItem = searchFacets.value.find(r => r.field === searchItem.field);
  if (!existItem?.field) {
    searchFacets.value.push({...searchItem});
  } else {
    existItem.value = existItem.value.concat(searchItem.value);
    existItem.text = existItem.text.concat(searchItem.text);
  }
  doSearch()
}

const listenDeleteDown = (e) => {
  const canDo = searchFacets.value.length;
  if (e.keyCode === 8 && !searchInputValue.value) {
    searchFacets.value.pop();
    canDo && doSearch();
  }
};

const removeSearchItem = (searchFacet) => {
  const delItem = searchItems.value.find(r => r.field === searchFacet.field);
  if (delItem) {
    delItem.value = [];
  }
  if (searchFacet.field) {
    checkedFilterItem.value.splice(checkedFilterItem.value.indexOf(searchFacet.field), 1)
  }
  if (searchFacet.groupby) {
    checkedGroupItem.value.splice(checkedGroupItem.value.indexOf(searchFacet.groupby), 1)
  }
  doSearch()
}

document.onclick = e => {
  const classNames = (e.target.className.length ? e.target.className : '').split(' ');
  if (!(classNames.indexOf('filter-item') !== -1)) {
    hideSearchWidget();
  }
}

defineExpose({
  getDomain, searchFacets
})
</script>

<style lang="less" scoped>

.o_cp_right {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  margin-top: 5px;
  float: right;

  .o_search_options {
    margin-left: 10px !important;
    display: block;

    .o_dropdown {
      white-space: nowrap;
      display: inline-block;
      cursor: pointer;
      user-select: none;
      margin-right: 15px;

      .o_dropdown_toggler_btn {
        background-color: #fff;
        padding: 0;
        font-size: 1rem;
        color: #666666;
        text-transform: initial;
        border-top: none;
        border-right: 1px;
        border-bottom: none;
        border-left: none;
        padding-left: 10px;
      }

    }
  }

  .dropdown-toggle::after {
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 0.255em;
    vertical-align: 0.255em;
    content: "";
    border-top: 0.3em solid;
    border-right: 0.3em solid transparent;
    border-bottom: 0;
    border-left: 0.3em solid transparent;
  }

  .btn:not(:disabled):not(.disabled) {
    cursor: pointer;
  }

  .btn-group, .btn-group-vertical {
    position: relative;
    display: -webkit-inline-flex;
    display: inline-flex;
    vertical-align: middle;
  }

}

.dropdown-item {
  padding: 3px 20px;
  font-size: 1rem;
  width: 100%;
  color: #1c2518 !important;
}

.o_time_range_menu .dropdown-item-text > label, .o_time_range_menu .custom-control-label {
  font-weight: bold;
}

.o_input {
  border: 1px solid #cfcfcf;
  border-top-style: none;
  border-right-style: none;
  border-left-style: none;
}


[type="text"], [type="password"], [type="number"], textarea, select {
  width: 100%;
  display: block;
  outline: none;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.dropdown-item-text {
  display: block;
  padding: 0.25rem 1.5rem;
  color: #666666;
}

.o_cp_searchview {
  width: 50%;
}

.search-bar {
  min-width: 800px;
  max-width: 1000px;
  margin-top: 10px;
  margin-bottom: 10px;

  .o_searchview_input_container {
    display: flex;
    flex-wrap: wrap;
    height: 30px;
    border-bottom: 1px solid #8f8f8f;

    .o_searchview_autocomplete {
      position: absolute;
      top: 70%;
      left: auto;
      bottom: auto;
      right: auto;
      width: 1000px;
      padding: 5px;
      z-index: 2;
    }

    .o_searchview_input {
      width: 100px;
      font-size: 1rem;
      height: 29px;
      -webkit-box-flex: 1;
      -webkit-flex: 1 0 auto;
      flex: 1 0 auto;
      border: none;
      outline: none;
    }
  }
}

.dropdown-menu {
  box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.25);
  position: absolute;
  top: 100%;
  left: 0;
  float: left;
  min-width: 10rem;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  font-size: 1rem;
  color: #666666;
  text-align: left;
  list-style: none;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #dee2e6;
  border-radius: 0;

  a {
    color: #008784;
    text-decoration: none;
    background-color: transparent;
    display: inline-block;
    width: 100%;
  }
}

li, .o_menu_item {
  :hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.hidden {
  display: none;
}

.btn {
  display: inline-block;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  color: #666666;
  line-height: 1.5;
  border-radius: 0;
  background-color: #fff;

}

.btn:hover {
  color: #888888;
}

.btn:active {
  color: #2a598a;
}

.check-right {
  width: 18px;
  font-weight: 700;
  vertical-align: bottom;
  position: relative;
  left: -15px;
  margin-right: -10px;
}

</style>
