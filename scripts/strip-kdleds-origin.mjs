#!/usr/bin/env node
/**
 * 去除 public 内残留的 kdleds.cn 绝对地址，避免构建产物 dist 仍含旧站域名。
 * - public/site 下各 JSON：删除 sourceUrl，并对 html 字段做域名剥离（对齐 legacySitePage.rewriteKdledsDomains）
 * - public 下全部 .html：全文剥离（遗留静态页镜像）
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

/** @param {string} html */
function stripKdledsUrls(html) {
  if (!html || typeof html !== 'string') return html
  return html
    .replace(/https?:\/\/(?:www\.)?kdleds\.cn(?=[/'"?\\\s>])/gi, '')
    .replace(/\/\/(?:www\.)?kdleds\.cn(?=[/'"?\\\s>])/gi, '')
    .replace(/(?<=url\s*\(\s*)https?:\/\/(?:www\.)?kdleds\.cn(?=[/'"])/gi, '')
}

async function walkJson(dir, out = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const fp = path.join(dir, e.name)
    if (e.isDirectory()) await walkJson(fp, out)
    else if (e.name.endsWith('.json') && e.name !== 'routes.json') out.push(fp)
  }
  return out
}

async function walkHtml(dir, out = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const fp = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue
      await walkHtml(fp, out)
    } else if (e.name.endsWith('.html')) out.push(fp)
  }
  return out
}

async function stripSiteJson() {
  const site = path.join(PUBLIC, 'site')
  const files = await walkJson(site)
  let n = 0
  for (const fp of files) {
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
    let touched = false
    if (typeof data.html === 'string') {
      const next = stripKdledsUrls(data.html)
      if (next !== data.html) {
        data.html = next
        touched = true
      }
    }
    if ('sourceUrl' in data) {
      delete data.sourceUrl
      touched = true
    }
    if (touched) {
      await fs.writeFile(fp, JSON.stringify(data), 'utf8')
      n++
    }
  }
  console.log(`[strip-kdleds-origin] public/site JSON 已更新 ${n} 个`)
}

async function stripPublicHtml() {
  const files = await walkHtml(PUBLIC)
  let n = 0
  for (const fp of files) {
    const raw = await fs.readFile(fp, 'utf8')
    const next = stripKdledsUrls(raw)
    if (next !== raw) {
      await fs.writeFile(fp, next, 'utf8')
      n++
    }
  }
  console.log(`[strip-kdleds-origin] public 下 HTML 已更新 ${n} 个`)
}

await stripSiteJson()
await stripPublicHtml()
