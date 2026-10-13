import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function syncCatalogFromJson(): void {
  const productsDir = join(import.meta.dirname, 'public/catalog/products')
  const products: unknown[] = []
  if (existsSync(productsDir)) {
    for (const entry of readdirSync(productsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue
      }
      const jsonPath = join(productsDir, entry.name, 'product.json')
      if (!existsSync(jsonPath)) {
        continue
      }
      products.push(JSON.parse(readFileSync(jsonPath, 'utf8')) as unknown)
    }
  }
  const outFile = join(import.meta.dirname, 'src/catalog/products.generated.ts')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(
    outFile,
    `import type { Product } from '@catalogo/shared'\n\nexport const products: Product[] = ${JSON.stringify(products, null, 2)}\n`,
  )
}

function catalogProductsPlugin(): Plugin {
  return {
    name: 'catalog-products',
    configureServer(server) {
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
  plugins: [catalogProductsPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
