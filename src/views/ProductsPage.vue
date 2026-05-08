<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const base = import.meta.env.BASE_URL

const locale = computed(() => (route.path.startsWith('/cn') ? 'cn' : 'en'))

const basePath = computed(() => (locale.value === 'cn' ? '/cn/products.html' : '/products.html'))

const catalog = ref(null)
const loadError = ref(null)

async function loadCatalog() {
  loadError.value = null
  try {
    const res = await fetch(`${base}site/${locale.value}/products-catalog.json`)
    if (!res.ok) throw new Error(String(res.status))
    catalog.value = await res.json()
  } catch (e) {
    loadError.value = String(e.message || e)
    catalog.value = null
  }
}

watch(
  () => locale.value,
  () => {
    loadCatalog()
  },
  { immediate: true },
)

const strings = computed(() =>
  locale.value === 'cn'
    ? {
        home: '网站首页',
        list: '产品展示',
        total: (n) => `共 ${n} 条`,
        prev: '上一页',
        next: '下一页',
        empty: '没有符合条件的产品',
        title: '产品展示-深圳市欧迪氻科技有限公司',
      }
    : {
        home: 'Home',
        list: 'Products',
        total: (n) => `Total ${n} record`,
        prev: 'Prev',
        next: 'Next',
        empty: 'No products match your filters.',
        title: 'Products-深圳市欧迪氻科技有限公司',
      },
)

watch(
  () => strings.value.title,
  (t) => {
    document.title = t
  },
  { immediate: true },
)

function pathsEqual(a, b) {
  if (!a || !b) return false
  try {
    return decodeURIComponent(a) === decodeURIComponent(b)
  } catch {
    return a === b
  }
}

/** page≤1 不写 page；cat 为 null/'' 不写 cat（用于「全部」） */
function buildQuery({ page = 1, cat } = {}) {
  const q = {}
  const kwRaw = route.query.keyword
  const kw =
    kwRaw == null ? '' : String(Array.isArray(kwRaw) ? kwRaw[0] : kwRaw).trim()
  if (kw !== '') q.keyword = kw
  if (cat != null && cat !== '') q.cat = cat
  if (page > 1) q.page = page
  return q
}

const keyword = computed(() => {
  const k = route.query.keyword
  if (k == null) return ''
  return String(Array.isArray(k) ? k[0] : k)
    .trim()
    .toLowerCase()
})

const activeCategoryHref = computed(() => {
  const c = route.query.cat
  if (c == null || c === '') return null
  return Array.isArray(c) ? String(c[0]) : String(c)
})

const filteredProducts = computed(() => {
  if (!catalog.value?.products) return []
  let list = catalog.value.products
  const kw = keyword.value
  if (kw) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        (p.summary && p.summary.toLowerCase().includes(kw)),
    )
  }
  const cat = activeCategoryHref.value
  if (cat) {
    list = list.filter((p) => p.categoryHref && pathsEqual(p.categoryHref, cat))
  }
  return list
})

const pageSize = computed(() => catalog.value?.pageSize ?? 12)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / pageSize.value)),
)

const currentPage = computed(() => {
  const raw = Number.parseInt(String(route.query.page ?? '1'), 10)
  const p = Number.isFinite(raw) && raw >= 1 ? raw : 1
  return Math.min(p, totalPages.value)
})

const pageRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProducts.value.slice(start, start + pageSize.value)
})

function pageQuery(pageNum) {
  return buildQuery({
    page: pageNum,
    cat: activeCategoryHref.value,
  })
}

function categoryQuery(href) {
  return buildQuery({ page: 1, cat: href })
}

function allQuery() {
  return buildQuery({ page: 1, cat: null })
}

watchEffect(() => {
  if (!catalog.value) return
  const tp = totalPages.value
  const raw = Number.parseInt(String(route.query.page ?? '1'), 10)
  const want = Number.isFinite(raw) && raw >= 1 ? raw : 1
  if (want > tp && tp >= 1 && route.path.endsWith('products.html')) {
    router.replace({ path: basePath.value, query: pageQuery(tp) })
  }
})

function isCategoryOn(href) {
  return activeCategoryHref.value && pathsEqual(activeCategoryHref.value, href)
}
</script>

<template>
  <div v-if="loadError" class="kd-placeholder">
    <p>{{ loadError }}</p>
    <p class="kd-muted">运行 <code>node scripts/build-products-catalog.mjs</code> 生成目录数据。</p>
  </div>

  <div v-else-if="catalog" class="kd-products">
    <div
      class="kd-products-hero"
      :style="{
        backgroundImage: `url('${base}Data/kdleds/upload/image/b4.jpg')`,
      }"
    >
      <div class="kd-products-hero-inner" />
    </div>

    <div class="cont">
      <div class="rti31">
        <div class="rtx41">
          <router-link :to="locale === 'cn' ? '/cn/' : '/'" class="r3">{{ strings.home }}</router-link>
          &gt;
          <router-link :to="basePath" class="r3">{{ strings.list }}</router-link>
        </div>
      </div>
      <div class="rti32">
        <div class="rtx42">{{ strings.list }}</div>
      </div>

      <div class="rti322">
        <div class="w">
          <router-link :to="{ path: basePath, query: allQuery() }" :class="{ on: !activeCategoryHref }">{{
            locale === 'cn' ? '全部' : 'All'
          }}</router-link>
        </div>
        <div v-for="(c, idx) in catalog.categories" :key="idx" class="w">
          <router-link
            :to="{ path: basePath, query: categoryQuery(c.href) }"
            :class="{ on: isCategoryOn(c.href) }"
            >{{ c.label }}</router-link
          >
        </div>
      </div>

      <div class="rcontnn">
        <template v-if="pageRows.length">
          <template v-for="(row, i) in pageRows" :key="row.href + i">
            <div class="prowai7">
              <div class="pro7">
                <router-link :to="row.href">
                  <img class="kd-pro-img" :src="row.image" :alt="row.title" width="300" height="225" decoding="async" />
                </router-link>
              </div>
              <div class="protext7">
                <router-link :to="row.href" class="r11">{{ row.title }}</router-link>
                <pre style="white-space: pre-wrap; word-wrap: break-word">{{ row.summary }}</pre>
              </div>
            </div>
            <div class="genew">
              <img :src="`${base}Data/kdleds/template/${locale}/images/ge.jpg`" width="1200" height="10" alt="" />
            </div>
          </template>
        </template>
        <div v-else class="kd-products-empty">{{ strings.empty }}</div>

        <div id="badoopager">
          <span class="disabled">{{ strings.total(filteredProducts.length) }}</span>
          <template v-if="currentPage <= 1">
            <span class="disabled">{{ strings.prev }}</span>
          </template>
          <router-link v-else :to="{ path: basePath, query: pageQuery(currentPage - 1) }">{{ strings.prev }}</router-link>

          <template v-for="n in totalPages" :key="'p' + n">
            <span v-if="n === currentPage" class="current">{{ n }}</span>
            <router-link v-else :to="{ path: basePath, query: pageQuery(n) }">{{ n }}</router-link>
          </template>

          <template v-if="currentPage >= totalPages">
            <span class="disabled">{{ strings.next }}</span>
          </template>
          <router-link v-else :to="{ path: basePath, query: pageQuery(currentPage + 1) }">{{ strings.next }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kd-placeholder {
  max-width: 960px;
  margin: 2rem auto;
  padding: 1rem 1.25rem;
  border: 1px solid #e5e5e5;
  background: #fafafa;
}
.kd-muted {
  margin-top: 0.75rem;
  color: #666;
  font-size: 13px;
}
.kd-products-hero {
  width: 100%;
  height: 250px;
  background: center top no-repeat;
  margin-bottom: 20px;
}
.kd-products-hero-inner {
  width: 1200px;
  height: 250px;
  margin: 0 auto;
}
.kd-products-empty {
  padding: 48px 16px;
  text-align: center;
  color: #666;
}

.kd-pro-img {
  border: 0;
  vertical-align: top;
}
</style>

<style>
div#badoopager {
  margin: 24px auto 40px;
  text-align: center;
  font-size: 12px;
  clear: both;
}
div#badoopager span.current {
  border-right: #ff6d06 2px solid;
  padding-right: 5px;
  border-top: #ff6d06 2px solid;
  padding-left: 5px;
  font-weight: bold;
  padding-bottom: 2px;
  border-left: #ff6d06 2px solid;
  color: #fff;
  padding-top: 2px;
  border-bottom: #ff6d06 2px solid;
  background-color: #ff6c16;
}
div#badoopager a.disabled,
div#badoopager span.disabled {
  color: #999;
  pointer-events: none;
}
div#badoopager a {
  margin: 0 4px;
}
</style>
