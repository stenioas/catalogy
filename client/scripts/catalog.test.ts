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
import { parseLabels, ProductSchema } from '@catalogo/shared'
import {
  isPublishedCatalogFile,
  normalizeProductJson,
  omitCatalogMedia,
  omitUncitedImages,
  readLabels,
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

function defaultLabelCatalog() {
  return [
    {
      id: 'black-friday',
      enabled: true,
      type: 'campaign' as const,
      text: 'Black Friday',
      shortText: 'Black Friday',
      icon: 'Gift',
      background: '#000000',
      color: '#FFFFFF',
      filterable: true,
    },
    {
      id: 'discount-20',
      enabled: true,
      type: 'offer' as const,
      category: 'discount',
      description: '',
      priority: 1,
      text: 'acima 20%',
      icon: 'Gift',
      background: '#000000',
      color: '#FFFFFF',
      filterable: true,
      trigger: { kind: 'discount-at-least' as const, percent: 20 },
    },
  ]
}

function writeLabels(catalogDir: string, labels = defaultLabelCatalog()): void {
  writeFileSync(join(catalogDir, 'labels.json'), JSON.stringify(labels))
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

function parseGeneratedProducts(source: string): unknown {
  const afterProducts = source.split('export const products: Product[] = ')[1]
  const productsJson = afterProducts.split('\n\nexport const labels: Label[] = ')[0]
  return JSON.parse(productsJson)
}

function parseGeneratedLabels(source: string): unknown {
  const afterLabels = source.split('export const labels: Label[] = ')[1]
  return JSON.parse(afterLabels)
}

function writeValidCatalog(): string {
  const catalogDir = tempDir()
  writeLabels(catalogDir)
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

function catalogWithLabels(productOverrides?: Record<string, unknown>): string {
  const catalogDir = tempDir()
  writeLabels(catalogDir)
  writeProduct(catalogDir, 'seculus-kit', productFixture(productOverrides), {
    'frente.png': photoBytes,
  })
  return catalogDir
}

describe('catalog labels (LBL-01, LBL-08, LBL-09, LBL-14)', () => {
  it('LBL-01: reads labels.json during validateCatalog and embeds labels in the generated module', () => {
    const catalogDir = writeValidCatalog()
    const labels = readLabels(catalogDir)
    expect(labels).toEqual(defaultLabelCatalog())

    const products = validateCatalog(catalogDir, labels)
    const outFile = join(tempDir(), 'products.generated.ts')
    writeProductsModule(products, labels, outFile)

    const source = readFileSync(outFile, 'utf8')
    expect(source).toContain('export const products: Product[] = ')
    expect(source).toContain('export const labels: Label[] = ')
    expect(parseGeneratedLabels(source)).toEqual(defaultLabelCatalog())
    expect(parseGeneratedProducts(source)).toEqual(products)
  })

  it('LBL-08: rejects labels.json when an icon is not a Lucide export', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir, [
      {
        ...defaultLabelCatalog()[0],
        icon: 'DefinitelyNotALucideExportName',
      },
      defaultLabelCatalog()[1],
    ])
    writeProduct(catalogDir, 'seculus-kit', productFixture(), { 'frente.png': photoBytes })

    expect(() => readLabels(catalogDir)).toThrow(/Lucide icon/)
    expect(() => validateCatalog(catalogDir)).toThrow(/Lucide icon/)
  })

  it('LBL-09: rejects variant disabledLabels when the id is absent from labels.json', () => {
    const catalogDir = catalogWithLabels({
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
              disabledLabels: ['promo-inexistente'],
            },
          ],
        },
      ],
    })

    expect(() => validateCatalog(catalogDir)).toThrow(/Unknown label id "promo-inexistente"/)
  })

  it('LBL-09: rejects listing disabledLabels when the id is absent from labels.json', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
    writeProduct(
      catalogDir,
      'seculus-kit',
      productFixture({
        listings: [
          {
            id: 'listing',
            disabledLabels: ['nao-cadastrada'],
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
      }),
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).toThrow(/Unknown label id "nao-cadastrada"/)
  })
})

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
    writeLabels(catalogDir)
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

    const labels = readLabels(catalogDir)
    const products = validateCatalog(catalogDir, labels)
    expect(products[0].axes[0].values[0].value).toBe(colorValue)

    const outFile = join(tempDir(), 'products.generated.ts')
    writeProductsModule(products, labels, outFile)
    const source = readFileSync(outFile, 'utf8')
    const emittedProducts = parseGeneratedProducts(source) as Array<{
      axes: { values: { value: string }[] }[]
    }>
    expect(emittedProducts[0].axes[0].values[0].value).toBe(colorValue)
  })

  it('validates without sellers.json on disk', () => {
    const catalogDir = writeValidCatalog()
    expect(existsSync(join(catalogDir, 'sellers.json'))).toBe(false)
    expect(() => validateCatalog(catalogDir)).not.toThrow()
  })

  it('throws when product.json is not valid JSON', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
    writeProduct(catalogDir, 'seculus-kit', '{', { 'frente.png': photoBytes })

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('loads a product that does not follow the watch contract', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
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

    expect(() => validateCatalog(catalogDir)).not.toThrow()
    expect(validateCatalog(catalogDir)).toHaveLength(1)
  })

  it('throws when a listing image is named in images but missing from img/', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
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
    writeLabels(catalogDir)
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

  it('OSC-09: rejects offer icon that is not a Lucide export', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
    writeProduct(
      catalogDir,
      'unknown-icon',
      productFixture({
        slug: 'unknown-icon',
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
                offers: [
                  {
                    text: 'Promo',
                    icon: 'DefinitelyNotALucideExportName',
                    background: '#0066cc',
                    color: '#ffffff',
                  },
                ],
              },
            ],
          },
        ],
      }),
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).toThrow(/Lucide icon/)
  })

  it('OSC-09: accepts Gift as a known Lucide export', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
    writeProduct(
      catalogDir,
      'gift-offer',
      productFixture({
        slug: 'gift-offer',
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
                offers: [
                  {
                    text: 'Black Friday',
                    icon: 'Gift',
                    background: '#000000',
                    color: '#FFFFFF',
                  },
                ],
              },
            ],
          },
        ],
      }),
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).not.toThrow()
    const products = validateCatalog(catalogDir)
    expect(products[0].listings[0].variants[0].offers?.[0]?.icon).toBe('Gift')
  })
})

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
  it('LBL-14: legacy unmissableOffer true omits offers and drops the flag', () => {
    const normalized = normalizeProductJson(flatLegacyProduct(true))
    const variant = variantFromNormalized(normalized)

    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant).not.toHaveProperty('offers')

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

  it('reshapes flat legacy product.json into a main-listing with variant condition (FILT-01)', () => {
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
    expect(parsed.data.listings[0].id).toBe('main-listing')
    expect(parsed.data.listings[0]).not.toHaveProperty('state')
    expect(parsed.data.listings[0]).not.toHaveProperty('availabilityStatus')
    expect(parsed.data.listings[0].variants[0].state).toBe('new')
    expect(parsed.data.listings[0].variants[0].availabilityStatus).toBe('available')
    expect(parsed.data.listings[0].images).toEqual(['a.png'])
    expect(parsed.data.specifications?.some((s) => s.label === 'Estado')).toBe(false)
  })
})

describe('omitUncitedImages', () => {
  it('removes image files under dist img/ that no listing cites', () => {
    const catalogDir = tempDir()
    writeLabels(catalogDir)
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
    const thumbDir = join(distImg, 'thumbs')
    mkdirSync(thumbDir, { recursive: true })
    copyFileSync(join(srcImg, 'frente.png'), join(thumbDir, 'frente.png'))
    copyFileSync(join(srcImg, 'extra-uncited.png'), join(thumbDir, 'extra-uncited.png'))

    omitUncitedImages(distCatalogProductsDir, products)

    expect(existsSync(join(distImg, 'frente.png'))).toBe(true)
    expect(existsSync(join(distImg, 'extra-uncited.png'))).toBe(false)
    expect(existsSync(join(thumbDir, 'frente.png'))).toBe(true)
    expect(existsSync(join(thumbDir, 'extra-uncited.png'))).toBe(false)
    expect(existsSync(join(srcImg, 'extra-uncited.png'))).toBe(true)
  })

  it('drops media/ from dist and keeps the registration copy', () => {
    const distProducts = tempDir()
    const sourceMedia = tempDir()
    const distMedia = join(distProducts, 'seculus-kit', 'media')
    mkdirSync(distMedia, { recursive: true })
    writeFileSync(join(sourceMedia, 'fonte.png'), 'fonte')
    writeFileSync(join(distMedia, 'fonte.png'), 'fonte')
    writeFileSync(join(distProducts, 'seculus-kit', 'info.md'), 'ficha')

    omitCatalogMedia(distProducts)

    expect(existsSync(distMedia)).toBe(false)
    expect(existsSync(join(distProducts, 'seculus-kit', 'info.md'))).toBe(true)
    expect(readFileSync(join(sourceMedia, 'fonte.png'), 'utf8')).toBe('fonte')
  })

  it('publishes cited thumbs and leaves media unpublished', () => {
    const cited = new Map([['seculus-kit', new Set(['frente.webp'])]])
    expect(isPublishedCatalogFile('products/seculus-kit/img/frente.webp', cited)).toBe(true)
    expect(isPublishedCatalogFile('products/seculus-kit/img/thumbs/frente.webp', cited)).toBe(true)
    expect(isPublishedCatalogFile('products/seculus-kit/img/extra.webp', cited)).toBe(false)
    expect(isPublishedCatalogFile('products/seculus-kit/img/thumbs/extra.webp', cited)).toBe(false)
    expect(isPublishedCatalogFile('products/seculus-kit/media/frente.png', cited)).toBe(false)
    expect(isPublishedCatalogFile('products/seculus-kit/media/video.mp4', cited)).toBe(false)
    expect(isPublishedCatalogFile('products/seculus-kit/info.md', cited)).toBe(true)
  })

  it('does not throw when the dist catalog products directory is absent', () => {
    expect(() => omitUncitedImages(join(tempDir(), 'no-catalog-here'), [])).not.toThrow()
  })
})

describe('writeProductsModule', () => {
  it('writes image file names and does not embed photo bytes or base64', () => {
    const catalogDir = writeValidCatalog()
    const labels = readLabels(catalogDir)
    const products = validateCatalog(catalogDir, labels)
    const outFile = join(tempDir(), 'products.generated.ts')

    writeProductsModule(products, labels, outFile)

    const written = readFileSync(outFile)
    const source = written.toString('utf8')
    expect(source.startsWith("import type { Product, Label } from '@catalogo/shared'")).toBe(true)
    expect(source).toContain('export const products: Product[] = ')
    const parsed: unknown = parseGeneratedProducts(source)
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
    const labels = readLabels(catalogDir)
    const products = validateCatalog(catalogDir, labels)
    const outDir = tempDir()
    const outFile = join(outDir, 'products.generated.ts')

    writeProductsModule(products, labels, outFile)

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

  describe('published labels.json (LBL-10, LBL-11, LBL-12)', () => {
    function publishedLabels() {
      return parseLabels(
        JSON.parse(readFileSync(join(catalogDir, 'labels.json'), 'utf8')),
      )
    }

    it('LBL-10: ships black-friday and discount-20 enabled, filterable, with Gift and #000000 on #FFFFFF', () => {
      const labels = publishedLabels()
      expect(labels).toHaveLength(2)

      const campaign = labels.find((label) => label.id === 'black-friday')
      expect(campaign).toMatchObject({
        type: 'campaign',
        enabled: true,
        filterable: true,
        icon: 'Gift',
        background: '#000000',
        color: '#FFFFFF',
      })

      const offer = labels.find((label) => label.id === 'discount-20')
      expect(offer).toMatchObject({
        type: 'offer',
        enabled: true,
        filterable: true,
        icon: 'Gift',
        background: '#000000',
        color: '#FFFFFF',
      })
    })

    it('LBL-11: black-friday text and shortText are Black Friday', () => {
      const campaign = publishedLabels().find(
        (label) => label.id === 'black-friday',
      )
      expect(campaign).toMatchObject({
        type: 'campaign',
        text: 'Black Friday',
        shortText: 'Black Friday',
      })
    })

    it('LBL-12: discount-20 is discount priority 1, text acima 20%, trigger discount-at-least at 20%', () => {
      const offer = publishedLabels().find((label) => label.id === 'discount-20')
      expect(offer).toMatchObject({
        type: 'offer',
        category: 'discount',
        priority: 1,
        text: 'acima 20%',
        trigger: { kind: 'discount-at-least', percent: 20 },
      })
    })

    it('LBL-10: readLabels loads the published catalog without schema errors', () => {
      expect(readLabels(catalogDir)).toEqual(publishedLabels())
    })
  })

  it('does not keep sellers.json in the public catalog', () => {
    expect(existsSync(join(catalogDir, 'sellers.json'))).toBe(false)
  })

  it('writes the products module for one valid watch', () => {
    const oneWatchDir = tempDir()
    writeLabels(oneWatchDir)
    writeProduct(
      oneWatchDir,
      'seculus-kit',
      productFixture(),
      { 'frente.png': photoBytes },
    )

    const labels = readLabels(oneWatchDir)
    const products = validateCatalog(oneWatchDir, labels)
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
    writeProductsModule(products, labels, outFile)
    expect(existsSync(outFile)).toBe(true)
    expect(readFileSync(outFile, 'utf8')).toContain('export const products')
    expect(readFileSync(outFile, 'utf8')).toContain('export const labels')
    expect(
      existsSync(join(oneWatchDir, 'products', 'seculus-kit', 'img', 'frente.png')),
    ).toBe(true)
  })
})
