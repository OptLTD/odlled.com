<script setup>
import { useRoute } from 'vue-router'
import { normalizeHrefForRouter, pathsEqual } from '../utils/legacySitePage'

const props = defineProps({
  locale: { type: String, required: true },
  heroHtml: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
  sectionTitle: { type: String, default: '' },
  sidebarTabs: { type: Array, default: () => [] },
  mainHtml: { type: String, default: '' },
  suffixHtml: { type: String, default: '' },
})

const route = useRoute()

function toRouter(href) {
  return normalizeHrefForRouter(href, props.locale)
}

function sidebarOn(href) {
  return pathsEqual(route.path, toRouter(href))
}
</script>

<template>
  <div class="kd-structured-page">
    <div v-if="heroHtml" class="kd-structured-hero" v-html="heroHtml"></div>
    <div class="cont">
      <div class="rti31">
        <div class="rtx41">
          <template v-for="(c, i) in breadcrumbs" :key="`${c.href}-${i}`">
            <router-link :to="toRouter(c.href)" class="r3">{{ c.label }}</router-link>
            <template v-if="i < breadcrumbs.length - 1"> &gt; </template>
          </template>
        </div>
      </div>
      <div class="rti32">
        <div class="rtx42">{{ sectionTitle }}</div>
      </div>
      <div v-if="sidebarTabs.length" class="rti322">
        <div v-for="(t, ti) in sidebarTabs" :key="`${t.href}-${ti}`" class="w">
          <router-link :to="toRouter(t.href)" :class="{ on: sidebarOn(t.href) }">{{ t.label }}</router-link>
        </div>
      </div>
      <!-- mainHtml 内已含原站 .rcontnn 容器，外层不再重复以免双层 float/宽度 -->
      <div class="kd-structured-main" v-html="mainHtml"></div>
    </div>
    <div v-if="suffixHtml" class="kd-structured-suffix" v-html="suffixHtml"></div>
  </div>
</template>
