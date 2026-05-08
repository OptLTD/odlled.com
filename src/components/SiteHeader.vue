<script setup>
defineProps({
  locale: { type: String, required: true },
})

const base = import.meta.env.BASE_URL
function tpl(path) {
  return `${base}Data/kdleds/template/${path}`
}

const enNav = [
  { label: 'Home', to: '/' },
  {
    label: 'About Us',
    to: '/about.html',
    children: [
      { label: 'Profile', to: '/company-profile.html' },
      { label: 'Culture', to: '/corporate-culture.html' },
      { label: 'Certification', to: '/qualification-certification.html' },
    ],
  },
  {
    label: 'Products',
    to: '/products.html',
    children: [
      { label: 'LED High Bay Light', to: '/led-solar-street-light.html' },
      { label: 'LED Solar Light', to: '/solar-street-lamp_55979.html' },
      { label: 'LED Wall Pack', to: '/led%E5%A2%99%E8%A7%92%E7%81%AF_81053.html' },
      { label: 'LED Street Light', to: '/led%E8%B7%AF%E7%81%AF_65818.html' },
      { label: 'LED floodlight', to: '/led%E6%8A%95%E5%85%89%E7%81%AF.html' },
      { label: 'LED Canopy Light', to: '/led%E6%B2%B9%E7%AB%99%E7%81%AF_56352.html' },
      { label: 'LED Linear Light', to: '/led%E7%BA%BF%E6%9D%A1%E7%81%AF.html' },
    ],
  },
  { label: 'Cases', to: '/cases.html' },
  {
    label: 'News',
    to: '/news.html',
    children: [
      { label: 'Company News', to: '/company-news.html' },
      { label: 'Industry News', to: '/industry-news.html' },
    ],
  },
  {
    label: 'Contact Us',
    to: '/contact.html',
    children: [
      { label: 'Contact Info', to: '/contact-information.html' },
      { label: 'Map', to: '/map.html' },
    ],
  },
]

const cnNav = [
  { label: '首页', to: '/cn/' },
  {
    label: '关于我们',
    to: '/cn/about.html',
    children: [
      { label: '公司简介', to: '/cn/company-profile.html' },
      { label: '企业文化', to: '/cn/corporate-culture.html' },
      { label: '资质认证', to: '/cn/qualification-certification.html' },
    ],
  },
  {
    label: '产品展示',
    to: '/cn/products.html',
    children: [
      { label: 'LED工矿灯', to: '/cn/led-solar-street-light.html' },
      { label: 'LED太阳能灯具', to: '/cn/solar-street-lamp_55979.html' },
      { label: 'LED墙角灯', to: '/cn/led%E5%A2%99%E8%A7%92%E7%81%AF_81053.html' },
      { label: 'LED路灯', to: '/cn/led%E8%B7%AF%E7%81%AF_65818.html' },
      { label: 'LED投光灯', to: '/cn/led%E6%8A%95%E5%85%89%E7%81%AF.html' },
      { label: 'LED油站灯', to: '/cn/led%E6%B2%B9%E7%AB%99%E7%81%AF_56352.html' },
      { label: 'LED线条灯', to: '/cn/led%E7%BA%BF%E6%9D%A1%E7%81%AF.html' },
    ],
  },
  { label: '工程案例', to: '/cn/cases.html' },
  {
    label: '新闻中心',
    to: '/cn/news.html',
    children: [
      { label: '公司新闻', to: '/cn/company-news.html' },
      { label: '行业新闻', to: '/cn/industry-news.html' },
    ],
  },
  {
    label: '联系我们',
    to: '/cn/contact.html',
    children: [
      { label: '联系方式', to: '/cn/contact-information.html' },
      { label: '电子地图', to: '/cn/map.html' },
    ],
  },
]

const nav = (locale) => (locale === 'cn' ? cnNav : enNav)
</script>

<template>
  <div class="top">
    <table width="1200" border="0" cellspacing="0" cellpadding="0" align="center">
      <tr>
        <td width="140" height="105" align="left" valign="middle">
          <router-link :to="locale === 'cn' ? '/cn/' : '/'">
            <img
              v-if="locale === 'cn'"
              :src="tpl('cn/images/logo.png')"
              height="85"
              alt="欧迪氻"
            />
            <img
              v-else
              :src="tpl('en/images/logo.png')"
              height="85"
              alt="ODILE"
            />
          </router-link>
        </td>
        <td width="720">
          <div id="header">
            <ul id="menu">
              <li id="first"></li>
              <li v-for="(item, idx) in nav(locale)" :key="idx">
                <router-link :to="item.to" active-class="on">{{ item.label }}</router-link>
                <ul v-if="item.children?.length">
                  <li v-for="sub in item.children" :key="sub.to">
                    <router-link :to="sub.to">{{ sub.label }}</router-link>
                  </li>
                </ul>
              </li>
              <li id="end"></li>
            </ul>
          </div>
        </td>
        <td width="20"></td>
        <td width="250">
          <div class="ss">
            <form :action="locale === 'cn' ? '/cn/products.html' : '/products.html'" method="get">
              <input type="text" name="keyword" :placeholder="locale === 'cn' ? '输入关键词' : 'Enter keyword'" />
              <button type="submit" class="kd-search-submit" aria-label="Search" />
            </form>
          </div>
        </td>
        <td width="70" valign="middle">
          <router-link v-if="locale === 'en'" to="/cn/">
            <img :src="tpl('en/images/ywen.jpg')" width="70" height="40" alt="中文" />
          </router-link>
          <router-link v-else to="/">
            <img :src="tpl('cn/images/ywen.jpg')" width="70" height="40" alt="English" />
          </router-link>
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
.kd-search-submit {
  border: none;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  background: transparent;
}
</style>

<style>
/* 补齐下拉：dh/style.css 仅隐藏子菜单，原站另有脚本；此处用悬停展开 */
#menu li:hover > ul,
#menu li:focus-within > ul {
  display: block !important;
}

#menu li > ul {
  z-index: 200;
}
</style>
