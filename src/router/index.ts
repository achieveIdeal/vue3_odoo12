import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";

// 1. 配置路由
const routes: Array<RouteRecordRaw> = [
    {
        path: "/", // 默认路由 home页面
        redirect: '/code_manger'
    }, {
        name: 'code_manger',
        path: "/code_manger", // 默认路由 home页面
        query: {
            type: 'form'
        },
        component: () => import("../views/CodingManager.vue"),
        redirect: '/code_manger/min_pack',
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
