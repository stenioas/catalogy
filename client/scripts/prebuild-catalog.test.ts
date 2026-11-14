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

const MIGRATED_OFFER = {
  text: 'Black Friday',
  icon: 'Gift',
  background: '#000000',
  color: '#FFFFFF',
}

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

  it('OSC-11: a migrated true variant carries exactly the Gift offer row', () => {
    const slugsWithMigratedOffer = [
      'curren-9007',
      'curren-8106',
      'pagani-design-pd-1701',
      'aimimo-design-air-king',
      'sapphero-so2205',
      'addiesdive-my-h3-2qz',
      'seculus-kit-cantil',
      'addiesdive-ad2554',
      'addiesdive-my-h3-2qz-green-black',
    ]
    for (const slug of slugsWithMigratedOffer) {
      const variants = variantsInProductJson(
        join(catalogDir, 'products', slug, 'product.json'),
      )
      const withOffers = variants.filter(
        (v) =>
          v !== null &&
          typeof v === 'object' &&
          Array.isArray((v as { offers?: unknown }).offers) &&
          (v as { offers: unknown[] }).offers.length > 0,
      )
      expect(withOffers.length).toBeGreaterThan(0)
      for (const variant of withOffers) {
        expect((variant as { offers: unknown[] }).offers).toEqual([MIGRATED_OFFER])
      }
    }
  })

  it('OSC-12: variants that had unmissableOffer false omit offers', () => {
    for (const slug of ['benyar-5229', 'curren-8455']) {
      for (const variant of variantsInProductJson(
        join(catalogDir, 'products', slug, 'product.json'),
      )) {
        expect(variant).not.toHaveProperty('offers')
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
    expect(readme).toContain('fileira no corpo do card acima do preço')
    expect(readme).not.toContain('unmissableOffer')
    expect(readme).not.toMatch(/badge de oferta (?:sobre|acima d[ae]) foto/i)
  })
})
