/**
 * 将 kdleds 模板 CSS 及其 url() 依赖下载到 public/Data/kdleds/template/
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const ORIGIN = 'http://www.kdleds.cn'
const TEMPLATE_PREFIX = '/Data/kdleds/template'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** @param {string} cssRelPath e.g. en/css/css.css */
function resolveUrl(cssRelPath, raw) {
  let u = raw.trim().replace(/^['"]|['"]$/g, '')
  if (!u || u.startsWith('data:')) return null
  if (u.startsWith('#')) return null
  if (u.startsWith('http://') || u.startsWith('https://')) {
    try {
      const parsed = new URL(u)
      if (!parsed.pathname.startsWith(TEMPLATE_PREFIX)) return null
      return parsed.pathname.slice(TEMPLATE_PREFIX.length + 1)
    } catch {
      return null
    }
  }
  const dir = path.posix.dirname(cssRelPath)
  const joined = path.posix.normalize(`${dir}/${u}`)
  return joined.replace(/^\.\//, '')
}

async function save(relFromTemplateRoot, body) {
  const rel = relFromTemplateRoot.replace(/\\/g, '/')
  const outPath = path.join(PUBLIC, 'Data', 'kdleds', 'template', ...rel.split('/'))
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, body)
  return outPath
}

async function fetchAsset(relFromTemplateRoot) {
  const url = `${ORIGIN}${TEMPLATE_PREFIX}/${relFromTemplateRoot}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function mirrorLocale(locale) {
  const seeds = [
    `${locale}/css/css.css`,
    `${locale}/css/left.css`,
    `${locale}/dh/style.css`,
    `${locale}/css/show.css`,
    `${locale}/images/logo.png`,
    `${locale}/images/ywen.jpg`,
  ]

  const queue = [...seeds]
  const seen = new Set()

  while (queue.length) {
    const rel = queue.shift()
    if (!rel || seen.has(rel)) continue

    let buf
    try {
      buf = await fetchAsset(rel)
    } catch (e) {
      console.warn('skip', rel, e.message)
      continue
    }

    seen.add(rel)
    await save(rel, buf)
    console.log('ok', rel)

    if (rel.endsWith('.css')) {
      const text = buf.toString('utf8')
      const re = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi
      let m
      while ((m = re.exec(text))) {
        const target = resolveUrl(rel, m[1])
        if (
          target &&
          !seen.has(target) &&
          !queue.includes(target) &&
          (target.startsWith(`${locale}/`) || target.startsWith('shared/'))
        ) {
          queue.push(target)
        }
      }
    }
  }
}

async function main() {
  await mirrorLocale('en')
  await mirrorLocale('cn')
  console.log('Done. Assets under public/Data/kdleds/template/')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
