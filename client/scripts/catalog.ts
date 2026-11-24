import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import * as lucideIcons from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { parseLabels, type Label, type Product } from '@catalogo/shared'

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

function assertOfferIconIsValid(iconName: string, context: string): void {
  const exported = (lucideIcons as Record<string, unknown>)[iconName]
  if (!isLucideIconExport(exported)) {
    throw new Error(`Unknown Lucide icon "${iconName}" in ${context}`)
  }
  const kebab = lucideExportNameToKebab(iconName)
  if (!(kebab in dynamicIconImports)) {
    throw new Error(
      `Lucide icon "${iconName}" has no dynamic import for "${kebab}" in ${context}`,
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
    id: 'main-listing',
    images,
    variants: [
      {
        axes: variantAxes,
        state: mapLegacyState(o.state),
        price,
        mainImage,
      },
    ],
  }

  const variant = listing.variants as Array<Record<string, unknown>>
  if (typeof o.availabilityStatus === 'string') {
    variant[0].availabilityStatus = o.availabilityStatus
  }
  if (typeof o.enabled === 'boolean') {
    listing.enabled = o.enabled
  }

  const v0 = variant[0]
  if (typeof o.listPrice === 'number') {
    v0.listPrice = o.listPrice
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

/**
 * Files copied from `public/catalog` into the published site.
 * `media/` stays on disk for registration and is omitted from dist.
 * Uncited photos under `img/` and `img/thumbs/` are omitted too.
 */
export function isPublishedCatalogFile(
  relPath: string,
  citedBySlug: ReadonlyMap<string, ReadonlySet<string>>,
): boolean {
  const normalized = relPath.split('\\').join('/')
  if (/^products\/[^/]+\/media(?:\/|$)/.test(normalized)) {
    return false
  }
  const image = normalized.match(/^products\/([^/]+)\/img\/(?:thumbs\/)?([^/]+)$/)
  if (image !== null && isImageFile(image[2])) {
    const cited = citedBySlug.get(image[1])
    if (cited !== undefined && !cited.has(image[2])) {
      return false
    }
  }
  return true
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

function assertDisabledLabelIds(
  ids: string[] | undefined,
  context: string,
  labelIds: ReadonlySet<string>,
): void {
  for (const id of ids ?? []) {
    if (!labelIds.has(id)) {
      throw new Error(`Unknown label id "${id}" in ${context}`)
    }
  }
}

function validateDisabledLabels(
  product: Product,
  slug: string,
  labelIds: ReadonlySet<string>,
): void {
  const root = product as Product & { disabledLabels?: string[] }
  assertDisabledLabelIds(root.disabledLabels, `${slug}/product.json`, labelIds)
  for (const listing of product.listings ?? []) {
    const listingRecord = listing as typeof listing & { disabledLabels?: string[] }
    assertDisabledLabelIds(
      listingRecord.disabledLabels,
      `${slug}/product.json listing "${listing.id}"`,
      labelIds,
    )
    for (const variant of listing.variants ?? []) {
      assertDisabledLabelIds(
        variant.disabledLabels,
        `${slug}/product.json listing "${listing.id}" variant`,
        labelIds,
      )
    }
  }
}

export function readLabels(catalogDir: string): Label[] {
  const labelsPath = join(catalogDir, 'labels.json')
  if (!existsSync(labelsPath)) {
    throw new Error(`Missing ${labelsPath}`)
  }
  const labels = parseLabels(readJson(labelsPath))
  for (const label of labels) {
    assertOfferIconIsValid(label.icon, `labels.json (id "${label.id}")`)
  }
  return labels
}

export function validateCatalog(catalogDir: string, labels?: Label[]): Product[] {
  const resolvedLabels = labels ?? readLabels(catalogDir)
  const labelIds = new Set(resolvedLabels.map((label) => label.id))

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
    validateDisabledLabels(product, entry.name, labelIds)

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
      const full = join(imgDir, name)
      if (name === 'thumbs') {
        for (const thumb of readdirSync(full)) {
          if (!isImageFile(thumb) || cited.has(thumb)) {
            continue
          }
          unlinkSync(join(full, thumb))
        }
        continue
      }
      if (!isImageFile(name) || cited.has(name)) {
        continue
      }
      unlinkSync(full)
    }
  }
}

/** Drops each product's `media/` from dist. Does not modify source `public/`. */
export function omitCatalogMedia(distCatalogProductsDir: string): void {
  if (!existsSync(distCatalogProductsDir)) {
    return
  }
  for (const entry of readdirSync(distCatalogProductsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    rmSync(join(distCatalogProductsDir, entry.name, 'media'), {
      recursive: true,
      force: true,
    })
  }
}

export function writeProductsModule(
  products: Product[],
  labels: Label[],
  outFile: string,
): void {
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(
    outFile,
    `import type { Product, Label } from '@catalogo/shared'\n\nexport const products: Product[] = ${JSON.stringify(products, null, 2)}\n\nexport const labels: Label[] = ${JSON.stringify(labels, null, 2)}\n`,
  )
}
