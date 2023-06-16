# odoo12 + vue3 + element-plus

## 说明：

    快速开发前端界面，通过定义字段，字段参数，按钮，搜索，分组等实现列表页和表单页
    的快速开发。

### 使用范式

```vue

<RecordView
    :params="params"
    :extras="extras"
    @objectClick="objectClick"
    @saveClick="saveClick"
    @customClick="customClick"
    @pageSizeChange="pageSizeChange"
    @loadGroupDetail="loadGroupDetail"
    @lineButtonClick="lineButtonClick"
    @loadedCallable="loadedCallable"
    @selectClick="selectClick"
    @deleteLineClick="deleteLineClick"
    @fieldOnchange="fieldOnchange"
    ref="recordView"
/>
```
## 一，参数说明

### 参数params

```js
const params = reactive({
    id: 0,  // id为0时为创建页面， 不为零且记录存在时为详情页， 不需要定义
    type: 'list',  // 定义加载时显示列表页或详情页， 不需要定义
    title: '交货单',  // 抬头标题
    name: 'delivery_order',  // 路由名称
    limit: 20,  // 列表页显示数据条数
    width: '30%',  // 详情页单个item显示宽度
    offset: 0,  // 数据偏移量。一般为零
    groupby: 'state', // 分组查询默认值，须定义在extras的groupby中
    domain: [['partner_id', '=', supplier_id]],  // 列表页加载数据的筛选条件
    sort: 'id desc',  // 列表页加载数据的排序方式， 遵循sql写法
    count: 0,  // 列表页数据总数， 不需要定义
    model: 'srm.delivery.order',  // 加载数据的模型
    fields:  // 需要加载数据的字段
        ['name', 'partner_id', 'expect_date', 'company_id', 'amount',
            'h_state', 'submit_user_id', 'state', 'jit_flag', 'line_ids'],
    tables: {  // 定义表单页的table数据，渲染treeView时使用
        line_ids: {
            limit: 10,
            offset: 0,
            title: '交货订单行',
            domain: [],
            sort: 'id desc',
            count: 0,
            model: 'srm.delivery.order.line',
            fields: ['product_id', 'material_name', 'jit_id', 'shortage_id', 'amount_planned',
                'delivery_quantity', 'uom_id', 'purchase_order', 'code_names', 'comment', 'origin_data_ids']
        }
    }
})

```

### 参数extras

```js
const extras = {
    buttons: [{
        type: 'object',  // 按钮类型
        method: 'button_print',  // 按钮调用的后台模型方法
        showType: ['list', 'form'], // 需要显示在from表单页页还是list列表页
        text: '打印',  // 按钮渲染的名称
        classify: 'danger',  // 定义按钮颜色， 详情见element-plus button组件
        needRow: true,  // 是否需要选中行项目才显示
        attributes: {  // 定义一些属性，比如invisible，后接三元运算符
            invisible: [['state', 'in', ['create', 'destroy']]]
        },
    }],
    hideDetail: true,  // 详情页隐藏查看详情
    groupby: ['state'], // 可分组查询字段
    search_fields: {  // 用于渲染搜索框
        partner_id: {  // 渲染的搜索框
            domain: [],  // 关联字段筛选条件
            limit: 5,  // 关联字段下拉框数据条数
            multiple: true,  //是否多选,
            default: '' // 默认搜索值
        },
    },
    attributes: {  // 定义字段属性
        line_ids: {
            unadd: true,  // 表单页表格加载时是否隐藏可新增一行,
            undel: true, // 表单页表格加载时是否隐藏可删除
            fields: {  // 表单页表格加载字段的属性定义
                readonly: ['product_id', 'material_name', 'uom_id', 'purchase_order', 'code_names', 'amount_planned'],
                invisible: ['jit_id', 'shortage_id', 'origin_data_ids'],
                amount_planned: {
                    sum: true,  // 是否汇总
                },
                delivery_quantity: {
                    sum: true,
                    readonly: [['line_ids.purchase_order', '!=', '']],
                    min: 0,
                },
            },
            buttons: [{  // 表单页表格加载行内按钮
                method: 'match_po',
                text: '匹配采购单',
                attributes: {
                    invisible: [['state', '!=', 'create']]
                },
            }, {
                method: 'match_code',
                text: '匹配赋码',
                attributes: {
                    invisible: [['state', '!=', 'create']]
                },
            }]
        },
        partner_id: {
            width: 200, // 列表页行宽度
            domain: [['state', '!=', 'create']], // 选择时数据筛选条件
            invisible: [['state', '!=', 'create']], // 是否隐藏
            readonly: [['state', '!=', 'create']],  // 是否不可编辑
            required: [['state', '!=', 'create']]  // 是否必填字段
        },
        amount: {
            min: 0,  // 最小值
            max: 1000, // 最大值
            maxlength: 100 // 最大长度
        }
    },
    readonly: ['name', 'partner_id'],  // 是否不可编辑
    invisible: ['h_state'],  // 是否隐藏
    listInvisible: ['h_state'] // 是否在列表页隐藏
}
```

### 事件回调

```
objectClick:  类型为object的按钮点击时回调
saveClick: 保存按钮点击时回调
customClick: 类型为custom的按钮点击时回调
pageSizeChange: 分页当前页显示总数改变时回调
loadGroupDetail:  查看分组详情时回调
lineButtonClick:  行内按钮点击时回调
loadedCallable: 页面加载数据加载完成后回调
selectClick: 选中行时回调
deleteLineClick: 删除行时回调
fieldOnchange: 页面字段数据发生改变时回调
```
