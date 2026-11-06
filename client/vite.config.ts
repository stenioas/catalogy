import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function omitUncitedCatalogImagesPlugin(): Plugin {
  let outDirAbs = ''
  return {
    name: 'omit-uncited-catalog-images',
    apply: 'build',
    configResolved(config) {
      outDirAbs = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const { omitUncitedImages, validateCatalog } = await import('./scripts/catalog.ts')
      const catalogDir =
        process.env.CATALOG_DIR ?? join(import.meta.dirname, 'public/catalog')
      const products = validateCatalog(catalogDir)
      omitUncitedImages(join(outDirAbs, 'catalog', 'products'), products)
    },
  }
}

function catalogProductsPlugin(): Plugin {
  return {
    name: 'catalog-products',
    async configureServer(server) {
      const { validateCatalog, writeProductsModule } = await import('./scripts/catalog.ts')
      const syncCatalogFromJson = (): void => {
        const catalogDir = join(import.meta.dirname, 'public/catalog')
        const products = validateCatalog(catalogDir)
        const outFile = join(import.meta.dirname, 'src/catalog/products.generated.ts')
        mkdirSync(dirname(outFile), { recursive: true })
        writeProductsModule(products, outFile)
      }
      syncCatalogFromJson()
      const refresh = (file: string) => {
        if (file.endsWith('product.json') && file.includes(join('catalog', 'products'))) {
          syncCatalogFromJson()
        }
      }
      server.watcher.add(join(import.meta.dirname, 'public/catalog/products'))
      server.watcher.on('add', refresh)
      server.watcher.on('change', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

export default defineConfig({
  plugins: [
    catalogProductsPlugin(),
    omitUncitedCatalogImagesPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
