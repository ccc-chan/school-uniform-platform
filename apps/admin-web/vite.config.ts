/*
 * @Author: Chan
 * @Date: 2026-07-15 15:32:32
 * @LastEditors: chan
 * @LastEditTime: 2026-08-24 09:33:18
 * @FilePath: /school-uniform-platform/apps/admin-web/vite.config.ts
 * @Description:
 *
 */
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('../..', import.meta.url))
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    plugins: [
      vue(),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            'vue-router': ['createRouter', 'createWebHistory'],
          },
        ],
        dirs: ['src/composables', 'src/stores'],
        dts: 'src/auto-imports.d.ts',
        vueTemplate: true,
      }),
      Components({
        dts: 'src/components.d.ts',
        directives: true,
        resolvers: [AntDesignVueResolver({ importStyle: 'css-in-js' })],
      }),
      UnoCSS(),
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'antd-vendor': ['ant-design-vue'],
            qrcode: ['qrcode'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
  }
})
