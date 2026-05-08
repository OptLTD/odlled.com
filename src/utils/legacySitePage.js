/**
 * 旧站 HTML 片段：去 kdleds 绝对域名、去掉 <base>、解析为标准壳 + 正文，
 * 并把站内路径按语言补上 /cn 前缀，便于 Vue Router 与静态部署一致。
 */

/** @param {string} path */
export function decodePath(path) {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

/** @param {string} a @param {string} b */
export function pathsEqual(a, b) {
  return decodePath(a) === decodePath(b)
}

/** @param {string} html */
export function stripBaseTags(html) {
  return html.replace(/<base\b[^>]*>/gi, '')
}

/** @param {string} html */
export function rewriteKdledsDomains(html) {
  if (!html) return ''
  return html
    .replace(/https?:\/\/(www\.)?kdleds\.cn(?=[/'"?\\s>])/gi, '')
    .replace(/(?<=url\s*\(\s*)https?:\/\/(www\.)?kdleds\.cn(?=[/'"])/gi, '')
}

const ASSET_PREFIXES = ['/Data/', '/cut_', '/assets/', '/site/', '/favicon']

/**
 * @param {string} href
 * @param {'en'|'cn'} locale
 */
export function normalizeHrefForRouter(href, locale) {
  if (!href) return '/'
  let h = href.trim().replace(/\s/g, '')
  if (!h || h.startsWith('#') || h.startsWith('javascript:')) return h
  if (h.startsWith('mailto:')) return h

  h = h.replace(/^https?:\/\/(www\.)?kdleds\.cn(?=\/|$)/i, '')
  if (/^https?:\/\//i.test(h)) return href.trim()

  if (!h.startsWith('/')) h = `/${h}`

  if (locale === 'cn') {
    if (h === '/') return '/cn/'
    if (h.startsWith('/cn/')) return h
    if (ASSET_PREFIXES.some((p) => h.startsWith(p))) return h
    return `/cn${h}`
  }

  if (h.startsWith('/cn/')) {
    const rest = h.slice(4)
    return rest ? `/${rest}` : '/'
  }
  return h
}

/**
 * 对片段内 a[href]、form[action] 做站内路径规范化（仍保留 v-html，避免脚本）
 * @param {string} html
 * @param {'en'|'cn'} locale
 */
export function normalizeInternalLinksInHtml(html, locale) {
  if (!html || typeof document === 'undefined') return html || ''
  try {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = html
    wrapper.querySelectorAll('a[href]').forEach((a) => {
      const raw = a.getAttribute('href')
      if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return
      if (/^https?:\/\//i.test(raw) && !/^https?:\/\/(www\.)?kdleds\.cn/i.test(raw)) return
      a.setAttribute('href', normalizeHrefForRouter(raw, locale))
    })
    wrapper.querySelectorAll('form[action]').forEach((f) => {
      const raw = f.getAttribute('action')
      if (!raw || /^https?:\/\//i.test(raw)) return
      f.setAttribute('action', normalizeHrefForRouter(raw, locale))
    })
    return wrapper.innerHTML
  } catch {
    return html
  }
}

/**
 * @param {string} html 已 stripBase + rewriteKdleds
 * @returns {null | {
 *   heroHtml: string,
 *   breadcrumbs: { label: string, href: string }[],
 *   sectionTitle: string,
 *   sidebarTabs: { label: string, href: string }[],
 *   mainHtml: string,
 *   suffixHtml: string,
 * }}
 */
export function parseStructuredLegacyPage(html) {
  if (!html || typeof DOMParser === 'undefined') return null
  try {
    const doc = new DOMParser().parseFromString(`<div id="kd-parse-wrap">${html}</div>`, 'text/html')
    if (doc.querySelector('parsererror')) return null
    const wrap = doc.getElementById('kd-parse-wrap')
    if (!wrap) return null

    const cont = wrap.querySelector(':scope > .cont')
    if (!cont) return null

    const rtx41 = cont.querySelector('.rti31 .rtx41')
    if (!rtx41) return null

    const crumbs = []
    rtx41.querySelectorAll('a.r3').forEach((a) => {
      const label = a.textContent?.trim() ?? ''
      const href = a.getAttribute('href') || '#'
      if (label) crumbs.push({ label, href })
    })

    const sectionEl = cont.querySelector(':scope > .rti32 .rtx42')
    const sectionTitle = sectionEl?.textContent?.trim() ?? ''

    const sidebarTabs = []
    const rti322 = cont.querySelector(':scope > .rti322')
    if (rti322) {
      rti322.querySelectorAll('.w a').forEach((a) => {
        const label = a.textContent?.trim() ?? ''
        const href = a.getAttribute('href') || '#'
        if (label) sidebarTabs.push({ label, href })
      })
    }

    const contClone = /** @type {HTMLElement} */ (cont.cloneNode(true))
    contClone.querySelector('.rti31')?.remove()
    contClone.querySelector(':scope > .rti32')?.remove()
    contClone.querySelector(':scope > .rti322')?.remove()
    const mainHtml = contClone.innerHTML.trim()

    const rootChildren = [...wrap.children]
    const contIdx = rootChildren.indexOf(cont)
    const heroHtml =
      contIdx > 0 ? rootChildren.slice(0, contIdx).map((el) => el.outerHTML).join('') : ''
    const suffixHtml =
      contIdx >= 0 && contIdx < rootChildren.length - 1
        ? rootChildren.slice(contIdx + 1).map((el) => el.outerHTML).join('')
        : ''

    return {
      heroHtml,
      breadcrumbs: crumbs,
      sectionTitle,
      sidebarTabs,
      mainHtml,
      suffixHtml,
    }
  } catch {
    return null
  }
}

/**
 * @param {string} html
 * @param {'en'|'cn'} locale
 */
export function prepareLegacyHtml(html, locale) {
  const cleaned = rewriteKdledsDomains(stripBaseTags(html ?? ''))
  const structured = parseStructuredLegacyPage(cleaned)
  if (structured) {
    return {
      structured: {
        ...structured,
        heroHtml: normalizeInternalLinksInHtml(structured.heroHtml, locale),
        mainHtml: normalizeInternalLinksInHtml(structured.mainHtml, locale),
        suffixHtml: normalizeInternalLinksInHtml(structured.suffixHtml, locale),
      },
      fallbackHtml: null,
    }
  }
  return {
    structured: null,
    fallbackHtml: normalizeInternalLinksInHtml(cleaned, locale),
  }
}
