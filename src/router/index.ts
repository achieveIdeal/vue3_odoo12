import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";


let ycRoutes: Array<RouteRecordRaw> = [
    {
        name: 'home',
        path: '/',
        component: () => import("../views/HomePage.vue")
    }, {
        name: 'action',
        path: '/action',
        component: () => import("../views/MainView.vue"),
    },
]

// 2.返回一个 router 实列，为函数，配置 history 模式
const router = createRouter({
    history: createWebHashHistory(),
    routes: ycRoutes,
});

// 3.导出路由   去 main.ts 注册 router.ts
export default router
