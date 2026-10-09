import { describe, expect, it } from 'vitest'
import { ProductSchema } from './product'

const baseProduct = {
  slug: 'seculus-kit',
  title: 'Seculus',
  price: 369.9,
  images: ['foto1.jpg'],
}

describe('ProductSchema price (CAT-05, CAT-06, CAT-07)', () => {
  it('rejects a price of zero', () => {
    expect(
      ProductSchema.safeParse({ ...baseProduct, price: 0 }).success,
    ).toBe(false)
  })

  it('rejects a negative price', () => {
    expect(
      ProductSchema.safeParse({ ...baseProduct, price: -1 }).success,
    ).toBe(false)
  })

  it('accepts a price of 369.9', () => {
    expect(ProductSchema.safeParse(baseProduct).success).toBe(true)
  })
})

describe('ProductSchema price truncation (CAT-08, CAT-09)', () => {
  it('truncates extra decimal digits without rounding before later checks', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      price: 369.999,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(369.99)
    }
  })
})

describe('ProductSchema listPrice (CAT-10, CAT-150)', () => {
  it('rejects listPrice less than or equal to price after truncation', () => {
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        price: 369.9,
        listPrice: 369.9,
      }).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        price: 100,
        listPrice: 50,
      }).success,
    ).toBe(false)
  })

  it('accepts listPrice greater than price after both are truncated', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      price: 369.9,
      listPrice: 450,
    })
    expect(result.success).toBe(true)
  })

  it('rejects when truncated listPrice equals truncated price', () => {
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        price: 100,
        listPrice: 100.001,
      }).success,
    ).toBe(false)
  })
})

describe('ProductSchema images (CAT-11, CAT-12, CAT-14, CAT-15)', () => {
  it('rejects an empty images list', () => {
    expect(
      ProductSchema.safeParse({ ...baseProduct, images: [] }).success,
    ).toBe(false)
  })

  it('rejects an image file name containing slash or backslash', () => {
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        images: ['path/foto.jpg'],
      }).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        images: ['path\\foto.jpg'],
      }).success,
    ).toBe(false)
  })

  it('accepts allowed extensions in any letter case', () => {
    for (const name of [
      'a.jpg',
      'b.JPEG',
      'c.png',
      'd.WebP',
      'e.avif',
    ]) {
      const result = ProductSchema.safeParse({
        ...baseProduct,
        images: [name],
      })
      expect(result.success).toBe(true)
    }
  })

  it('keeps the image file name exactly as written in images', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      images: ['Minha-Foto.JPG'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.images[0]).toBe('Minha-Foto.JPG')
    }
  })

  it('rejects an image file name without an allowed extension', () => {
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        images: ['foto.gif'],
      }).success,
    ).toBe(false)
  })
})

describe('ProductSchema optional fields (CAT-13)', () => {
  it('accepts a product when listPrice, details, specifications, and observations are omitted', () => {
    expect(ProductSchema.safeParse(baseProduct).success).toBe(true)
  })

  it('accepts optional fields when present', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      listPrice: 450,
      details: 'Detalhes do relógio.',
      specifications: [{ label: 'Marca', value: 'Seculus' }],
      observations: 'Observação.',
    })
    expect(result.success).toBe(true)
  })
})
