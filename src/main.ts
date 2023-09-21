import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import {createPinia} from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/src/index.scss'
import { tFn } from './hook/useI18n';
import {setupI18n} from './locales'


const pinia = createPinia()

const app = createApp(App)
app.config.globalProperties.tFn=tFn;
setupI18n(app);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
//使用pinia
app.use(router).use(pinia).mount('#app')