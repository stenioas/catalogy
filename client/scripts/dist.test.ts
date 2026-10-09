import { execSync } from 'node:child_process'
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(clientRoot, 'dist')
const redirectsPath = join(clientRoot, 'public', '_redirects')

function collectIndexHtmlFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return []
  }
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...collectIndexHtmlFiles(full))
    } else if (entry.name === 'index.html') {
      found.push(full)
    }
  }
  return found
}

function distAssetExtensions(ext: string): string[] {
  const assetsDir = join(distDir, 'assets')
  if (!existsSync(assetsDir)) {
    return []
  }
  return readdirSync(assetsDir).filter((name) => name.endsWith(ext))
}

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

describe('pnpm build emitindo dist estático', () => {
  beforeAll(() => {
    execSync('pnpm build', { cwd: clientRoot, stdio: 'pipe' })
  }, 120_000)

  it('termina com código zero quando o catálogo não tem produtos', () => {
    expect(() =>
      execSync('pnpm build', { cwd: clientRoot, stdio: 'pipe' }),
    ).not.toThrow()
  }, 120_000)

  it('copia catalog/sellers.json, _redirects e um único index.html na raiz do dist', () => {
    const indexFiles = collectIndexHtmlFiles(distDir)
    expect(indexFiles).toEqual([join(distDir, 'index.html')])

    expect(existsSync(join(distDir, 'catalog', 'sellers.json'))).toBe(true)

    const redirects = readFileSync(join(distDir, '_redirects'), 'utf-8')
    expect(redirects).toContain('/* /index.html 200')
  })

  it('inclui CSS e JS empacotados e não gera HTML por relógio em relogio/', () => {
    expect(distAssetExtensions('.css').length).toBeGreaterThan(0)
    expect(distAssetExtensions('.js').length).toBeGreaterThan(0)

    const relogioDir = join(distDir, 'relogio')
    if (existsSync(relogioDir)) {
      const underRelogio = collectIndexHtmlFiles(relogioDir).map((path) =>
        relative(distDir, path),
      )
      expect(underRelogio).toEqual([])
    } else {
      expect(statSync(distDir).isDirectory()).toBe(true)
    }
  })
})
