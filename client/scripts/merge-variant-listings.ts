import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  mergeListings,
  ProductSchema,
  type Product,
} from '@catalogo/shared'

export interface MergeVariantListingsResult {
  failedSlugs: string[]
}

function regenerateProductsModule(productsDir: string, generatedFile: string): void {
  const products = readdirSync(productsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      JSON.parse(
        readFileSync(join(productsDir, entry.name, 'product.json'), 'utf8'),
      ) as Product,
    )
  mkdirSync(dirname(generatedFile), { recursive: true })
  writeFileSync(
    generatedFile,
    `import type { Product } from '@catalogo/shared'\n\nexport const products: Product[] = ${JSON.stringify(products, null, 2)}\n`,
  )
}

export function mergeVariantListings(
  catalogDir: string,
  generatedFile: string,
  reportFailure: (slug: string) => void = (slug) => {
    console.error(`Não foi possível migrar ${slug}`)
  },
): MergeVariantListingsResult {
  const productsDir = join(catalogDir, 'products')
  const failedSlugs: string[] = []

  for (const entry of readdirSync(productsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const filePath = join(productsDir, entry.name, 'product.json')
    try {
      const source = JSON.parse(readFileSync(filePath, 'utf8')) as Product
      const parsed = ProductSchema.safeParse(mergeListings(source))
      if (!parsed.success) {
        failedSlugs.push(entry.name)
        reportFailure(entry.name)
        continue
      }
      writeFileSync(filePath, `${JSON.stringify(parsed.data, null, 2)}\n`)
    } catch {
      failedSlugs.push(entry.name)
      reportFailure(entry.name)
    }
  }

  regenerateProductsModule(productsDir, generatedFile)
  return { failedSlugs }
}

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

if (
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  mergeVariantListings(
    join(clientRoot, 'public/catalog'),
    join(clientRoot, 'src/catalog/products.generated.ts'),
  )
}
