/**
 * 1) 扫描 public/site 下全部 JSON，收集远程资源并下载到 public/
 * 2) 规范化 JSON 内 html：去 html/body 壳、strip script/link、域名改为相对路径、修正 show/ 背景图路径
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const SITE = path.join(PUBLIC, 'site')

const ORIGIN = 'http://www.kdleds.cn'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** 额外种子（首页脚本等，未必出现在 JSON 文本里） */
const EXTRA_PATHS = [
  '/Data/kdleds/upload/image/rz.jpg',
  '/Data/kdleds/template/en/js/jquery-1.8.0.min.js',
  '/Data/kdleds/template/en/js/Marquee.js',
  '/Data/kdleds/template/en/js/jquery.jslides.js',
  '/Data/kdleds/template/en/css/jquery.jslides.css',
  '/Data/kdleds/template/en/dh/lightbox.css',
  '/Data/kdleds/template/en/dh/lightbox.js',
  '/Data/kdleds/template/en/show/myScroll.js',
  '/Data/kdleds/template/en/show/l.jpg',
  '/Data/kdleds/template/en/show/r.jpg',
  '/Data/kdleds/template/en/images/dx.png',
  '/Data/kdleds/template/en/images/dx2.png',
  '/Data/kdleds/template/en/images/sbg.jpg',
  '/Data/kdleds/template/en/images/sbg2.jpg',
  '/Data/kdleds/template/en/images/sbg3.jpg',
  '/Data/kdleds/template/en/images/left.jpg',
  '/Data/kdleds/template/en/images/right.jpg',
  '/Data/kdleds/template/cn/js/jquery-1.8.0.min.js',
  '/Data/kdleds/template/cn/js/Marquee.js',
  '/Data/kdleds/template/cn/js/jquery.jslides.js',
  '/Data/kdleds/template/cn/css/jquery.jslides.css',
  '/Data/kdleds/template/cn/show/myScroll.js',
  '/Data/kdleds/template/cn/show/l.jpg',
  '/Data/kdleds/template/cn/show/r.jpg',
  '/Data/kdleds/template/cn/images/dx.png',
  '/Data/kdleds/template/cn/images/dx2.png',
  '/Data/kdleds/template/cn/images/sbg.jpg',
  '/Data/kdleds/template/cn/images/sbg2.jpg',
  '/Data/kdleds/template/cn/images/sbg3.jpg',
  '/Data/kdleds/template/cn/images/left.jpg',
  '/Data/kdleds/template/cn/images/right.jpg',
  '/Data/kdleds/template/en/images/more5.jpg',
  '/Data/kdleds/template/cn/images/more5.jpg',
  '/Data/kdleds/template/en/on/facebook.png',
  '/Data/kdleds/template/en/on/in.png',
  '/Data/kdleds/template/en/on/google.png',
  '/Data/kdleds/template/en/on/msn.png',
  '/Data/kdleds/template/en/on/youtube.png',
  '/Data/kdleds/template/en/on/twitter.png',
  '/Data/kdleds/template/en/kf/kefu.js',
  '/Data/kdleds/template/en/kf/css.css',
  '/Data/kdleds/template/en/kf/common.css',
  '/Data/kdleds/template/en/kf/float_bg.gif',
  '/Data/kdleds/template/en/kf/float_s.gif',
  '/Data/kdleds/template/en/kf/qr.png',
  '/Data/kdleds/template/en/kf/skype.jpg',
  '/Data/kdleds/template/cn/kf/kefu.js',
  '/Data/kdleds/template/cn/kf/css.css',
  '/Data/kdleds/template/cn/kf/common.css',
  '/Data/kdleds/template/cn/kf/float_bg.gif',
  '/Data/kdleds/template/cn/kf/float_s.gif',
  '/Data/kdleds/template/cn/kf/qr.png',
]

function posix(p) {
  return p.split(path.sep).join('/')
}

function collectPathsFromHtml(html) {
  const out = new Set()
  if (!html) return out

  for (const m of html.matchAll(/https?:\/\/(?:www\.)?kdleds\.cn(\/[^"'\\\s<>]*)?/gi)) {
    const p = (m[1] || '/').split(/[?#]/)[0]
    if (p) out.add(p)
  }

  for (const m of html.matchAll(/\b(?:url\()\s*["']?([^'"\s)]+)/gi)) {
    const raw = m[1].trim()
    if (raw.startsWith('data:') || raw.startsWith('#')) continue
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const u = new URL(raw)
        if (u.hostname.replace(/^www\./, '') === 'kdleds.cn') {
          out.add(u.pathname.split(/[?#]/)[0])
        }
      } catch {
        /* ignore */
      }
    } else if (raw.startsWith('/')) {
      out.add(raw.split(/[?#]/)[0])
    }
  }

  for (const m of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    const raw = m[1].trim()
    if (raw.startsWith('mailto:') || raw.startsWith('javascript:') || raw.startsWith('#')) continue
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const u = new URL(raw)
        if (u.hostname.replace(/^www\./, '') === 'kdleds.cn') {
          out.add(u.pathname.split(/[?#]/)[0])
        }
      } catch {
        /* ignore */
      }
    } else if (raw.startsWith('/')) {
      out.add(raw.split(/[?#]/)[0])
    }
  }

  return out
}

function sanitizeAssetPath(p) {
  if (!p) return null
  let x = p.trim().replace(/^\(+/, '').replace(/\)+$/g, '').replace(/^['"]+|['"]+$/g, '')
  x = x.split(/[?#]/)[0]
  if (!x || x === '/') return null
  if (x.endsWith('.html') || x.endsWith('.htm')) return null
  if (x === '/cn' || x === '/cn/') return null
  return x.startsWith('/') ? x : `/${x}`
}

async function downloadPath(relPath) {
  const clean = sanitizeAssetPath(relPath)
  if (!clean) return
  const url = `${ORIGIN}${clean}`
  const outFile = path.join(PUBLIC, ...clean.split('/').filter(Boolean))
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(outFile, buf)
}

async function mirrorAllUrls(paths) {
  const sorted = [...paths].map(sanitizeAssetPath).filter(Boolean).sort()
  let ok = 0
  let fail = 0
  for (const p of sorted) {
    const outFile = path.join(PUBLIC, ...p.split('/').filter(Boolean))
    try {
      await fs.access(outFile)
      continue
    } catch {
      /* fetch */
    }
    try {
      await downloadPath(p)
      console.log('mirror', p)
      ok++
    } catch (e) {
      console.warn('skip', p, e.message)
      fail++
    }
  }
  console.log(`Mirror done: ${ok} fetched, ${fail} failed, ${sorted.length} unique paths`)
}

function stripEmbeddedFooter($b) {
  $b('map#Map').remove()
  $b('map[name="Map"]').remove()

  const isFooterTable = (h) =>
    h.includes('Scan attention') ||
    h.includes('扫描关注我们') ||
    h.includes('rz.jpg') ||
    /\/on\/facebook\.png/i.test(h)

  $b('table[width="100%"]').each((_, el) => {
    const h = $b(el).html() || ''
    if (isFooterTable(h)) {
      $b(el).remove()
    }
  })
}

function normalizeHtml(html, locale) {
  const $in = cheerio.load(html, { decodeEntities: false })
  let inner = $in('body').length ? ($in('body').html() ?? '') : html

  const $b = cheerio.load(inner, { decodeEntities: false }, false)
  $b('script').remove()
  $b('link[rel="stylesheet"]').remove()
  stripEmbeddedFooter($b)

  let out = $b.html()
  out = out.replace(/https?:\/\/(?:www\.)?kdleds\.cn/gi, '')
  out = out.replace(/\/\/(?:www\.)?kdleds\.cn/gi, '')

  const showPrefix = `/Data/kdleds/template/${locale}/show/`
  out = out.replace(/url\(\s*show\//gi, `url(${showPrefix}`)
  out = out.replace(/url\(["']?show\//gi, `url(${showPrefix}`)

  return out
}

async function walkJsonFiles(dir, baseRel = '') {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const rel = baseRel ? `${baseRel}/${e.name}` : e.name
    const fp = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkJsonFiles(fp, rel)))
    } else if (e.name.endsWith('.json') && e.name !== 'routes.json') {
      out.push({ fp, rel })
    }
  }
  return out
}

async function normalizeAllJson() {
  const files = await walkJsonFiles(SITE)
  let n = 0
  for (const { fp, rel } of files) {
    const raw = await fs.readFile(fp, 'utf8')
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      continue
    }
    const locale = rel.startsWith('cn/') ? 'cn' : 'en'
    let touched = false
    if (typeof data.html === 'string') {
      data.html = normalizeHtml(data.html, locale)
      touched = true
    }
    if ('sourceUrl' in data) {
      delete data.sourceUrl
      touched = true
    }
    if (!touched) continue
    await fs.writeFile(fp, JSON.stringify(data), 'utf8')
    n++
  }
  console.log(`Normalized ${n} JSON fragments`)
}

async function walkCssUnderTemplate() {
  const root = path.join(PUBLIC, 'Data', 'kdleds', 'template')
  const out = []
  async function walk(d) {
    let entries
    try {
      entries = await fs.readdir(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.name.endsWith('.css')) out.push(p)
    }
  }
  await walk(root)
  return out
}

async function collectFromCssFiles() {
  const cssFiles = await walkCssUnderTemplate()
  const urls = new Set()
  const urlRe = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi
  for (const fp of cssFiles) {
    const rel = posix(path.relative(PUBLIC, fp))
    let text
    try {
      text = await fs.readFile(fp, 'utf8')
    } catch {
      continue
    }
    let m
    while ((m = urlRe.exec(text))) {
      let u = m[1].trim()
      if (u.startsWith('data:') || u.startsWith('#')) continue
      if (u.startsWith('http://') || u.startsWith('https://')) {
        try {
          const parsed = new URL(u)
          if (parsed.hostname.replace(/^www\./, '') === 'kdleds.cn') {
            urls.add(parsed.pathname.split(/[?#]/)[0])
          }
        } catch {
          /* ignore */
        }
      } else if (u.startsWith('/')) {
        urls.add(u.split(/[?#]/)[0])
      } else {
        const baseDir = posix(path.dirname(`/${rel}`))
        const resolved = path.posix.normalize(`${baseDir}/${u}`)
        urls.add(resolved.split(/[?#]/)[0])
      }
    }
  }
  return urls
}

async function main() {
  const jsonFiles = await walkJsonFiles(SITE)

  const all = new Set(EXTRA_PATHS)
  for (const { fp } of jsonFiles) {
    const raw = await fs.readFile(fp, 'utf8')
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      continue
    }
    if (typeof data.html === 'string') {
      for (const p of collectPathsFromHtml(data.html)) all.add(p)
    }
  }

  const fromCss = await collectFromCssFiles()
  for (const p of fromCss) all.add(p)

  await mirrorAllUrls(all)
  await normalizeAllJson()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
