<script setup>
import { computed } from 'vue'

const props = defineProps({
  locale: { type: String, required: true },
})

const base = import.meta.env.BASE_URL
function asset(p) {
  return `${base}Data/kdleds/template/${p}`
}

/** 页脚顶部认证 / 资质横幅（原站 rz.jpg，中英文共用） */
const certBannerSrc = computed(() => `${base}Data/kdleds/upload/image/rz.jpg`)

const qrSrc = computed(() =>
  props.locale === 'cn' ? asset('cn/kf/qr.png') : asset('en/kf/qr.png'),
)

const qrCaption = computed(() => (props.locale === 'cn' ? '扫描关注我们' : 'Scan attention'))

const columns = computed(() =>
  props.locale === 'cn'
    ? [
        {
          title: '关于我们',
          links: [
            { to: '/cn/company-profile.html', label: '公司简介' },
            { to: '/cn/corporate-culture.html', label: '企业文化' },
            { to: '/cn/qualification-certification.html', label: '资质认证' },
          ],
        },
        {
          title: '产品展示',
          links: [
            { to: '/cn/led-solar-street-light.html', label: 'LED工矿灯' },
            { to: '/cn/solar-street-lamp_55979.html', label: 'LED太阳能灯具' },
            { to: '/cn/led%E5%A2%99%E8%A7%92%E7%81%AF_81053.html', label: 'LED墙角灯' },
            { to: '/cn/led%E8%B7%AF%E7%81%AF_65818.html', label: 'LED路灯' },
            { to: '/cn/led%E6%8A%95%E5%85%89%E7%81%AF.html', label: 'LED投光灯' },
          ],
        },
        {
          title: '工程案例',
          links: [{ to: '/cn/solar-street-lamp.html', label: 'LED Solar Light' }],
        },
        {
          title: '新闻中心',
          links: [
            { to: '/cn/company-news.html', label: '公司新闻' },
            { to: '/cn/industry-news.html', label: '行业新闻' },
          ],
        },
        {
          title: '联系我们',
          links: [
            { to: '/cn/contact-information.html', label: '联系方式' },
            { to: '/cn/map.html', label: '电子地图' },
          ],
        },
      ]
    : [
        {
          title: 'About Us',
          links: [
            { to: '/company-profile.html', label: 'Profile' },
            { to: '/corporate-culture.html', label: 'Culture' },
            { to: '/qualification-certification.html', label: 'Certification' },
          ],
        },
        {
          title: 'Products',
          links: [
            { to: '/led-solar-street-light.html', label: 'LED High Bay Light' },
            { to: '/solar-street-lamp_55979.html', label: 'LED Solar Light' },
            { to: '/led%E5%A2%99%E8%A7%92%E7%81%AF_81053.html', label: 'LED Wall Pack' },
            { to: '/led%E8%B7%AF%E7%81%AF_65818.html', label: 'LED Street Light' },
            { to: '/led%E6%8A%95%E5%85%89%E7%81%AF.html', label: 'LED floodlight' },
          ],
        },
        {
          title: 'Cases',
          links: [{ to: '/solar-street-lamp.html', label: 'LED Solar Light' }],
        },
        {
          title: 'News',
          links: [
            { to: '/company-news.html', label: 'Company News' },
            { to: '/industry-news.html', label: 'Industry News' },
          ],
        },
        {
          title: 'Contact Us',
          links: [
            { to: '/contact-information.html', label: 'Contact Info' },
            { to: '/map.html', label: 'Map' },
          ],
        },
      ],
)
</script>

<template>
  <footer id="footer" class="kd-site-footer">
    <div class="kd-foot-cert-wrap">
      <div class="kd-foot-cert-inner">
        <img
          class="kd-foot-cert-img"
          :src="certBannerSrc"
          alt="ETL, DLC, CE, RoHS, FCC, ISO9001, Energy Star and design patents"
          decoding="async"
        />
      </div>
    </div>

    <div class="kd-foot-nav-wrap">
      <div class="kd-foot-nav-inner">
        <div class="kd-foot-qr">
          <img :src="qrSrc" width="100" height="100" alt="" decoding="async" />
          <p class="kd-foot-qr-cap">{{ qrCaption }}</p>
        </div>
        <div class="kd-foot-cols kd-clearfix">
          <div v-for="col in columns" :key="col.title" class="kd-foot-col">
            <h4>{{ col.title }}</h4>
            <ul>
              <li v-for="item in col.links" :key="item.to">
                <router-link :to="item.to" class="kd-foot-link">{{ item.label }}</router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="kd-foot-gap" aria-hidden="true"></div> -->

    <div class="kd-foot-copy-wrap">
      <div class="kd-foot-copy-inner">
        Tel：0755-29188209 &nbsp; Fax：0755-29610599<br />
        All rights reserved © 2017 SHENZHEN ODILE TECHNOLOGY CO.,LTD.
      </div>
    </div>
  </footer>
</template>

<style scoped>
.kd-site-footer {
  width: 100%;
  margin-top: 0;
}

.kd-foot-cert-wrap {
  width: 100%;
  background-color: #eeeeee;
}

.kd-foot-cert-inner {
  width: 1200px;
  max-width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  text-align: center;
}

.kd-foot-cert-img {
  display: inline-block;
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}

.kd-foot-nav-wrap {
  background-color: #282828;
  padding: 40px 0 24px;
}

.kd-foot-nav-inner {
  width: 1200px;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.kd-foot-qr {
  width: 160px;
  flex-shrink: 0;
  text-align: center;
}

.kd-foot-qr img {
  display: block;
  margin: 0 auto;
}

.kd-foot-qr-cap {
  margin: 12px 0 0;
  font-size: 12px;
  color: #999999;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 24px;
}

.kd-foot-cols {
  flex: 1;
  min-width: 0;
}

.kd-clearfix::after {
  content: '';
  display: table;
  clear: both;
}

.kd-foot-col {
  width: 160px;
  float: left;
  text-align: left;
}

.kd-foot-col h4 {
  margin: 0;
  padding: 0;
  width: 160px;
  color: #ffffff;
  font-size: 16px;
  font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
  height: 40px;
  line-height: 40px;
  font-weight: normal;
}

.kd-foot-col ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.kd-foot-col li {
  line-height: 30px;
}

.kd-foot-link {
  font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: #cccccc;
  text-decoration: none;
  line-height: 24px;
}

.kd-foot-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

.kd-foot-gap {
  height: 28px;
  background: #ffffff;
}

.kd-foot-copy-wrap {
  background-color: #333333;
  padding: 22px 16px 26px;
}

.kd-foot-copy-inner {
  width: 1200px;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  font-size: 12px;
  color: #cccccc;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 22px;
}

@media (max-width: 1220px) {
  .kd-foot-nav-inner {
    flex-direction: column;
    align-items: center;
  }

  .kd-foot-cols {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 16px;
  }

  .kd-foot-col {
    float: none;
    width: auto;
    min-width: 140px;
  }

  .kd-foot-col h4 {
    width: auto;
  }
}
</style>
