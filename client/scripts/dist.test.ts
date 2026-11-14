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
import type { Product } from '@catalogo/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { citedImageNames, isPublishedCatalogFile, validateCatalog } from './catalog'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = mkdtempSync(join(tmpdir(), 'catalog-dist-'))
const buildCommand = `pnpm build --outDir ${distDir} --emptyOutDir`
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

/** Paths under catalog/ that the published dist should contain (VAR-25 omits uncited images). */
function expectedDistCatalogRelPaths(
  publicCatalogDir: string,
  products: Product[],
): string[] {
  const sourceFiles = listRelativeFiles(publicCatalogDir)
  const citedBySlug = new Map(
    products.map((p) => [p.slug, new Set(citedImageNames(p))]),
  )
  const out: string[] = []
  for (const rel of sourceFiles) {
    if (!isPublishedCatalogFile(rel, citedBySlug)) {
      continue
    }
    out.push(rel)
  }
  return out.sort()
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
    execSync(buildCommand, { cwd: clientRoot, stdio: 'pipe' })
  }, 300_000)

  afterAll(() => {
    rmSync(distDir, { recursive: true, force: true })
  })

  it('termina com código zero quando o catálogo não tem produtos', () => {
    expect(() =>
      execSync(buildCommand, { cwd: clientRoot, stdio: 'pipe' }),
    ).not.toThrow()
  }, 300_000)

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
    const products = validateCatalog(publicCatalog)
    const expectedCatalogFiles = expectedDistCatalogRelPaths(publicCatalog, products)
    expect(sourceFiles).not.toContain('sellers.json')
    expect(copiedFiles).not.toContain('sellers.json')
    expect(copiedFiles).toEqual(expectedCatalogFiles)
    for (const file of expectedCatalogFiles) {
      expect(readFileSync(join(distCatalog, file))).toEqual(
        readFileSync(join(publicCatalog, file)),
      )
    }

    const redirects = readFileSync(join(distDir, '_redirects'), 'utf-8')
    expect(redirects).toContain('/* /index.html 200')
  }, 600_000)

  it('não publica os arquivos da antiga origem de vendedores', () => {
    expect(existsSync(join(distDir, 'vendedores'))).toBe(false)
    expect(existsSync(join(distDir, 'relogios-alexandre.md'))).toBe(false)
  })

  it('aceita um catálogo que não segue o contrato de relógio', () => {
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
    try {
      expect(validateCatalog(catalogDir)).toHaveLength(1)
    } finally {
      rmSync(catalogDir, { recursive: true, force: true })
    }
  })

  it('sai com erro quando images cita um arquivo ausente em img/ (VAR-24)', () => {
    const catalogDir = mkdtempSync(join(tmpdir(), 'catalog-missing-image-'))
    const productDir = join(catalogDir, 'products', 'seculus-kit')
    mkdirSync(join(productDir, 'img'), { recursive: true })
    writeFileSync(
      join(productDir, 'product.json'),
      JSON.stringify({
        slug: 'seculus-kit',
        title: 'Seculus',
        axes: [],
        listings: [
          {
            id: 'listing',
            state: 'new',
            availabilityStatus: 'available',
            images: ['frente.png', 'verso.png'],
            variants: [
              {
                axes: [],
                price: 369.9,
                mainImage: 'frente.png',
              },
            ],
          },
        ],
      }),
    )
    writeFileSync(join(productDir, 'img', 'frente.png'), 'not-a-real-png')
    let status = 0
    try {
      execSync(buildCommand, {
        cwd: clientRoot,
        env: { ...process.env, CATALOG_DIR: catalogDir },
        encoding: 'utf-8',
        stdio: 'pipe',
      })
    } catch (error) {
      const failed = error as { status?: number | null }
      status = failed.status ?? 1
    } finally {
      rmSync(catalogDir, { recursive: true, force: true })
    }
    expect(status).not.toBe(0)
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
