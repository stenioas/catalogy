import { execSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
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

function listRelativeFiles(root: string, dir = root): string[] {
  if (!existsSync(dir)) return []
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...listRelativeFiles(root, full))
    } else {
      found.push(relative(root, full))
    }
  }
  return found.sort()
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

  it('publica o catálogo sem catalog/sellers.json, com _redirects e um único index.html na raiz do dist', () => {
    const indexFiles = collectIndexHtmlFiles(distDir)
    expect(indexFiles).toEqual([join(distDir, 'index.html')])

    const publicSellers = join(clientRoot, 'public', 'catalog', 'sellers.json')
    const distSellers = join(distDir, 'catalog', 'sellers.json')
    expect(existsSync(publicSellers)).toBe(false)
    expect(existsSync(distSellers)).toBe(false)

    const publicCatalog = join(clientRoot, 'public', 'catalog')
    const distCatalog = join(distDir, 'catalog')
    const sourceFiles = listRelativeFiles(publicCatalog)
    const copiedFiles = listRelativeFiles(distCatalog)
    expect(sourceFiles).not.toContain('sellers.json')
    expect(copiedFiles).not.toContain('sellers.json')
    expect(copiedFiles).toEqual(sourceFiles)
    for (const file of sourceFiles) {
      expect(readFileSync(join(distCatalog, file))).toEqual(
        readFileSync(join(publicCatalog, file)),
      )
    }

    const redirects = readFileSync(join(distDir, '_redirects'), 'utf-8')
    expect(redirects).toContain('/* /index.html 200')
  }, 120_000)

  it('não publica os arquivos da antiga origem de vendedores', () => {
    expect(existsSync(join(distDir, 'vendedores'))).toBe(false)
    expect(existsSync(join(distDir, 'relogios-alexandre.md'))).toBe(false)
  })

  it('sai com erro quando um arquivo do catálogo fura o contrato (CAT-18)', () => {
    const catalogDir = mkdtempSync(join(tmpdir(), 'catalog-invalid-'))
    const productDir = join(catalogDir, 'products', 'seculus-kit')
    mkdirSync(join(productDir, 'img'), { recursive: true })
    writeFileSync(
      join(productDir, 'product.json'),
      JSON.stringify({
        slug: 'seculus-kit',
        title: 'Seculus',
        state: 'Novo',
        availabilityStatus: 'available',
        price: 0,
        images: ['frente.png'],
      }),
    )
    writeFileSync(join(productDir, 'img', 'frente.png'), 'not-a-real-png')
    let status = 0
    let output = ''
    try {
      execSync('pnpm build', {
        cwd: clientRoot,
        env: { ...process.env, CATALOG_DIR: catalogDir },
        encoding: 'utf-8',
        stdio: 'pipe',
      })
    } catch (error) {
      const failed = error as {
        status?: number | null
        stdout?: string
        stderr?: string
      }
      status = failed.status ?? 1
      output = `${failed.stdout ?? ''}\n${failed.stderr ?? ''}`
    } finally {
      rmSync(catalogDir, { recursive: true, force: true })
    }
    expect(status).not.toBe(0)
    expect(output).toMatch(/failed the shared contract/)
  }, 120_000)

  it('empacota o texto Enviar no WhatsApp no dist (CAT-30, SV-17)', () => {
    const files = listRelativeFiles(distDir).filter((file) =>
      /\.(js|html)$/.test(file),
    )
    expect(files.length).toBeGreaterThan(0)
    const found = files.some((file) =>
      readFileSync(join(distDir, file), 'utf-8').includes('Enviar no WhatsApp'),
    )
    expect(found).toBe(true)
  })

  it('inclui CSS e JS empacotados e não gera HTML por produto em product/', () => {
    expect(distAssetExtensions('.css').length).toBeGreaterThan(0)
    expect(distAssetExtensions('.js').length).toBeGreaterThan(0)

    const productDir = join(distDir, 'product')
    if (existsSync(productDir)) {
      const underProduct = collectIndexHtmlFiles(productDir).map((path) =>
        relative(distDir, path),
      )
      expect(underProduct).toEqual([])
    } else {
      expect(statSync(distDir).isDirectory()).toBe(true)
    }
  })
})
