import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const redirectsPath = join(clientRoot, 'public', '_redirects')

describe('Cloudflare SPA fallback (_redirects)', () => {
  it('declares /* /index.html 200 so deep links serve the SPA shell', () => {
    const content = readFileSync(redirectsPath, 'utf-8')
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    expect(lines).toContain('/* /index.html 200')
  })
})
