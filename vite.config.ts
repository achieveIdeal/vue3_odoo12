import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import { terser } from 'rollup-plugin-terser';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
        terser()
    ],
    base: '/base_front_view/',
    build: {
        outDir: 'base_front_view',
        assetsDir: 'static',
        emptyOutDir: false,
        chunkSizeWarningLimit: 1024,
        minify: 'terser', // 必须启用：terserOptions配置才会有效
        rollupOptions: {
            output: {
                chunkFileNames: `static/src/js/[name].js`,
                entryFileNames: `static/src/js/[name].js`,
                assetFileNames: `static/src/css/[name].[ext]`,
            }
        },
        terserOptions: {
            compress: {
                // 生产环境时移除console.log调试代码
                drop_console: true,
                drop_debugger: true,
            }
        }
    },
    server: {
        proxy: {
            '/front': {
                target: 'http://127.0.0.1:8070', // 实际请求地址
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/front/, "front"),
            },
        },
    }

})
