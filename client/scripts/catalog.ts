import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { ProductSchema, type Product } from '@catalogo/shared'

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif'])

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown
}

function isImageFile(name: string): boolean {
  const dot = name.lastIndexOf('.')
  if (dot < 0) {
    return false
  }
  return imageExtensions.has(name.slice(dot + 1).toLowerCase())
}

/** Union of every file name listed in `listings[].images` (for dist and validation). */
export function citedImageNames(product: Product): string[] {
  const names = new Set<string>()
  for (const listing of product.listings) {
    for (const name of listing.images) {
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
    const parsed = ProductSchema.safeParse(
      readJson(join(productDir, 'product.json')),
    )
    if (!parsed.success) {
      throw new Error(`${entry.name}/product.json failed the shared contract`)
    }

    const imgDir = join(productDir, 'img')
    const imageFilesOnDisk = existsSync(imgDir)
      ? new Set(readdirSync(imgDir).filter(isImageFile))
      : new Set<string>()
    for (const name of citedImageNames(parsed.data)) {
      if (!imageFilesOnDisk.has(name)) {
        throw new Error(
          `Missing cited image "${name}" under ${parsed.data.slug}/img/`,
        )
      }
    }
    products.push(parsed.data)
  }

  return products
}

export function writeProductsModule(products: Product[], outFile: string): void {
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(
    outFile,
    `import type { Product } from '@catalogo/shared'\n\nexport const products: Product[] = ${JSON.stringify(products, null, 2)}\n`,
  )
}
