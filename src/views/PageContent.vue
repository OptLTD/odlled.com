<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StructuredLegacyPage from '../components/StructuredLegacyPage.vue'
import { prepareLegacyHtml } from '../utils/legacySitePage'
import { encodeFilenameForPublicUrl, fetchJson } from '../utils/publicStaticFetch.js'

const route = useRoute()
const router = useRouter()
const manifest = ref(null)
const loadError = ref(null)
const payload = ref({ title: '', html: '' })

const locale = computed(() => (route.path.startsWith('/cn') ? 'cn' : 'en'))

const pageModel = computed(() => prepareLegacyHtml(payload.value?.html ?? '', locale.value))

/** 与 routes.json 中键一致，例如 products.html?page=2（仅 page>1 带后缀） */
function paginationSuffix(query) {
  const raw = query.page
  if (raw == null || raw === '') return ''
  const s = Array.isArray(raw) ? raw[0] : String(raw)
  const n = Number.parseInt(s, 10)
  if (!Number.isFinite(n) || n <= 1) return ''
  return `?page=${n}`
}

const routeKey = computed(() => {
  const p = route.path
  const suffix = paginationSuffix(route.query)
  if (locale.value === 'en') {
    if (p === '/') return `index${suffix}`
    const rest = p.startsWith('/') ? p.slice(1) : p
    return `${rest}${suffix}`
  }
  if (p === '/cn' || p === '/cn/') return `index${suffix}`
  const rest = p.startsWith('/cn/') ? p.slice('/cn/'.length) : ''
  return `${rest || 'index'}${suffix}`
})

async function loadManifest() {
  if (manifest.value) return
  const url = `${import.meta.env.BASE_URL}site/routes.json`
  manifest.value = await fetchJson(url)
}

/**
 * routes.json 的键多为百分号编码（如 led%E5%A2%99…）。
 * Vue Router 的 path 可能是解码后的 Unicode，也可能是仍带 % 的形式。
 * 绝不能对已含 % 的 key 再 encodeURIComponent，否则 % → %25，匹配失败。
 */
function resolveManifestFile(bucket, key) {
  if (!key) return undefined
  if (bucket[key]) return bucket[key]

  let decoded = key
  try {
    decoded = decodeURIComponent(key)
  } catch {
    /* keep key */
  }
  if (decoded !== key && bucket[decoded]) return bucket[decoded]

  try {
    const encoded = encodeURIComponent(decoded)
    if (bucket[encoded]) return bucket[encoded]
  } catch {
    /* ignore */
  }

  return undefined
}

async function loadPage() {
  loadError.value = null
  try {
    await loadManifest()
    const bucket = locale.value === 'cn' ? manifest.value.cn : manifest.value.en
    const file = resolveManifestFile(bucket, routeKey.value)
    if (!file) {
      loadError.value = `No cached content for route key “${routeKey.value}”.`
      payload.value = {
        title: 'Not found',
        html: `<div class="kd-placeholder"><p>${loadError.value}</p></div>`,
      }
      return
    }
    const pageUrl = `${import.meta.env.BASE_URL}site/${locale.value}/${encodeFilenameForPublicUrl(file)}`
    payload.value = await fetchJson(pageUrl)
    if (payload.value.title) {
      document.title = payload.value.title
    }
  } catch (e) {
    loadError.value = String(e.message || e)
    payload.value = {
      title: 'Error',
      html: `<div class="kd-placeholder"><p>${loadError.value}</p></div>`,
    }
  }
}

/** 正文区内原生 <a> 走 Vue Router，避免整页刷新且修正站内路径 */
function onInAppLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = e.target.closest?.('a[href]')
  if (!a) return
  if (a.getAttribute('target') === '_blank') return
  let href = a.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return
  if (/^https?:\/\/(www\.)?kdleds\.cn/i.test(href)) {
    try {
      const u = new URL(href)
      href = `${u.pathname}${u.search}${u.hash}`
    } catch {
      return
    }
  } else if (/^https?:\/\//i.test(href)) {
    return
  }

  let url
  try {
    url = new URL(href, window.location.origin)
  } catch {
    return
  }
  if (url.origin !== window.location.origin) return

  const path = `${url.pathname}${url.search}${url.hash}`
  if (path === route.fullPath) {
    e.preventDefault()
    return
  }
  e.preventDefault()
  router.push(path)
}

watch(
  () => route.fullPath,
  () => {
    globalThis.kdTeardownLegacyWidgets?.()
  },
)

watch(
  () => [route.fullPath, locale.value],
  () => {
    loadPage()
  },
  { immediate: true },
)

watch(
  () => payload.value.html,
  async () => {
    await nextTick()
    await nextTick()
    globalThis.kdInitLegacyWidgets?.()
  },
)
</script>

<template>
  <div class="kd-page-root" @click.capture="onInAppLinkClick">
    <div v-if="loadError && !payload.html" class="kd-placeholder">
      <p>{{ loadError }}</p>
    </div>
    <StructuredLegacyPage
      v-else-if="pageModel.structured"
      :locale="locale"
      :hero-html="pageModel.structured.heroHtml"
      :breadcrumbs="pageModel.structured.breadcrumbs"
      :section-title="pageModel.structured.sectionTitle"
      :sidebar-tabs="pageModel.structured.sidebarTabs"
      :main-html="pageModel.structured.mainHtml"
      :suffix-html="pageModel.structured.suffixHtml"
    />
    <div v-else class="kd-page-html" v-html="pageModel.fallbackHtml"></div>
  </div>
</template>

<style>
.kd-placeholder {
  max-width: 960px;
  margin: 2rem auto;
  padding: 1rem 1.25rem;
  border: 1px solid #e5e5e5;
  background: #fafafa;
}
.kd-page-html {
  width: 100%;
}
</style>
