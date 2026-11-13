import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import * as lucideIcons from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import type { Product } from '@catalogo/shared'

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif'])

/** PascalCase Lucide export name to `dynamicIconImports` kebab key. */
function lucideExportNameToKebab(exportName: string): string {
  return exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function isLucideIconExport(exported: unknown): boolean {
  if (typeof exported === 'function') {
    return true
  }
  if (typeof exported === 'object' && exported !== null && 'render' in exported) {
    return true
  }
  return false
}

function assertOfferIconIsValid(iconName: string, slug: string): void {
  const exported = (lucideIcons as Record<string, unknown>)[iconName]
  if (!isLucideIconExport(exported)) {
    throw new Error(
      `Unknown Lucide icon "${iconName}" in ${slug}/product.json`,
    )
  }
  const kebab = lucideExportNameToKebab(iconName)
  if (!(kebab in dynamicIconImports)) {
    throw new Error(
      `Lucide icon "${iconName}" has no dynamic import for "${kebab}" in ${slug}/product.json`,
    )
  }
}

function validateOfferIcons(product: Product, slug: string): void {
  if (!Array.isArray(product.listings)) {
    return
  }
  for (const listing of product.listings) {
    for (const variant of listing.variants ?? []) {
      for (const offer of variant.offers ?? []) {
        if (typeof offer?.icon !== 'string') {
          continue
        }
        assertOfferIconIsValid(offer.icon, slug)
      }
    }
  }
}

/** Matches listing and axis ids in ProductSchema (duplicated to avoid coupling legacy bridge to exports). */
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown
}

function slugifyAxisValueId(display: string): string {
  const s = display
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (s.length > 0 && idPattern.test(s)) {
    return s
  }
  return 'value'
}

function mapLegacyState(
  raw: unknown,
): 'new' | 'openbox' | 'used' | 'defective' {
  if (raw === 'Novo') return 'new'
  if (raw === 'Openbox') return 'openbox'
  if (raw === 'Usado') return 'used'
  if (raw === 'Com defeito') return 'defective'
  if (
    raw === 'new' ||
    raw === 'openbox' ||
    raw === 'used' ||
    raw === 'defective'
  ) {
    return raw
  }
  return 'new'
}

function filterLegacySpecifications(
  specifications: unknown,
): unknown[] | undefined {
  if (!Array.isArray(specifications)) {
    return undefined
  }
  return specifications.filter((row) => {
    if (row === null || typeof row !== 'object') {
      return false
    }
    const label = (row as { label?: unknown }).label
    return label !== 'Estado' && label !== 'Público-alvo'
  })
}

/**
 * Until T8 migrates files on disk, accept the flat product.json and reshape to
 * the listings contract so validateCatalog and omitUncitedImages run on real data.
 */
export function normalizeProductJson(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') {
    return raw
  }
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.listings)) {
    return raw
  }

  const images = o.images
  if (!Array.isArray(images) || images.length === 0) {
    return raw
  }
  const mainImage = images[0]
  if (typeof mainImage !== 'string') {
    return raw
  }

  const axes: Array<{
    id: string
    label: string
    values: { id: string; value: string }[]
  }> = []
  let variantAxes: { axisId: string; valueId: string }[] = []
  if (typeof o.color === 'string' && o.color.trim() !== '') {
    const value = o.color.trim()
    const valueId = slugifyAxisValueId(value)
    axes.push({
      id: 'color',
      label: 'Cor',
      values: [{ id: valueId, value }],
    })
    variantAxes = [{ axisId: 'color', valueId }]
  }

  const price = o.price
  if (typeof price !== 'number') {
    return raw
  }

  const listing: Record<string, unknown> = {
    id: 'listing',
    state: mapLegacyState(o.state),
    images,
    variants: [
      {
        axes: variantAxes,
        price,
        mainImage,
      },
    ],
  }

  if (typeof o.availabilityStatus === 'string') {
    listing.availabilityStatus = o.availabilityStatus
  }
  if (typeof o.enabled === 'boolean') {
    listing.enabled = o.enabled
  }

  const variant = listing.variants as Array<Record<string, unknown>>
  const v0 = variant[0]
  if (typeof o.listPrice === 'number') {
    v0.listPrice = o.listPrice
  }
  if (o.unmissableOffer === true) {
    v0.offers = [
      {
        text: 'Black Friday',
        icon: 'Gift',
        background: '#000000',
        color: '#FFFFFF',
      },
    ]
  }
  if (typeof o.observations === 'string') {
    v0.observations = o.observations
  }

  const specs = filterLegacySpecifications(o.specifications)
  const out: Record<string, unknown> = {
    slug: o.slug,
    title: o.title,
    axes,
    listings: [listing],
  }
  if (typeof o.description === 'string') {
    out.description = o.description
  }
  if (
    o.audience === 'male' ||
    o.audience === 'female' ||
    o.audience === 'unisex' ||
    o.audience === 'child'
  ) {
    out.audience = o.audience
  }
  if (specs !== undefined && specs.length > 0) {
    out.specifications = specs
  }

  return out
}

export function isImageFile(name: string): boolean {
  const dot = name.lastIndexOf('.')
  if (dot < 0) {
    return false
  }
  return imageExtensions.has(name.slice(dot + 1).toLowerCase())
}

/** Union of every file name listed in `listings[].images` (for dist and validation). */
export function citedImageNames(product: Product): string[] {
  const names = new Set<string>()
  if (!Array.isArray(product.listings)) {
    return []
  }
  for (const listing of product.listings) {
    for (const name of listing.images ?? []) {
      names.add(name)
    }
  }
  return [...names]
}

export function validateCatalog(catalogDir: string): Product[] {
  const productsDir = join(catalogDir, 'products')
  if (!existsSync(productsDir)) {
    return []
  }

  const products: Product[] = []
  for (const entry of readdirSync(productsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const productDir = join(productsDir, entry.name)
    const normalized = normalizeProductJson(readJson(join(productDir, 'product.json')))
    if (normalized === null || typeof normalized !== 'object' || Array.isArray(normalized)) {
      continue
    }
    const product = normalized as Product

    validateOfferIcons(product, entry.name)

    const imgDir = join(productDir, 'img')
    const imageFilesOnDisk = existsSync(imgDir)
      ? new Set(readdirSync(imgDir).filter(isImageFile))
      : new Set<string>()
    for (const name of citedImageNames(product)) {
      if (!imageFilesOnDisk.has(name)) {
        throw new Error(
          `Missing cited image "${name}" under ${product.slug}/img/`,
        )
      }
    }
    products.push(product)
  }

  return products
}

/**
 * Removes from `distCatalogProductsDir` (e.g. dist/catalog/products) image files
 * under each product's `img/` that no listing cites. Does not modify source `public/`.
 */
export function omitUncitedImages(
  distCatalogProductsDir: string,
  products: Product[],
): void {
  if (!existsSync(distCatalogProductsDir)) {
    return
  }
  const bySlug = new Map(products.map((p) => [p.slug, p]))
  for (const entry of readdirSync(distCatalogProductsDir, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) {
      continue
    }
    const product = bySlug.get(entry.name)
    if (!product) {
      continue
    }
    const imgDir = join(distCatalogProductsDir, entry.name, 'img')
    if (!existsSync(imgDir)) {
      continue
    }
    const cited = new Set(citedImageNames(product))
    for (const name of readdirSync(imgDir)) {
      if (!isImageFile(name) || cited.has(name)) {
        continue
      }
      unlinkSync(join(imgDir, name))
    }
  }
}

export function writeProductsModule(products: Product[], outFile: string): void {
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(
    outFile,
    `import type { Product } from '@catalogo/shared'\n\nexport const products: Product[] = ${JSON.stringify(products, null, 2)}\n`,
  )
}
