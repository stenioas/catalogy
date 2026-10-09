import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateCatalog, writeProductsModule } from './catalog'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('catalog prebuild (before vite build)', () => {
  it('validates public/catalog and writes products.generated.ts', () => {
    const catalogDir = process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')
    const outFile = join(clientRoot, 'src/catalog/products.generated.ts')
    const products = validateCatalog(catalogDir)
    writeProductsModule(products, outFile)
    expect(products).toEqual([])
  })
})
