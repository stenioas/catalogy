import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ProductSchema, type Product } from '@catalogo/shared'

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const stateByLabel = {
  Novo: 'new',
  Openbox: 'openbox',
  Usado: 'used',
} as const

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function axisValueId(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (slug.length > 0 && idPattern.test(slug)) {
    return slug
  }
  return 'value'
}

function specificationsWithoutEstado(
  specifications: unknown,
): { label: string; value: string }[] | undefined {
  if (!Array.isArray(specifications)) {
    return undefined
  }
  const rows = specifications.filter((row) => {
    if (!isRecord(row)) {
      return false
    }
    return row.label !== 'Estado'
  })
  if (rows.length === 0) {
    return undefined
  }
  return rows as { label: string; value: string }[]
}

export function migrateProduct(legacy: unknown): Product {
  if (!isRecord(legacy)) {
    throw new Error('legacy product must be an object')
  }

  const sourceState = legacy.state
  if (sourceState !== 'Novo' && sourceState !== 'Openbox' && sourceState !== 'Usado') {
    throw new Error('legacy product state must be Novo, Openbox, or Usado')
  }
  if (typeof legacy.slug !== 'string' || typeof legacy.title !== 'string') {
    throw new Error('legacy product needs slug and title')
  }
  if (!Array.isArray(legacy.images) || legacy.images.length === 0) {
    throw new Error('legacy product needs at least one image')
  }
  if (typeof legacy.price !== 'number') {
    throw new Error('legacy product needs a price')
  }

  const images = legacy.images
  const mainImage = images[0]
  const axes: Product['axes'] = []
  const variantAxes: Product['listings'][number]['variants'][number]['axes'] = []
  if (typeof legacy.color === 'string' && legacy.color.trim() !== '') {
    const value = legacy.color.trim()
    const valueId = axisValueId(value)
    axes.push({
      id: 'color',
      label: 'Cor',
      values: [{ id: valueId, value }],
    })
    variantAxes.push({ axisId: 'color', valueId })
  }

  const variant: Product['listings'][number]['variants'][number] = {
    axes: variantAxes,
    price: legacy.price,
    mainImage: mainImage as string,
  }
  if (typeof legacy.listPrice === 'number') {
    variant.listPrice = legacy.listPrice
  }
  if (typeof legacy.unmissableOffer === 'boolean') {
    variant.unmissableOffer = legacy.unmissableOffer
  }
  if (typeof legacy.observations === 'string') {
    variant.observations = legacy.observations
  }

  const listing: Product['listings'][number] = {
    id: 'listing',
    state: stateByLabel[sourceState],
    availabilityStatus: legacy.availabilityStatus as Product['listings'][number]['availabilityStatus'],
    images: images as string[],
    variants: [variant],
  }
  if (typeof legacy.enabled === 'boolean') {
    listing.enabled = legacy.enabled
  }

  const product: {
    slug: string
    title: string
    description?: string
    axes: Product['axes']
    specifications?: { label: string; value: string }[]
    listings: Product['listings']
  } = {
    slug: legacy.slug,
    title: legacy.title,
    axes,
    listings: [listing],
  }
  if (typeof legacy.description === 'string') {
    product.description = legacy.description
  }
  const specifications = specificationsWithoutEstado(legacy.specifications)
  if (specifications !== undefined) {
    product.specifications = specifications
  }

  return ProductSchema.parse(product)
}

function alreadyMigrated(raw: unknown): boolean {
  return isRecord(raw) && Array.isArray(raw.listings)
}

export function migrateCatalog(productsDir: string): void {
  for (const entry of readdirSync(productsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const filePath = join(productsDir, entry.name, 'product.json')
    if (!existsSync(filePath)) {
      continue
    }
    const raw = readJson(filePath)
    if (alreadyMigrated(raw)) {
      continue
    }
    const product = migrateProduct(raw)
    writeFileSync(filePath, `${JSON.stringify(product, null, 2)}\n`)
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1]
  if (entry === undefined) {
    return false
  }
  return import.meta.url === pathToFileURL(entry).href
}

if (isDirectRun()) {
  const productsDir = process.argv[2]
  if (productsDir === undefined) {
    throw new Error('usage: migrate-listings.ts <products-dir>')
  }
  migrateCatalog(productsDir)
}
