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

function sameNameSet(left: string[], right: string[]): boolean {
  const rightNames = new Set(right)
  if (new Set(left).size !== rightNames.size) {
    return false
  }
  return left.every((name) => rightNames.has(name))
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
    const imageFiles = existsSync(imgDir)
      ? readdirSync(imgDir).filter(isImageFile)
      : []
    if (!sameNameSet(parsed.data.images, imageFiles)) {
      throw new Error(
        `Image set for ${parsed.data.slug} does not match img/`,
      )
    }
    products.push(parsed.data)
  }

  return products
}

export function writeProductsModule(products: Product[], outFile: string): void {
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(
    outFile,
    `export const products = ${JSON.stringify(products, null, 2)}\n`,
  )
}
