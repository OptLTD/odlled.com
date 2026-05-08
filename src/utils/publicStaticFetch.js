/**
 * public 下静态文件名若含有字面量「%」（如 led%E5%A2%99…html.json），
 * HTTP 会将路径解码一次，服务端会去匹配解码后的 Unicode 路径从而 404，
 * SPA 再回退成 index.html → JSON.parse 报 Unexpected token '<'。
 * 对每个路径段内的 % 写成 %25，使解码后仍是字面量 %…。
 */
export function encodeFilenameForPublicUrl(filename) {
  return String(filename)
    .split('/')
    .map((seg) => seg.replace(/%/g, '%25'))
    .join('/')
}

export async function fetchJson(url) {
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`)
  }
  const start = text.trimStart()
  if (start.startsWith('<')) {
    throw new Error(
      `接口返回了 HTML 而非 JSON（多为 SPA 回退或 JSON 路径编码错误）：${url}`,
    )
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`JSON 无效 ${url}: ${e.message}`)
  }
}
