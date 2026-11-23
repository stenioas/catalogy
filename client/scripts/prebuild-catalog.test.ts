import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  normalizeProductJson,
  readLabels,
  validateCatalog,
  writeProductsModule,
} from './catalog'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function publishedProductJsonPaths(catalogDir: string): string[] {
  const productsDir = join(catalogDir, 'products')
  const paths: string[] = []
  for (const entry of readdirSync(productsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      paths.push(join(productsDir, entry.name, 'product.json'))
    }
  }
  return paths
}

function variantsInProductJson(filePath: string): unknown[] {
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as {
    listings?: Array<{ variants?: unknown[] }>
  }
  const variants: unknown[] = []
  for (const listing of raw.listings ?? []) {
    variants.push(...(listing.variants ?? []))
  }
  return variants
}

describe('catalog prebuild (before vite build)', () => {
  it('validates public/catalog and writes products.generated.ts', () => {
    const catalogDir = process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')
    const outFile = join(clientRoot, 'src/catalog/products.generated.ts')
    expect(() => validateCatalog(catalogDir)).not.toThrow()
    const products = validateCatalog(catalogDir)
    const labels = readLabels(catalogDir)
    expect(Array.isArray(products)).toBe(true)
    writeProductsModule(products, labels, outFile)
    expect(existsSync(outFile)).toBe(true)
    const generated = readFileSync(outFile, 'utf8')
    expect(generated).toContain('export const products')
    expect(generated).toContain('export const labels')
  })
})

describe('published catalog migration (OSC-11, OSC-12, OSC-15)', () => {
  const catalogDir = process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')

  it('OSC-11: no published product.json contains unmissableOffer', () => {
    for (const filePath of publishedProductJsonPaths(catalogDir)) {
      for (const variant of variantsInProductJson(filePath)) {
        expect(variant).not.toHaveProperty('unmissableOffer')
      }
    }
  })

  it('OSC-12: a legacy JSON without unmissableOffer migrates without legacy or new offers', () => {
    const legacyJson = JSON.parse(`{
      "slug": "legacy-watch",
      "state": "Novo",
      "title": "Legacy",
      "price": 100,
      "images": ["a.png"],
      "availabilityStatus": "available"
    }`)
    const migrated = normalizeProductJson(legacyJson) as {
      listings: Array<{ variants: Array<Record<string, unknown>> }>
    }
    const variant = migrated.listings[0].variants[0]

    expect(variant).not.toHaveProperty('unmissableOffer')
    expect(variant).not.toHaveProperty('offers')
  })

  it('OSC-15: products.generated.ts does not contain unmissableOffer', () => {
    const catalogDirResolved =
      process.env.CATALOG_DIR ?? join(clientRoot, 'public/catalog')
    const outFile = join(clientRoot, 'src/catalog/products.generated.ts')
    const products = validateCatalog(catalogDirResolved)
    writeProductsModule(products, readLabels(catalogDirResolved), outFile)
    expect(readFileSync(outFile, 'utf8')).not.toContain('unmissableOffer')
  })
})

describe('README label documentation (LBL-44)', () => {
  it('documents global labels.json for campaign and offers on the card and product page', () => {
    const readme = readFileSync(join(clientRoot, '..', 'README.md'), 'utf8')

    expect(readme).toContain('labels.json')
    expect(readme).toContain('shortText')
    expect(readme).toMatch(/badge.*canto inferior esquerdo da foto/i)
    expect(readme).toMatch(/ofertas.*acima do preço/i)
    expect(readme).not.toContain('unmissableOffer')
    expect(readme).not.toMatch(/badge de oferta (?:sobre|acima d[ae]) foto/i)
  })

  it('does not document variant offers as the source of the campaign badge', () => {
    const readme = readFileSync(join(clientRoot, '..', 'README.md'), 'utf8')

    expect(readme).not.toMatch(/`offers`\s+fica em cada variante/i)
    expect(readme).not.toContain('acima da disponibilidade')
  })
})

describe('README home filters (LBL-44, T12)', () => {
  it('documents the filter pills with label names and fixed filters', () => {
    const readme = readFileSync(join(clientRoot, '..', 'README.md'), 'utf8')

    expect(readme).toContain('**Todos**')
    expect(readme).toContain('**Black Friday**')
    expect(readme).toContain('**acima 20%**')
    expect(readme).not.toContain('**20%+ de desconto**')
    expect(readme).toContain('**Feminino**')
    expect(readme).toContain('**Masculino**')
    expect(readme).toContain('**Novos**')
    expect(readme).toContain('**Openbox**')
    expect(readme).toContain('**Usados**')
  })

  it('documents the filter query tokens', () => {
    const readme = readFileSync(join(clientRoot, '..', 'README.md'), 'utf8')

    expect(readme).toContain('`filter`')
    expect(readme).toContain('`black-friday`')
    expect(readme).toContain('`discount-20`')
    expect(readme).not.toMatch(/`filter`\s+aceita\s+`discount`/i)
    expect(readme).toContain('`female`')
    expect(readme).toContain('`male`')
    expect(readme).toContain('`new`')
    expect(readme).toContain('`openbox`')
    expect(readme).toContain('`used`')
  })
})

describe('contrato do relógio (FILT-05)', () => {
  const contratoPath = join(clientRoot, '..', 'docs', 'contrato-relogio.md')

  it('coloca state e availabilityStatus na variante com leitura new e on_order', () => {
    const contrato = readFileSync(contratoPath, 'utf8')

    expect(contrato).toContain('Na leitura, ausente vale `new`')
    expect(contrato).toContain('Na leitura, ausente vale `on_order`')
    expect(contrato).toContain(
      'O anúncio não declara `state` nem `availabilityStatus`. A condição fica em cada variante.',
    )
  })

  it('permite on_order com estado diferente de new', () => {
    const contrato = readFileSync(contratoPath, 'utf8')

    expect(contrato).toContain(
      'uma variante com `availabilityStatus` `on_order` pode usar outro estado',
    )
  })

  it('descreve o cadastro product-register em main-listing sem price', () => {
    const contrato = readFileSync(contratoPath, 'utf8')

    expect(contrato).toContain('`product-register`')
    expect(contrato).toContain('id `main-listing`')
    expect(contrato).toContain('`availabilityStatus` `on_order`')
    expect(contrato).toContain('omite `price`')
  })
})

describe('product-register skill (FILT-05)', () => {
  it('grava main-listing com variantes on_order sem price', () => {
    const skill = readFileSync(
      join(clientRoot, '..', '.agents/skills/product-register/SKILL.md'),
      'utf8',
    )

    expect(skill).toContain('id: "main-listing"')
    expect(skill).toContain(
      'Cada variante recebe `availabilityStatus` `on_order` e omite `price`',
    )
    expect(skill).toContain(
      'Variante: `availabilityStatus` `on_order`; omita `price`',
    )
  })
})
