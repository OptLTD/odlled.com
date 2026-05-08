import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baiduAk = env.VITE_BAIDU_MAP_AK ?? ''

  return {
    plugins: [
      vue(),
      {
        name: 'inject-baidu-map-ak',
        transformIndexHtml(html) {
          const inject = `<script>window.__KD_BAIDU_MAP_AK__=${JSON.stringify(baiduAk)};</script>`
          return html.replace('<head>', `<head>\n    ${inject}`)
        },
      },
    ],
  }
})
