import { describe, expect, it } from 'vitest'
import {
  ProductSchema,
  SPECIFICATION_LABELS,
} from './product'
import { SPECIFICATION_LABELS as exportedLabels } from '../index'

const baseProduct = {
  slug: 'seculus-kit',
  title: 'Seculus',
  state: 'Novo',
  availabilityStatus: 'available',
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
  it('accepts a product when listPrice, description, specifications, and observations are omitted', () => {
    expect(ProductSchema.safeParse(baseProduct).success).toBe(true)
  })

  it('accepts optional fields when present', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      listPrice: 450,
      description: 'Descrição do relógio.',
      specifications: [{ label: 'Marca', value: 'Seculus' }],
      observations: 'Observação.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.observations).toBe('Observação.')
    }
  })

  it('accepts unmissableOffer only as a boolean and omits it by default', () => {
    const omitted = ProductSchema.safeParse(baseProduct)
    const turnedOn = ProductSchema.safeParse({ ...baseProduct, unmissableOffer: true })
    const turnedOff = ProductSchema.safeParse({ ...baseProduct, unmissableOffer: false })
    expect(omitted.success && omitted.data.unmissableOffer).toBeUndefined()
    expect(turnedOn.success && turnedOn.data.unmissableOffer).toBe(true)
    expect(turnedOff.success && turnedOff.data.unmissableOffer).toBe(false)
    expect(ProductSchema.safeParse({ ...baseProduct, unmissableOffer: 'true' }).success).toBe(false)
  })

  it('keeps a product listed when enabled is omitted or true, and stores false', () => {
    const omitted = ProductSchema.safeParse(baseProduct)
    const turnedOn = ProductSchema.safeParse({ ...baseProduct, enabled: true })
    const turnedOff = ProductSchema.safeParse({ ...baseProduct, enabled: false })
    expect(omitted.success && omitted.data.enabled).toBeUndefined()
    expect(turnedOn.success && turnedOn.data.enabled).toBe(true)
    expect(turnedOff.success && turnedOff.data.enabled).toBe(false)
    expect(ProductSchema.safeParse({ ...baseProduct, enabled: 'false' }).success).toBe(false)
  })
})

describe('ProductSchema color (CATREF-52, CATREF-53, CATREF-61)', () => {
  it('accepts a product without color and leaves the property omitted', () => {
    const result = ProductSchema.safeParse(baseProduct)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('color')
    }
  })

  it.each(['Azul petróleo', '', '  '])(
    'preserves color string %j without transformation',
    (color) => {
      const result = ProductSchema.safeParse({ ...baseProduct, color })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe(color)
      }
    },
  )

  it.each([
    { label: 'null', color: null },
    { label: 'number', color: 42 },
    { label: 'boolean', color: true },
    { label: 'array', color: [] },
    { label: 'object', color: {} },
  ])('rejects color with a $label value', ({ color }) => {
    expect(ProductSchema.safeParse({ ...baseProduct, color }).success).toBe(
      false,
    )
  })
})

describe('ProductSchema slug (CAT-04)', () => {
  it('rejects a slug outside lowercase letters, digits, and single hyphens', () => {
    expect(
      ProductSchema.safeParse({ ...baseProduct, slug: 'Seculus' }).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse({ ...baseProduct, slug: 'seculus-' }).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse({ ...baseProduct, slug: '-seculus' }).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse({ ...baseProduct, slug: 'seculus--kit' }).success,
    ).toBe(false)
  })

  it('accepts a slug matching the contract pattern', () => {
    expect(ProductSchema.safeParse(baseProduct).success).toBe(true)
    expect(
      ProductSchema.safeParse({ ...baseProduct, slug: 'seculus-kit' }).success,
    ).toBe(true)
  })
})

describe('ProductSchema state', () => {
  it.each(['Novo', 'Usado', 'Openbox'])('accepts state %s', (state) => {
    const result = ProductSchema.parse({ ...baseProduct, state })
    expect(result.state).toBe(state)
  })

  it.each([undefined, null, '', 'novo', 'Lacrado', true])('rejects missing or invalid state %s', (state) => {
    expect(ProductSchema.safeParse({ ...baseProduct, state }).success).toBe(false)
  })

  it('does not use the legacy new flag as a replacement for state', () => {
    expect(ProductSchema.safeParse({ ...baseProduct, state: undefined, new: true }).success).toBe(false)
    expect(ProductSchema.parse({ ...baseProduct, new: true })).not.toHaveProperty('new')
  })
})

const canonicalLabelsInOrder = [
  'Marca',
  'Modelo',
  'Homage de',
  'Estado',
  'Tipo do relógio',
  'Funções',
  'Tipo de movimento',
  'Movimento',
  'Material da caixa',
  'Material da pulseira',
  'Material do vidro',
  'Material do bisel',
  'Resistência à água',
  'Largura da pulseira',
  'Tamanho da caixa',
  'Coroa',
  'Tampa inferior',
  'Diâmetro do mostrador',
  'Espessura da caixa',
  'Garantia',
] as const

describe('SPECIFICATION_LABELS (SPEC-01)', () => {
  it('exports the 20 canonical labels in spec order from the schema module', () => {
    expect([...SPECIFICATION_LABELS]).toEqual([...canonicalLabelsInOrder])
  })

  it('re-exports the same list from the shared package entry', () => {
    expect([...exportedLabels]).toEqual([...canonicalLabelsInOrder])
  })
})

describe('ProductSchema specifications (SPEC-02–SPEC-08)', () => {
  it('accepts a product when specifications is omitted (SPEC-02)', () => {
    expect(ProductSchema.safeParse(baseProduct).success).toBe(true)
  })

  it('accepts a product whose specifications array is empty (SPEC-03)', () => {
    expect(
      ProductSchema.safeParse({ ...baseProduct, specifications: [] }).success,
    ).toBe(true)
  })

  it('accepts a valid subset with each label at most once and non-blank values (SPEC-04)', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      specifications: [
        { label: 'Marca', value: 'Seculus' },
        { label: 'Garantia', value: '90 dias.' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts specifications not in exported label order (SPEC-05)', () => {
    const result = ProductSchema.safeParse({
      ...baseProduct,
      specifications: [
        { label: 'Garantia', value: '90 dias.' },
        { label: 'Marca', value: 'Seculus' },
        { label: 'Modelo', value: 'Kit Cantil' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown specification label (SPEC-06)', () => {
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        specifications: [{ label: 'Formato da caixa', value: 'Redonda' }],
      }).success,
    ).toBe(false)
  })

  it('rejects the same specification label more than once (SPEC-07)', () => {
    expect(
      ProductSchema.safeParse({
        ...baseProduct,
        specifications: [
          { label: 'Marca', value: 'Seculus' },
          { label: 'Marca', value: 'Outra' },
        ],
      }).success,
    ).toBe(false)
  })

  it.each(['', '   '])(
    'rejects a specification value that is empty or only spaces (SPEC-08): %j',
    (value) => {
      expect(
        ProductSchema.safeParse({
          ...baseProduct,
          specifications: [{ label: 'Marca', value }],
        }).success,
      ).toBe(false)
    },
  )
})

describe('ProductSchema availabilityStatus', () => {
  it.each(['available', 'on_order', 'unavailable', 'sold_out'])('accepts availabilityStatus %s', (availabilityStatus) => {
    expect(ProductSchema.parse({ ...baseProduct, availabilityStatus }).availabilityStatus).toBe(availabilityStatus)
  })

  it.each([undefined, null, '', 'Em estoque', 'Sob encomenda', 'unknown', true])('rejects missing or invalid availabilityStatus %s', (availabilityStatus) => {
    expect(ProductSchema.safeParse({ ...baseProduct, availabilityStatus }).success).toBe(false)
  })

  it('requires availabilityStatus even when the old availability field is supplied', () => {
    expect(ProductSchema.safeParse({ ...baseProduct, availabilityStatus: undefined, availability: 'Em estoque' }).success).toBe(false)
  })
})
