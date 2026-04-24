import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin() // 恢复默认行为，让它自动外部化 dependencies
    ],
    build: {
      rollupOptions: {
        external: ['sqlite3', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe']
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
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: resolve('src/renderer/src/auto-imports.d.ts'),
        eslintrc: {
          enabled: true,
          filepath: resolve('src/renderer/src/.eslintrc-auto-import.json'),
          globalsPropValue: true
        }
      })
    ],
    server: {
      port: 3000
    }
  }
})
