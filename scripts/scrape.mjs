import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'site')
const ORIGIN = 'http://www.kdleds.cn'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function normalizePath(pathname) {
  let p = pathname || '/'
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

function toFileKey(pathname, searchParams, locale) {
  const p = normalizePath(pathname)
  let stem
  if (locale === 'en') {
    stem = p === '/' ? 'index' : p.slice(1)
  } else {
    const cn = p.replace(/^\/cn/, '') || '/'
    stem = cn === '/' ? 'index' : cn.slice(1)
  }
  const page = searchParams.get('page')
  if (page && page !== '1') {
    return `${stem}__p${page}.json`
  }
  return `${stem}.json`
}

function toRouteKey(pathname, searchParams, locale) {
  const p = normalizePath(pathname)
  let stem
  if (locale === 'en') {
    stem = p === '/' ? 'index' : p.slice(1)
  } else {
    const cn = p.replace(/^\/cn/, '') || '/'
    stem = cn === '/' ? 'index' : cn.slice(1)
  }
  const page = searchParams.get('page')
  if (page && page !== '1') {
    return `${stem}?page=${page}`
  }
  return stem
}

function rewriteLinks(html) {
  const $ = cheerio.load(html, { decodeEntities: false })

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('javascript:') || href === '#') return
    try {
      const u = new URL(href, ORIGIN + '/')
      if (u.hostname.replace(/^www\./, '') !== 'kdleds.cn') return
      const pRaw = u.pathname || '/'
      const qs = u.searchParams.toString()
      let out
      if (pRaw === '/cn' || pRaw.startsWith('/cn/')) {
        const pathOnly =
          pRaw === '/cn'
            ? '/cn/'
            : pRaw.endsWith('/')
              ? pRaw
              : pRaw
        out = qs ? `${pathOnly}?${qs}` : pathOnly
      } else if (pRaw === '/' || pRaw === '') {
        out = qs ? `/?${qs}` : '/'
      } else {
        const pathOnly = pRaw.length > 1 && pRaw.endsWith('/') ? pRaw.slice(0, -1) : pRaw
        out = qs ? `${pathOnly}?${qs}` : pathOnly
      }
      $(el).attr('href', out)
    } catch {
      /* ignore */
    }
  })

  $('img[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (!src) return
    if (src.startsWith('http://') || src.startsWith('https://')) return
    if (src.startsWith('//')) {
      $(el).attr('src', 'https:' + src)
      return
    }
    if (src.startsWith('/')) {
      $(el).attr('src', `${ORIGIN}${src}`)
    }
  })

  return $.html()
}

function stripChrome($) {
  $('script').remove()
  $('div.top').remove()
  $('.float0831').remove()
  $('#floatTools').remove()
  $('td[bgcolor="#333333"]').each((_, el) => {
    $(el).closest('tr').remove()
  })
}

function extractFragment(html) {
  const $ = cheerio.load(html)
  stripChrome($)
  return $('body').html() ?? ''
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(String(res.status))
  return res.text()
}

async function scrapeOne(locale, rel, routesBucket) {
  const u = new URL(rel, ORIGIN)
  const url = u.toString()
  const fileKey = toFileKey(u.pathname, u.searchParams, locale)
  const routeKey = toRouteKey(u.pathname, u.searchParams, locale)
  const subdir = locale === 'cn' ? 'cn' : 'en'
  const dir = path.join(OUT, subdir)
  await fs.mkdir(dir, { recursive: true })
  const outPath = path.join(dir, fileKey)

  routesBucket[routeKey] = fileKey

  let html
  try {
    html = await fetchHtml(url)
  } catch (e) {
    const title = url.includes('services') ? 'Services' : 'Page unavailable'
    const stub = {
      title,
      html: `<div class="kd-placeholder"><p>无法抓取远程页面（${String(e.message)}）。原链接：<a href="${url}" rel="noopener noreferrer">${url}</a></p></div>`,
      sourceUrl: url,
    }
    await fs.writeFile(outPath, JSON.stringify(stub), 'utf8')
    console.warn('stub', url, e.message)
    return
  }

  const $doc = cheerio.load(html)
  const title = ($doc('title').first().text() || '').trim() || url
  const fragment = rewriteLinks(extractFragment(html))

  const payload = {
    title,
    html: fragment,
    sourceUrl: url,
  }
  await fs.writeFile(outPath, JSON.stringify(payload), 'utf8')
  console.log('ok', url, '->', path.relative(ROOT, outPath))
}

async function writeManifest(routes) {
  await fs.mkdir(OUT, { recursive: true })
  await fs.writeFile(path.join(OUT, 'routes.json'), JSON.stringify(routes, null, 2), 'utf8')
}

async function main() {
  const manifest = JSON.parse(
    await fs.readFile(path.join(__dirname, 'page-paths.json'), 'utf8'),
  )
  const routes = { en: {}, cn: {} }

  for (const rel of manifest.en) {
    await scrapeOne('en', rel, routes.en)
  }

  for (const rel of manifest.cn) {
    await scrapeOne('cn', rel, routes.cn)
  }

  await writeManifest(routes)
  console.log('Wrote public/site/routes.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
