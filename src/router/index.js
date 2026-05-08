import { createRouter, createWebHistory } from 'vue-router'
import SiteLayout from '../layouts/SiteLayout.vue'
import PageContent from '../views/PageContent.vue'
import ProductsPage from '../views/ProductsPage.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: SiteLayout,
      children: [
        {
          path: '',
          component: PageContent,
        },
        {
          path: 'cn',
          redirect: '/cn/',
        },
        {
          path: 'cn/',
          component: PageContent,
        },
        {
          path: 'cn/products.html',
          component: ProductsPage,
        },
        {
          path: 'cn/:pathMatch(.*)*',
          component: PageContent,
        },
        {
          path: 'products.html',
          component: ProductsPage,
        },
        {
          path: ':pathMatch(.*)*',
          component: PageContent,
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
