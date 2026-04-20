import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['qiniu', 'axios'] // 恢复只 exclude 主包
      })
    ],
    build: {
      rollupOptions: {
        external: ['sqlite3']
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    server: {
      port: 3000
    }
  }
})
