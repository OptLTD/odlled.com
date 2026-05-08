/**
 * 从已抓取的 products 分页 HTML + 各详情页面包屑生成 products-catalog.json，
 * 供前端列表、搜索、分页、分类筛选使用。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SITE = path.join(ROOT, 'public', 'site')

const LIST_FILES = ['products.html.json', 'products.html__p2.json', 'products.html__p3.json']

function extractProductsFromHtml(html) {
  const $ = cheerio.load(html)
  const out = []
  $('.prowai7').each((_, el) => {
    const root = $(el)
    const a = root.find('.protext7 a.r11').first()
    const href = a.attr('href')?.trim()
    if (!href) return
    const title = a.text().trim()
    const img = root.find('.pro7 img').first().attr('src') || ''
    const summary = root.find('.protext7 pre').first().text().trim()
    out.push({ href, title, image: img, summary })
  })
  return out
}

function extractCategoriesFromListNav(html) {
  const $ = cheerio.load(html)
  const out = []
  $('.rti322 .w a').each((_, el) => {
    const href = $(el).attr('href')?.trim()
    const label = $(el).text().trim()
    if (href && label) out.push({ href, label })
  })
  return out
}

function extractCategoryFromDetail(html, locale) {
  const re =
    locale === 'cn'
      ? /href="\/cn\/products\.html"[^>]*>[^<]*<\/a>\s*&gt;\s*<a href="([^"]+)" class="r3"/
      : /href="\/products\.html"[^>]*>[^<]*<\/a>\s*&gt;\s*<a href="([^"]+)" class="r3"/
  const m = html.match(re)
  return m ? m[1] : null
}

function routeKeyToHref(routeKey, locale) {
  if (routeKey === 'index') return locale === 'cn' ? '/cn/' : '/'
  const q = routeKey.indexOf('?')
  const key = q >= 0 ? routeKey.slice(0, q) : routeKey
  return locale === 'cn' ? `/cn/${key}` : `/${key}`
}

async function buildLocale(locale) {
  const routesPath = path.join(SITE, 'routes.json')
  const routes = JSON.parse(await fs.readFile(routesPath, 'utf8'))
  const bucket = locale === 'cn' ? routes.cn : routes.en

  const hrefToCategory = {}
  for (const [routeKey, file] of Object.entries(bucket)) {
    if (routeKey.startsWith('products.html')) continue
    const fp = path.join(SITE, locale, file)
    let raw
    try {
      raw = await fs.readFile(fp, 'utf8')
    } catch {
      continue
    }
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      continue
    }
    const html = data.html
    if (!html) continue
    const cat = extractCategoryFromDetail(html, locale)
    if (!cat) continue
    const productHref = routeKeyToHref(routeKey, locale)
    hrefToCategory[productHref] = cat
  }

  const seen = new Set()
  const products = []
  for (const lf of LIST_FILES) {
    const fp = path.join(SITE, locale, lf)
    let j
    try {
      j = JSON.parse(await fs.readFile(fp, 'utf8'))
    } catch {
      continue
    }
    const rows = extractProductsFromHtml(j.html)
    for (const row of rows) {
      if (seen.has(row.href)) continue
      seen.add(row.href)
      products.push({
        ...row,
        categoryHref: hrefToCategory[row.href] ?? null,
      })
    }
  }

  let categories = []
  try {
    const mainList = JSON.parse(
      await fs.readFile(path.join(SITE, locale, 'products.html.json'), 'utf8'),
    )
    categories = extractCategoriesFromListNav(mainList.html)
  } catch {
    /* ignore */
  }

  const catalog = {
    pageSize: 12,
    categories,
    products,
  }

  const outPath = path.join(SITE, locale, 'products-catalog.json')
  await fs.writeFile(outPath, `${JSON.stringify(catalog)}\n`, 'utf8')
  const assigned = products.filter((p) => p.categoryHref).length
  console.log(
    `[products-catalog] ${locale}: ${products.length} products, ${categories.length} categories, ${assigned} with category`,
  )
}

await buildLocale('en')
await buildLocale('cn')
