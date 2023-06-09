import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";

// 1. 配置路由
const routes: Array<RouteRecordRaw> = [
    // {
    //     name: 'supplier_info',
    //     path: '/supplier_info',
    //     component: () => import("../views/SupplierInfo.vue"),
    // },
    {
        name: 'shortage_product',
        path: '/shortage_product',
        component: () => import("../views/ShortageProduct.vue"),
    },
    {
        name: 'delivery_order',
        path: '/delivery_order',
        component: () => import("../views/DeliveryOrder.vue"),
    },
    {
        name: 'code_manager',
        path: "/code_manager",
        component: () => import("../views/CodingManager.vue"),
        redirect: '/code_manager/min_pack',
        children: [
            {path: 'min_pack', component: () => import("../views/code_manager/MinPack.vue"), name: 'min_pack'},
            {path: 'outer_pack', component: () => import("../views/code_manager/OuterPack.vue"), name: 'outer_pack'},
            {path: 'board_pack', component: () => import("../views/code_manager/BoardPack.vue"), name: 'board_pack'}
        ]
    },
];
// 2.返回一个 router 实列，为函数，配置 history 模式
const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// 3.导出路由   去 main.ts 注册 router.ts
export default router
