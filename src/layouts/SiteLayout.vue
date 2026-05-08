<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import FloatKefu from '../components/FloatKefu.vue'

const route = useRoute()
const locale = computed(() => (route.path.startsWith('/cn') ? 'cn' : 'en'))

const base = import.meta.env.BASE_URL
function tpl(path) {
  return `${base}Data/kdleds/template/${path}`
}

const legacyCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/css/css.css') : tpl('en/css/css.css'),
)
const legacyLeftCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/css/left.css') : tpl('en/css/left.css'),
)
const legacyDhCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/dh/style.css') : tpl('en/dh/style.css'),
)
const legacyShowCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/css/show.css') : tpl('en/css/show.css'),
)
const jslidesCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/css/jquery.jslides.css') : tpl('en/css/jquery.jslides.css'),
)
const kfCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/kf/css.css') : tpl('en/kf/css.css'),
)
const kfCommonCss = computed(() =>
  locale.value === 'cn' ? tpl('cn/kf/common.css') : tpl('en/kf/common.css'),
)
</script>

<template>
  <teleport to="head">
    <link rel="stylesheet" :href="legacyCss" />
    <link rel="stylesheet" :href="legacyLeftCss" />
    <link rel="stylesheet" :href="legacyDhCss" />
    <link rel="stylesheet" :href="legacyShowCss" />
    <link rel="stylesheet" :href="jslidesCss" />
    <link rel="stylesheet" :href="kfCss" />
    <link rel="stylesheet" :href="kfCommonCss" />
  </teleport>
  <div class="kd-shell" :class="locale === 'cn' ? 'kd-shell--cn' : 'kd-shell--en'">
    <SiteHeader :locale="locale" />
    <main class="kd-main">
      <router-view />
    </main>
    <SiteFooter :locale="locale" />
    <FloatKefu :locale="locale" />
  </div>
</template>

<style scoped>
.kd-main {
  min-height: 40vh;
}
</style>
