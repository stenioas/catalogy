import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ProductSchema } from '@catalogo/shared'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateCatalog, migrateProduct } from './migrate-listings'

const productsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public/catalog/products',
)

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'migrate-listings-'))
  tempDirs.push(dir)
  return dir
}

type LegacyProduct = {
  slug: string
  title: string
  description?: string
  state: 'Novo' | 'Openbox' | 'Usado'
  color?: string
  price: number
  listPrice?: number
  unmissableOffer?: boolean
  enabled?: boolean
  images: string[]
  observations?: string
  availabilityStatus: 'available' | 'coming_soon' | 'on_order'
  specifications?: { label: string; value: string }[]
}

function legacyProduct(overrides: Partial<LegacyProduct> = {}): LegacyProduct {
  return {
    slug: 'relogio-fonte',
    title: 'Relógio fonte',
    description: 'Descrição original.',
    state: 'Novo',
    price: 100,
    images: ['frente.png', 'verso.png'],
    availabilityStatus: 'available',
    specifications: [
      { label: 'Marca', value: 'Marca fonte' },
      { label: 'Estado', value: 'Novo' },
      { label: 'Modelo', value: '100' },
    ],
    ...overrides,
  }
}

function writeLegacyFile(root: string, product: LegacyProduct): void {
  const dir = join(root, product.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'product.json'), `${JSON.stringify(product, null, 2)}\n`)
}

function readProductFile(root: string, slug: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, slug, 'product.json'), 'utf8')) as Record<
    string,
    unknown
  >
}

describe('migrateProduct', () => {
  it('keeps the slug and emits one listing id listing with one variant', () => {
    const migrated = migrateProduct(legacyProduct({ slug: 'alfa-1' }))

    expect(migrated.slug).toBe('alfa-1')
    expect(migrated.listings).toHaveLength(1)
    expect(migrated.listings[0].id).toBe('listing')
    expect(migrated.listings[0].variants).toHaveLength(1)
  })

  it.each([
    ['Azul', 'azul'],
    ['Prata/Azul', 'prata-azul'],
    ['Várias cores', 'varias-cores'],
    ['Verde/Preto (Starbucks)', 'verde-preto-starbucks'],
    ['Rosé Gold', 'rose-gold'],
    ['Silver White | Silver Black', 'silver-white-silver-black'],
  ] as const)(
    'turns color %s into axis color labeled Cor with value id %s and no alias',
    (color, valueId) => {
      const migrated = migrateProduct(legacyProduct({ color }))
      const axis = migrated.axes[0]
      const axisValue = axis.values[0]

      expect(migrated.axes).toHaveLength(1)
      expect(axis.id).toBe('color')
      expect(axis.label).toBe('Cor')
      expect(axisValue.value).toBe(color)
      expect(axisValue.id).toBe(valueId)
      expect(axisValue).not.toHaveProperty('alias')
      expect(migrated.listings[0].variants[0].axes).toEqual([
        { axisId: 'color', valueId },
      ])
    },
  )

  it('declares no axes when the source product has no color', () => {
    const migrated = migrateProduct(legacyProduct())

    expect(migrated.axes).toEqual([])
    expect(migrated.listings[0].variants[0].axes).toEqual([])
  })

  it.each([
    ['Novo', 'new'],
    ['Openbox', 'openbox'],
    ['Usado', 'used'],
  ] as const)('maps %s to %s', (sourceState, state) => {
    const migrated = migrateProduct(legacyProduct({ state: sourceState }))

    expect(migrated.listings[0].state).toBe(state)
  })

  it.each(['available', 'coming_soon', 'on_order'] as const)(
    'keeps availabilityStatus %s and the source image order',
    (availabilityStatus) => {
      const images = ['terceira.png', 'primeira.png', 'segunda.png']
      const migrated = migrateProduct(
        legacyProduct({ availabilityStatus, images }),
      )

      expect(migrated.listings[0].availabilityStatus).toBe(availabilityStatus)
      expect(migrated.listings[0].images).toEqual(images)
    },
  )

  it('keeps enabled only when the source file had that field', () => {
    const absent = migrateProduct(legacyProduct())
    const hidden = migrateProduct(legacyProduct({ enabled: false }))
    const shown = migrateProduct(legacyProduct({ enabled: true }))

    expect(absent.listings[0]).not.toHaveProperty('enabled')
    expect(hidden.listings[0].enabled).toBe(false)
    expect(shown.listings[0].enabled).toBe(true)
  })

  it('keeps price, listPrice, unmissableOffer and observations when present, and uses the first image as mainImage', () => {
    const images = ['capa.png', 'detalhe.png']
    const migrated = migrateProduct(
      legacyProduct({
        price: 279.9,
        listPrice: 369.9,
        unmissableOffer: false,
        observations: 'Acompanha caixa',
        images,
      }),
    )
    const variant = migrated.listings[0].variants[0]

    expect(variant.price).toBe(279.9)
    expect(variant.listPrice).toBe(369.9)
    expect(variant.unmissableOffer).toBe(false)
    expect(variant.observations).toBe('Acompanha caixa')
    expect(variant.mainImage).toBe('capa.png')
  })

  it('omits listPrice, unmissableOffer and observations when the source omitted them', () => {
    const variant = migrateProduct(legacyProduct()).listings[0].variants[0]

    expect(variant.price).toBe(100)
    expect(variant).not.toHaveProperty('listPrice')
    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant).not.toHaveProperty('observations')
    expect(variant.mainImage).toBe('frente.png')
  })

  it('keeps an unmissable offer that the source set to true', () => {
    const variant = migrateProduct(
      legacyProduct({ unmissableOffer: true }),
    ).listings[0].variants[0]

    expect(variant.unmissableOffer).toBe(true)
  })

  it('keeps title, description and every specification except rows labeled Estado', () => {
    const migrated = migrateProduct(
      legacyProduct({
        title: 'Kit Seculus',
        description: 'Texto que permanece.',
        specifications: [
          { label: 'Marca', value: 'Seculus' },
          { label: 'Estado', value: 'Embalagem foi aberta' },
          { label: 'Resistência à água', value: '50m (5 ATM)' },
        ],
      }),
    )

    expect(migrated.title).toBe('Kit Seculus')
    expect(migrated.description).toBe('Texto que permanece.')
    expect(migrated.specifications).toEqual([
      { label: 'Marca', value: 'Seculus' },
      { label: 'Resistência à água', value: '50m (5 ATM)' },
    ])
  })

  it('accepts the migrated fixture in ProductSchema', () => {
    const migrated = migrateProduct(
      legacyProduct({ color: 'Azul', state: 'Openbox', enabled: false }),
    )

    expect(ProductSchema.safeParse(migrated).success).toBe(true)
  })
})

describe('migrateCatalog', () => {
  it('writes each source file as its own product and does not merge them', () => {
    const root = tempDir()
    writeLegacyFile(
      root,
      legacyProduct({
        slug: 'alfa',
        title: 'Alfa',
        color: 'Azul',
        state: 'Novo',
        images: ['a.png'],
      }),
    )
    writeLegacyFile(
      root,
      legacyProduct({
        slug: 'beta',
        title: 'Beta',
        state: 'Usado',
        images: ['b.png', 'c.png'],
        specifications: [{ label: 'Estado', value: 'Usado' }],
      }),
    )

    migrateCatalog(root)

    expect(existsSync(join(root, 'alfa', 'product.json'))).toBe(true)
    expect(existsSync(join(root, 'beta', 'product.json'))).toBe(true)

    const alfa = readProductFile(root, 'alfa')
    const beta = readProductFile(root, 'beta')
    const alfaListings = alfa.listings as { id: string; variants: unknown[] }[]
    const betaListings = beta.listings as { id: string; variants: unknown[] }[]

    expect(alfa.slug).toBe('alfa')
    expect(beta.slug).toBe('beta')
    expect(alfaListings).toHaveLength(1)
    expect(betaListings).toHaveLength(1)
    expect(alfaListings[0].id).toBe('listing')
    expect(betaListings[0].id).toBe('listing')
    expect(alfaListings[0].variants).toHaveLength(1)
    expect(betaListings[0].variants).toHaveLength(1)
    expect(alfa.listings).not.toEqual(beta.listings)
  })
})

const legacyRootKeys = [
  'state',
  'color',
  'price',
  'listPrice',
  'images',
  'unmissableOffer',
  'observations',
  'enabled',
] as const

describe('migrated catalog product.json', () => {
  it('stores every current product in the new shape and ProductSchema accepts each file', () => {
    const slugs = readdirSync(productsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((slug) => existsSync(join(productsDir, slug, 'product.json')))

    expect(slugs.length).toBeGreaterThan(0)

    for (const slug of slugs) {
      const raw = readProductFile(productsDir, slug)
      const parsed = ProductSchema.safeParse(raw)

      expect(parsed.success, parsed.success ? slug : JSON.stringify(parsed.error.issues)).toBe(
        true,
      )
      expect(raw.slug).toBe(slug)
      for (const key of legacyRootKeys) {
        expect(raw, slug).not.toHaveProperty(key)
      }

      const listings = raw.listings as {
        id: string
        images: string[]
        specifications?: { label: string }[]
        variants: { mainImage: string; axes: unknown[] }[]
      }[]
      expect(listings).toHaveLength(1)
      expect(listings[0].id).toBe('listing')
      expect(listings[0].variants).toHaveLength(1)
      expect(listings[0].variants[0].mainImage).toBe(listings[0].images[0])

      const productSpecs = (raw.specifications ?? []) as { label: string }[]
      const listingSpecs = listings[0].specifications ?? []
      expect(productSpecs.some((row) => row.label === 'Estado')).toBe(false)
      expect(listingSpecs.some((row) => row.label === 'Estado')).toBe(false)
    }
  })
})
