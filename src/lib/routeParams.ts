export function encodeParam(value: string): string {
  return encodeURIComponent(value)
}

export function decodeParam(value: string | undefined): string {
  return value ? decodeURIComponent(value) : ''
}

