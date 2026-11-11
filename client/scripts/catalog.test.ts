import {
  copyFileSync,
  existsSync,
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
import { ProductSchema } from '@catalogo/shared'
import {
  normalizeProductJson,
  omitUncitedImages,
  validateCatalog,
  writeProductsModule,
} from './catalog'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tempDirs: string[] = []

const photoBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xfe, 0x9f, 0x3c,
  0xa1, 0x17, 0x4b, 0xc2,
])

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'catalogo-'))
  tempDirs.push(dir)
  return dir
}

/** Minimal shape accepted by ProductSchema (listings + variants). */
function productFixture(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'seculus-kit',
    title: 'Seculus',
    axes: [] as Array<{
      id: string
      label: string
      values: { id: string; value: string; alias?: string }[]
    }>,
    listings: [
      {
        id: 'listing',
        state: 'new',
        availabilityStatus: 'available',
        images: ['frente.png'],
        variants: [
          {
            axes: [],
            price: 369.9,
            mainImage: 'frente.png',
          },
        ],
      },
    ],
    ...overrides,
  }
}

function writeProduct(
  catalogDir: string,
  slug: string,
  product: unknown,
  files: Record<string, Buffer | string>,
): void {
  const productDir = join(catalogDir, 'products', slug)
  mkdirSync(join(productDir, 'img'), { recursive: true })
  writeFileSync(
    join(productDir, 'product.json'),
    typeof product === 'string' ? product : JSON.stringify(product),
  )
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(
      join(productDir, 'img', name),
      contents,
    )
  }
}

function writeValidCatalog(): string {
  const catalogDir = tempDir()
  writeProduct(
    catalogDir,
    'seculus-kit',
    productFixture(),
    {
      'frente.png': photoBytes,
      'notas.txt': 'isto não é foto',
    },
  )
  writeProduct(
    catalogDir,
    'curren-gold',
    productFixture({
      slug: 'curren-gold',
      title: 'CURREN',
      listings: [
        {
          id: 'listing',
          state: 'new',
          availabilityStatus: 'available',
          images: ['pulseira.jpg'],
          variants: [
            {
              axes: [],
              price: 199,
              mainImage: 'pulseira.jpg',
            },
          ],
        },
      ],
    }),
    {
      'pulseira.jpg': photoBytes,
    },
  )
  return catalogDir
}

describe('validateCatalog', () => {
  it('returns the product list from a valid catalog directory', () => {
    const products = validateCatalog(writeValidCatalog())

    expect(products).toHaveLength(2)
    const bySlug = Object.fromEntries(products.map((product) => [product.slug, product]))
    expect(bySlug['seculus-kit']).toMatchObject({
      slug: 'seculus-kit',
      title: 'Seculus',
      listings: [
        expect.objectContaining({
          images: ['frente.png'],
          variants: [expect.objectContaining({ price: 369.9, mainImage: 'frente.png' })],
        }),
      ],
    })
    expect(bySlug['curren-gold']).toMatchObject({
      slug: 'curren-gold',
      title: 'CURREN',
      listings: [
        expect.objectContaining({
          images: ['pulseira.jpg'],
          variants: [expect.objectContaining({ price: 199, mainImage: 'pulseira.jpg' })],
        }),
      ],
    })
  })

  it('preserves axis value text through validation and generated output', () => {
    const catalogDir = tempDir()
    const colorValue = '  Azul petróleo  '
    writeProduct(
      catalogDir,
      'seculus-kit',
      productFixture({
        axes: [
          {
            id: 'color',
            label: 'Cor',
            values: [{ id: 'azul-petroleo', value: colorValue }],
          },
        ],
        listings: [
          {
            id: 'listing',
            state: 'new',
            availabilityStatus: 'available',
            images: ['frente.png'],
            variants: [
              {
                axes: [{ axisId: 'color', valueId: 'azul-petroleo' }],
                price: 369.9,
                mainImage: 'frente.png',
              },
            ],
          },
        ],
      }),
      { 'frente.png': photoBytes },
    )

    const products = validateCatalog(catalogDir)
    expect(products[0].axes[0].values[0].value).toBe(colorValue)

    const outFile = join(tempDir(), 'products.generated.ts')
    writeProductsModule(products, outFile)
    const source = readFileSync(outFile, 'utf8')
    const emittedProducts = JSON.parse(
      source.split('export const products: Product[] = ')[1],
    ) as Array<{ axes: { values: { value: string }[] }[] }>
    expect(emittedProducts[0].axes[0].values[0].value).toBe(colorValue)
  })

  it('validates without sellers.json on disk', () => {
    const catalogDir = writeValidCatalog()
    expect(existsSync(join(catalogDir, 'sellers.json'))).toBe(false)
    expect(() => validateCatalog(catalogDir)).not.toThrow()
  })

  it('throws when product.json is not valid JSON', () => {
    const catalogDir = tempDir()
    writeProduct(catalogDir, 'seculus-kit', '{', { 'frente.png': photoBytes })

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('throws when product.json fails the shared contract', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      productFixture({
        listings: [
          {
            id: 'listing',
            state: 'new',
            availabilityStatus: 'available',
            images: ['frente.png'],
            variants: [
              {
                axes: [],
                price: 0,
                mainImage: 'frente.png',
              },
            ],
          },
        ],
      }),
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('throws when a listing image is named in images but missing from img/', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      productFixture({
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
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('does not throw when img/ has an image file no listing images entry names', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      productFixture(),
      {
        'frente.png': photoBytes,
        'extra-unused.png': photoBytes,
      },
    )

    expect(() => validateCatalog(catalogDir)).not.toThrow()
    const products = validateCatalog(catalogDir)
    expect(products).toHaveLength(1)
  })
})

const LEGACY_UNMISSABLE_OFFER = {
  text: 'OFERTA IMPERDÍVEL',
  icon: 'Gift',
  background: '#0066cc',
  color: '#ffffff',
} as const

function flatLegacyProduct(
  unmissableOffer?: boolean,
): Record<string, unknown> {
  const base = {
    slug: 'legacy-watch',
    state: 'Novo',
    title: 'Legacy',
    price: 100,
    images: ['a.png'],
    availabilityStatus: 'available',
  }
  if (unmissableOffer === undefined) {
    return base
  }
  return { ...base, unmissableOffer }
}

function variantFromNormalized(normalized: unknown): Record<string, unknown> {
  const listings = (normalized as { listings: Array<{ variants: unknown[] }> })
    .listings
  return listings[0].variants[0] as Record<string, unknown>
}

describe('normalizeProductJson', () => {
  it('OSC-13: maps legacy unmissableOffer true to the Gift offer row and drops the flag', () => {
    const normalized = normalizeProductJson(flatLegacyProduct(true))
    const variant = variantFromNormalized(normalized)

    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant.offers).toEqual([LEGACY_UNMISSABLE_OFFER])

    const parsed = ProductSchema.safeParse(normalized)
    expect(parsed.success).toBe(true)
  })

  it('OSC-14: legacy unmissableOffer false omits offers and the flag', () => {
    const normalized = normalizeProductJson(flatLegacyProduct(false))
    const variant = variantFromNormalized(normalized)

    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant).not.toHaveProperty('offers')
  })

  it('OSC-14: absent unmissableOffer omits offers and the flag', () => {
    const normalized = normalizeProductJson(flatLegacyProduct())
    const variant = variantFromNormalized(normalized)

    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant).not.toHaveProperty('offers')
  })

  it('reshapes flat legacy product.json into listings the schema accepts (VAR-25 bridge)', () => {
    const legacy = {
      slug: 'legacy-watch',
      state: 'Novo',
      title: 'Legacy',
      price: 100,
      images: ['a.png'],
      availabilityStatus: 'available',
      specifications: [
        { label: 'Estado', value: 'Novo' },
        { label: 'Marca', value: 'X' },
      ],
    }
    const normalized = normalizeProductJson(legacy)
    const parsed = ProductSchema.safeParse(normalized)
    expect(parsed.success).toBe(true)
    if (!parsed.success) {
      return
    }
    expect(parsed.data.listings).toHaveLength(1)
    expect(parsed.data.listings[0].images).toEqual(['a.png'])
    expect(parsed.data.specifications?.some((s) => s.label === 'Estado')).toBe(false)
  })
})

describe('omitUncitedImages', () => {
  it('removes image files under dist img/ that no listing cites', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      productFixture(),
      {
        'frente.png': photoBytes,
        'extra-uncited.png': photoBytes,
      },
    )
    const products = validateCatalog(catalogDir)

    const distCatalogProductsDir = tempDir()
    const distImg = join(distCatalogProductsDir, 'seculus-kit', 'img')
    mkdirSync(distImg, { recursive: true })
    const srcImg = join(catalogDir, 'products', 'seculus-kit', 'img')
    copyFileSync(join(srcImg, 'frente.png'), join(distImg, 'frente.png'))
    copyFileSync(join(srcImg, 'extra-uncited.png'), join(distImg, 'extra-uncited.png'))

    omitUncitedImages(distCatalogProductsDir, products)

    expect(existsSync(join(distImg, 'frente.png'))).toBe(true)
    expect(existsSync(join(distImg, 'extra-uncited.png'))).toBe(false)
    expect(existsSync(join(srcImg, 'extra-uncited.png'))).toBe(true)
  })

  it('does not throw when the dist catalog products directory is absent', () => {
    expect(() => omitUncitedImages(join(tempDir(), 'no-catalog-here'), [])).not.toThrow()
  })
})

describe('writeProductsModule', () => {
  it('writes image file names and does not embed photo bytes or base64', () => {
    const catalogDir = writeValidCatalog()
    const products = validateCatalog(catalogDir)
    const outFile = join(tempDir(), 'products.generated.ts')

    writeProductsModule(products, outFile)

    const written = readFileSync(outFile)
    const source = written.toString('utf8')
    expect(source.startsWith("import type { Product } from '@catalogo/shared'")).toBe(true)
    expect(source).toContain('export const products: Product[] = ')
    const parsed: unknown = JSON.parse(
      source.split('export const products: Product[] = ')[1],
    )
    expect(parsed).toEqual(products)
    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          listings: [expect.objectContaining({ images: ['frente.png'] })],
        }),
        expect.objectContaining({
          listings: [expect.objectContaining({ images: ['pulseira.jpg'] })],
        }),
      ]),
    )
    expect(written.includes(photoBytes)).toBe(false)
    expect(source).not.toContain(photoBytes.toString('base64'))
  })

  it('does not emit index.json', () => {
    const catalogDir = writeValidCatalog()
    const products = validateCatalog(catalogDir)
    const outDir = tempDir()
    const outFile = join(outDir, 'products.generated.ts')

    writeProductsModule(products, outFile)

    expect(existsSync(join(catalogDir, 'index.json'))).toBe(false)
    expect(existsSync(join(outDir, 'index.json'))).toBe(false)
    expect(existsSync(outFile)).toBe(true)
  })
})

describe('generated module path', () => {
  it('is listed in .gitignore', () => {
    const gitignore = readFileSync(join(repoRoot, '.gitignore'), 'utf8')
    expect(gitignore.split('\n')).toContain(
      'client/src/catalog/products.generated.ts',
    )
  })
})

describe('initial catalog in public/', () => {
  const catalogDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'public',
    'catalog',
  )

  it('does not keep sellers.json in the public catalog', () => {
    expect(existsSync(join(catalogDir, 'sellers.json'))).toBe(false)
  })

  it('writes the products module for one valid watch', () => {
    const oneWatchDir = tempDir()
    writeProduct(
      oneWatchDir,
      'seculus-kit',
      productFixture(),
      { 'frente.png': photoBytes },
    )

    const products = validateCatalog(oneWatchDir)
    expect(products).toHaveLength(1)
    expect(products[0]).toMatchObject({
      slug: 'seculus-kit',
      title: 'Seculus',
      listings: [
        expect.objectContaining({
          images: ['frente.png'],
          variants: [expect.objectContaining({ mainImage: 'frente.png' })],
        }),
      ],
    })
    const outFile = join(tempDir(), 'products.generated.ts')
    writeProductsModule(products, outFile)
    expect(existsSync(outFile)).toBe(true)
    expect(readFileSync(outFile, 'utf8')).toContain('export const products')
    expect(
      existsSync(join(oneWatchDir, 'products', 'seculus-kit', 'img', 'frente.png')),
    ).toBe(true)
  })
})
