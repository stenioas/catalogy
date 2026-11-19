import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { mergeVariantListings } from './merge-variant-listings'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceProductsDir = join(clientRoot, 'public/catalog/products')
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempCatalog(): string {
  const root = mkdtempSync(join(tmpdir(), 'merge-variant-listings-'))
  tempDirs.push(root)
  const catalogDir = join(root, 'catalog')
  mkdirSync(join(catalogDir, 'products'), { recursive: true })
  return catalogDir
}

function writeProduct(catalogDir: string, slug: string, product: unknown): string {
  const productDir = join(catalogDir, 'products', slug)
  mkdirSync(join(productDir, 'img'), { recursive: true })
  const filePath = join(productDir, 'product.json')
  writeFileSync(filePath, `${JSON.stringify(product, null, 2)}\n`)
  const listings = (product as {
    listings?: Array<{ images?: string[] }>
  }).listings ?? []
  for (const image of new Set(listings.flatMap((listing) => listing.images ?? []))) {
    writeFileSync(join(productDir, 'img', image), 'image')
  }
  return filePath
}

function readProduct(catalogDir: string, slug: string) {
  return JSON.parse(
    readFileSync(join(catalogDir, 'products', slug, 'product.json'), 'utf8'),
  ) as {
    slug: string
    listings: Array<{
      id: string
      variants: Array<{
        axes: Array<{ axisId: string; valueId: string }>
        state?: string
        availabilityStatus?: string
      }>
    }>
  }
}

function variantByValue(
  product: ReturnType<typeof readProduct>,
  valueId: string,
) {
  return product.listings[0].variants.find((variant) =>
    variant.axes.some((axis) => axis.valueId === valueId),
  )
}

describe('mergeVariantListings', () => {
  it('keeps an invalid product unchanged, reports its slug, and continues', () => {
    const catalogDir = tempCatalog()
    const invalid = {
      slug: 'invalid-watch',
      axes: [],
      listings: [{
        id: 'available',
        availabilityStatus: 'available',
        images: ['invalid.webp'],
        variants: [{ axes: [], price: 100, mainImage: 'invalid.webp' }],
      }],
    }
    const invalidPath = writeProduct(catalogDir, invalid.slug, invalid)
    const before = readFileSync(invalidPath, 'utf8')
    writeProduct(catalogDir, 'valid-watch', {
      slug: 'valid-watch',
      title: 'Valid watch',
      axes: [],
      listings: [{
        id: 'available',
        state: 'used',
        availabilityStatus: 'available',
        images: ['valid.webp'],
        variants: [{ axes: [], price: 100, mainImage: 'valid.webp' }],
      }],
    })
    const generatedFile = join(dirname(catalogDir), 'products.generated.ts')
    const logged: string[] = []

    const result = mergeVariantListings(catalogDir, generatedFile, (slug) => {
      logged.push(slug)
    })

    expect(readFileSync(invalidPath, 'utf8')).toBe(before)
    expect(result.failedSlugs).toEqual(['invalid-watch'])
    expect(logged).toEqual(['invalid-watch'])
    expect(readProduct(catalogDir, 'valid-watch').listings[0].id).toBe('main-listing')
    expect(readFileSync(generatedFile, 'utf8')).toContain('"slug": "valid-watch"')
  })

  it('writes the four specified products with one main listing and their winning variants', () => {
    const catalogDir = tempCatalog()
    const slugs = [
      'addiesdive-ad2035',
      'steelflier-sf741',
      'aimimo-design-explorer',
      'addiesdive-my-h3-2qz',
    ]
    for (const slug of slugs) {
      cpSync(
        join(sourceProductsDir, slug),
        join(catalogDir, 'products', slug),
        { recursive: true },
      )
    }
    const generatedFile = join(dirname(catalogDir), 'products.generated.ts')

    const result = mergeVariantListings(catalogDir, generatedFile)

    expect(result.failedSlugs).toEqual([])
    for (const slug of slugs) {
      const product = readProduct(catalogDir, slug)
      expect(product.listings).toHaveLength(1)
      expect(product.listings[0].id).toBe('main-listing')
    }
    expect(variantByValue(readProduct(catalogDir, 'addiesdive-ad2035'), 'steel'))
      .toMatchObject({ state: 'used', availabilityStatus: 'available' })
    expect(variantByValue(readProduct(catalogDir, 'steelflier-sf741'), 'sf741-zp'))
      .toMatchObject({ state: 'openbox', availabilityStatus: 'available' })
    expect(variantByValue(readProduct(catalogDir, 'aimimo-design-explorer'), 'b-no-logo'))
      .toMatchObject({ state: 'openbox', availabilityStatus: 'available' })
    expect(variantByValue(readProduct(catalogDir, 'addiesdive-my-h3-2qz'), 'black-steel'))
      .toMatchObject({ state: 'used', availabilityStatus: 'available' })

    const generated = readFileSync(generatedFile, 'utf8')
    for (const slug of slugs) {
      expect(generated).toContain(`"slug": "${slug}"`)
    }
    expect(generated.match(/"id": "main-listing"/g)).toHaveLength(4)
  })
})
