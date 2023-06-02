import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index'
import {createPinia} from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/src/message.scss'

const pinia = createPinia()

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
//使用pinia
app.use(router).use(pinia).mount('#app')