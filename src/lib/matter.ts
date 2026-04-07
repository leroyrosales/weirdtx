import { parse as parseYaml } from 'yaml'

export function parseMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw.trim() }
  }
  const [, yamlBlock, body] = match
  let data: Record<string, unknown> = {}
  try {
    const parsed = parseYaml(yamlBlock) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>
    }
  } catch {
    data = {}
  }
  return { data, content: body.trim() }
}
