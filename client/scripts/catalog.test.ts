import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { validateCatalog, writeProductsModule } from './catalog'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tempDirs: string[] = []

const photoBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xfe, 0x9f, 0x3c,
  0xa1, 0x17, 0x4b, 0xc2,
])

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'catalogo-'))
  tempDirs.push(dir)
  return dir
}

function writeProduct(
  catalogDir: string,
  slug: string,
  product: unknown,
  files: Record<string, Buffer | string>,
): void {
  const productDir = join(catalogDir, 'products', slug)
  mkdirSync(join(productDir, 'img'), { recursive: true })
  writeFileSync(
    join(productDir, 'product.json'),
    typeof product === 'string' ? product : JSON.stringify(product),
  )
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(
      join(productDir, 'img', name),
      contents,
    )
  }
}

function writeValidCatalog(): string {
  const catalogDir = tempDir()
  writeProduct(
    catalogDir,
    'seculus-kit',
    {
      slug: 'seculus-kit',
      title: 'Seculus',
      state: 'Novo',
      price: 369.9,
      images: ['frente.png'],
    },
    {
      'frente.png': photoBytes,
      'notas.txt': 'isto não é foto',
    },
  )
  writeProduct(
    catalogDir,
    'curren-gold',
    {
      slug: 'curren-gold',
      title: 'CURREN',
      state: 'Novo',
      price: 199,
      images: ['pulseira.jpg'],
    },
    {
      'pulseira.jpg': photoBytes,
    },
  )
  return catalogDir
}

describe('validateCatalog', () => {
  it('returns the product list from a valid catalog directory', () => {
    const products = validateCatalog(writeValidCatalog())

    expect(products).toHaveLength(2)
    const bySlug = Object.fromEntries(products.map((product) => [product.slug, product]))
    expect(bySlug['seculus-kit']).toEqual({
      slug: 'seculus-kit',
      title: 'Seculus',
      state: 'Novo',
      price: 369.9,
      images: ['frente.png'],
    })
    expect(bySlug['curren-gold']).toEqual({
      slug: 'curren-gold',
      title: 'CURREN',
      state: 'Novo',
      price: 199,
      images: ['pulseira.jpg'],
    })
  })

  it('validates without sellers.json on disk', () => {
    const catalogDir = writeValidCatalog()
    expect(existsSync(join(catalogDir, 'sellers.json'))).toBe(false)
    expect(() => validateCatalog(catalogDir)).not.toThrow()
  })

  it('throws when product.json is not valid JSON', () => {
    const catalogDir = tempDir()
    writeProduct(catalogDir, 'seculus-kit', '{', { 'frente.png': photoBytes })

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('throws when product.json fails the shared contract', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      {
        slug: 'seculus-kit',
        title: 'Seculus',
        state: 'Novo',
        price: 0,
        images: ['frente.png'],
      },
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('throws when an images name is missing from img/', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      {
        slug: 'seculus-kit',
        title: 'Seculus',
        state: 'Novo',
        price: 369.9,
        images: ['frente.png', 'verso.png'],
      },
      { 'frente.png': photoBytes },
    )

    expect(() => validateCatalog(catalogDir)).toThrow()
  })

  it('throws when an image file in img/ is missing from images', () => {
    const catalogDir = tempDir()
    writeProduct(
      catalogDir,
      'seculus-kit',
      {
        slug: 'seculus-kit',
        title: 'Seculus',
        state: 'Novo',
        price: 369.9,
        images: ['frente.png'],
      },
      {
        'frente.png': photoBytes,
        'verso.png': photoBytes,
      },
    )

    expect(() => validateCatalog(catalogDir)).toThrow()
  })
})

describe('writeProductsModule', () => {
  it('writes image file names and does not embed photo bytes or base64', () => {
    const catalogDir = writeValidCatalog()
    const products = validateCatalog(catalogDir)
    const outFile = join(tempDir(), 'products.generated.ts')

    writeProductsModule(products, outFile)

    const written = readFileSync(outFile)
    const source = written.toString('utf8')
    expect(source.startsWith("import type { Product } from '@catalogo/shared'")).toBe(true)
    expect(source).toContain('export const products: Product[] = ')
    const parsed: unknown = JSON.parse(
      source.split('export const products: Product[] = ')[1],
    )
    expect(parsed).toEqual(products)
    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ images: ['frente.png'] }),
        expect.objectContaining({ images: ['pulseira.jpg'] }),
      ]),
    )
    expect(written.includes(photoBytes)).toBe(false)
    expect(source).not.toContain(photoBytes.toString('base64'))
  })

  it('does not emit index.json', () => {
    const catalogDir = writeValidCatalog()
    const products = validateCatalog(catalogDir)
    const outDir = tempDir()
    const outFile = join(outDir, 'products.generated.ts')

    writeProductsModule(products, outFile)

    expect(existsSync(join(catalogDir, 'index.json'))).toBe(false)
    expect(existsSync(join(outDir, 'index.json'))).toBe(false)
    expect(existsSync(outFile)).toBe(true)
  })
})

describe('generated module path', () => {
  it('is listed in .gitignore', () => {
    const gitignore = readFileSync(join(repoRoot, '.gitignore'), 'utf8')
    expect(gitignore.split('\n')).toContain(
      'client/src/catalog/products.generated.ts',
    )
  })
})

describe('initial catalog in public/', () => {
  const catalogDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'public',
    'catalog',
  )

  it('does not keep sellers.json in the public catalog', () => {
    expect(existsSync(join(catalogDir, 'sellers.json'))).toBe(false)
  })

  it('validates the committed public catalog', () => {
    expect(() => validateCatalog(catalogDir)).not.toThrow()
    expect(Array.isArray(validateCatalog(catalogDir))).toBe(true)
  })

  it('writes the products module for one valid watch', () => {
    const oneWatchDir = tempDir()
    writeProduct(
      oneWatchDir,
      'seculus-kit',
      {
        slug: 'seculus-kit',
        title: 'Seculus',
        state: 'Novo',
        price: 369.9,
        images: ['frente.png'],
      },
      { 'frente.png': photoBytes },
    )

    const products = validateCatalog(oneWatchDir)
    expect(products).toEqual([
      {
        slug: 'seculus-kit',
        title: 'Seculus',
        state: 'Novo',
        price: 369.9,
        images: ['frente.png'],
      },
    ])
    const outFile = join(tempDir(), 'products.generated.ts')
    writeProductsModule(products, outFile)
    expect(existsSync(outFile)).toBe(true)
    expect(readFileSync(outFile, 'utf8')).toContain('export const products')
    expect(
      existsSync(join(oneWatchDir, 'products', 'seculus-kit', 'img', 'frente.png')),
    ).toBe(true)
  })
})
