/*
 * @Author: Chan
 * @Date: 2026-07-15 15:32:32
 * @LastEditors: chan
 * @LastEditTime: 2026-08-24 09:33:18
 * @FilePath: /school-uniform-platform/apps/admin-web/vite.config.ts
 * @Description:
 *
 */
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const labelIconSourceRoot = fileURLToPath(
  new URL('./src/assets/label-icons', import.meta.url),
)

interface DiscoveredLabelIcon {
  categoryKey: string
  filename: string
  sourcePath: string
  url: string
}

function discoverLabelIcons(): DiscoveredLabelIcon[] {
  return readdirSync(labelIconSourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((categoryDirectory) => {
      const categoryPath = join(labelIconSourceRoot, categoryDirectory.name)

      return readdirSync(categoryPath, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isFile() && entry.name.toLowerCase().endsWith('.png'),
        )
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((file) => {
          const sourcePath = join(categoryPath, file.name)
          const version = createHash('sha256')
            .update(readFileSync(sourcePath))
            .digest('hex')
            .slice(0, 12)

          return {
            categoryKey: categoryDirectory.name,
            filename: file.name,
            sourcePath,
            url:
              `/label-icons/${encodeURIComponent(categoryDirectory.name)}` +
              `/${encodeURIComponent(file.name)}?v=${version}`,
          }
        })
    })
}

const discoveredLabelIcons = discoverLabelIcons()

function copyLabelIconsPlugin(): Plugin {
  let outputRoot = ''

  return {
    name: 'copy-label-icons',
    apply: 'build',
    configResolved(config) {
      outputRoot = resolve(config.root, config.build.outDir, 'label-icons')
    },
    writeBundle() {
      for (const icon of discoveredLabelIcons) {
        const categoryOutput = join(outputRoot, icon.categoryKey)
        mkdirSync(categoryOutput, { recursive: true })
        copyFileSync(icon.sourcePath, join(categoryOutput, icon.filename))
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('../..', import.meta.url))
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    publicDir: fileURLToPath(new URL('./src/assets', import.meta.url)),
    define: {
      __LABEL_ICON_MANIFEST__: JSON.stringify(
        discoveredLabelIcons.map(({ categoryKey, filename, url }) => ({
          categoryKey,
          filename,
          url,
        })),
      ),
    },
    plugins: [
      copyLabelIconsPlugin(),
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
      copyPublicDir: false,
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
