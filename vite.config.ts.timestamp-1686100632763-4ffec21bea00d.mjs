// vite.config.ts
import { defineConfig } from "file:///D:/python_project/vue3/vue_ts/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/python_project/vue3/vue_ts/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///D:/python_project/vue3/vue_ts/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/python_project/vue3/vue_ts/node_modules/unplugin-vue-components/dist/vite.mjs";
import { ElementPlusResolver } from "file:///D:/python_project/vue3/vue_ts/node_modules/unplugin-vue-components/dist/resolvers.mjs";
import { terser } from "file:///D:/python_project/vue3/vue_ts/node_modules/rollup-plugin-terser/rollup-plugin-terser.mjs";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    terser()
  ],
  base: "/base_front_view/",
  build: {
    outDir: "base_front_view",
    assetsDir: "static",
    manifest: false,
    chunkSizeWarningLimit: 1024,
    minify: "terser",
    // 必须启用：terserOptions配置才会有效
    rollupOptions: {
      output: {
        chunkFileNames: `static/src/js/[name].js`,
        entryFileNames: `static/src/js/[name].js`,
        assetFileNames: `static/src/css/[name].[ext]`
      }
    },
    terserOptions: {
      compress: {
        // 生产环境时移除console.log调试代码
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8070",
        // 实际请求地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxweXRob25fcHJvamVjdFxcXFx2dWUzXFxcXHZ1ZV90c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccHl0aG9uX3Byb2plY3RcXFxcdnVlM1xcXFx2dWVfdHNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3B5dGhvbl9wcm9qZWN0L3Z1ZTMvdnVlX3RzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHtkZWZpbmVDb25maWd9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuaW1wb3J0IHtFbGVtZW50UGx1c1Jlc29sdmVyfSBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy9yZXNvbHZlcnMnXG5pbXBvcnQgeyB0ZXJzZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXRlcnNlcic7XG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIHZ1ZSgpLFxuICAgICAgICBBdXRvSW1wb3J0KHtcbiAgICAgICAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXG4gICAgICAgIH0pLFxuICAgICAgICBDb21wb25lbnRzKHtcbiAgICAgICAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXG4gICAgICAgIH0pLFxuICAgICAgICB0ZXJzZXIoKVxuICAgIF0sXG4gICAgYmFzZTogJy9iYXNlX2Zyb250X3ZpZXcvJyxcbiAgICBidWlsZDoge1xuICAgICAgICBvdXREaXI6ICdiYXNlX2Zyb250X3ZpZXcnLFxuICAgICAgICBhc3NldHNEaXI6ICdzdGF0aWMnLFxuICAgICAgICBtYW5pZmVzdDogZmFsc2UsXG4gICAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAyNCxcbiAgICAgICAgbWluaWZ5OiAndGVyc2VyJywgLy8gXHU1RkM1XHU5ODdCXHU1NDJGXHU3NTI4XHVGRjFBdGVyc2VyT3B0aW9uc1x1OTE0RFx1N0Y2RVx1NjI0RFx1NEYxQVx1NjcwOVx1NjU0OFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBjaHVua0ZpbGVOYW1lczogYHN0YXRpYy9zcmMvanMvW25hbWVdLmpzYCxcbiAgICAgICAgICAgICAgICBlbnRyeUZpbGVOYW1lczogYHN0YXRpYy9zcmMvanMvW25hbWVdLmpzYCxcbiAgICAgICAgICAgICAgICBhc3NldEZpbGVOYW1lczogYHN0YXRpYy9zcmMvY3NzL1tuYW1lXS5bZXh0XWAsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgICAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgICAgICAgICAgLy8gXHU3NTFGXHU0RUE3XHU3M0FGXHU1ODgzXHU2NUY2XHU3OUZCXHU5NjY0Y29uc29sZS5sb2dcdThDMDNcdThCRDVcdTRFRTNcdTc4MDFcbiAgICAgICAgICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwNzAnLCAvLyBcdTVCOUVcdTk2NDVcdThCRjdcdTZDNDJcdTU3MzBcdTU3NDBcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sIFwiXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9XG5cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlSLFNBQVEsb0JBQW1CO0FBQzVTLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixTQUFRLDJCQUEwQjtBQUNsQyxTQUFTLGNBQWM7QUFFdkIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsSUFBSTtBQUFBLElBQ0osV0FBVztBQUFBLE1BQ1AsV0FBVyxDQUFDLG9CQUFvQixDQUFDO0FBQUEsSUFDckMsQ0FBQztBQUFBLElBQ0QsV0FBVztBQUFBLE1BQ1AsV0FBVyxDQUFDLG9CQUFvQixDQUFDO0FBQUEsSUFDckMsQ0FBQztBQUFBLElBQ0QsT0FBTztBQUFBLEVBQ1g7QUFBQSxFQUNBLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFVBQVU7QUFBQSxJQUNWLHVCQUF1QjtBQUFBLElBQ3ZCLFFBQVE7QUFBQTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ1gsUUFBUTtBQUFBLFFBQ0osZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDcEI7QUFBQSxJQUNKO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDWCxVQUFVO0FBQUE7QUFBQSxRQUVOLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxNQUNuQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDSixPQUFPO0FBQUEsTUFDSCxRQUFRO0FBQUEsUUFDSixRQUFRO0FBQUE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxNQUNoRDtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBRUosQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
