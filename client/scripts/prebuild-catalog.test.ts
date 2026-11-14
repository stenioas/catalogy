import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  normalizeProductJson,
  validateCatalog,
  writeProductsModule,
} from './catalog'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function publishedProductJsonPaths(catalogDir: string): string[] {
  const productsDir = join(catalogDir, 'products')
  const paths: string[] = []
  for (const entry of readdirSync(productsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      paths.push(join(productsDir, entry.name, 'product.json'))
    }
  }
  return paths
}

function variantsInProductJson(filePath: string): unknown[] {
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as {
    listings?: Array<{ variants?: unknown[] }>
  }
  const variants: unknown[] = []
  for (const listing of raw.listings ?? []) {
    variants.push(...(listing.variants ?? []))
  }
  return variants
}

describe('catalog prebuild (before vite build)', () => {
  it('validates public/catalog and writes products.generated.ts', () => {
    const catalogDir = process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')
    const outFile = join(clientRoot, 'src/catalog/products.generated.ts')
    expect(() => validateCatalog(catalogDir)).not.toThrow()
    const products = validateCatalog(catalogDir)
    expect(Array.isArray(products)).toBe(true)
    writeProductsModule(products, outFile)
    expect(existsSync(outFile)).toBe(true)
    expect(readFileSync(outFile, 'utf8')).toContain('export const products')
  })
})

describe('published catalog migration (OSC-11, OSC-12, OSC-15)', () => {
  const catalogDir = process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')

  it('OSC-11: no published product.json contains unmissableOffer', () => {
    for (const filePath of publishedProductJsonPaths(catalogDir)) {
      for (const variant of variantsInProductJson(filePath)) {
        expect(variant).not.toHaveProperty('unmissableOffer')
      }
    }
  })

  it('OSC-12: a legacy JSON without unmissableOffer migrates without legacy or new offers', () => {
    const legacyJson = JSON.parse(`{
      "slug": "legacy-watch",
      "state": "Novo",
      "title": "Legacy",
      "price": 100,
      "images": ["a.png"],
      "availabilityStatus": "available"
    }`)
    const migrated = normalizeProductJson(legacyJson) as {
      listings: Array<{ variants: Array<Record<string, unknown>> }>
    }
    const variant = migrated.listings[0].variants[0]

    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant).not.toHaveProperty('offers')
  })

  it('OSC-15: products.generated.ts does not contain unmissableOffer', () => {
    const catalogDirResolved =
      process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')
    const outFile = join(clientRoot, 'src/catalog/products.generated.ts')
    const products = validateCatalog(catalogDirResolved)
    writeProductsModule(products, outFile)
    expect(readFileSync(outFile, 'utf8')).not.toContain('unmissableOffer')
  })
})

describe('README offer documentation (OSC-16)', () => {
  it('documents offers in the card body without the legacy flag or a photo badge', () => {
    const readme = readFileSync(join(clientRoot, '..', 'README.md'), 'utf8')

    expect(readme).toContain('`offers`')
    expect(readme).toContain('fica no corpo do card, acima da disponibilidade')
    expect(readme).not.toContain('unmissableOffer')
    expect(readme).not.toMatch(/badge de oferta (?:sobre|acima d[ae]) foto/i)
  })
})
