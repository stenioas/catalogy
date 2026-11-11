import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ProductSchema,
  SPECIFICATION_LABELS,
  isProductListed,
} from './product.ts'
import { SPECIFICATION_LABELS as exportedLabels } from '../index.ts'

const canonicalLabelsInOrder = [
  'Marca',
  'Modelo',
  'Homage de',
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

function variant(overrides: Record<string, unknown> = {}) {
  return {
    axes: [] as { axisId: string; valueId: string }[],
    price: 369.9,
    mainImage: 'foto1.jpg',
    ...overrides,
  }
}

function listing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing',
    state: 'new',
    availabilityStatus: 'available',
    images: ['foto1.jpg'],
    variants: [variant()],
    ...overrides,
  }
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'seculus-kit',
    title: 'Seculus',
    axes: [] as {
      id: string
      label: string
      values: { id: string; value: string; alias?: string }[]
    }[],
    listings: [listing()],
    ...overrides,
  }
}

function productWithAxes() {
  return product({
    description: 'Descrição do relógio.',
    audience: 'male',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        values: [
          { id: 'preto', value: 'Preto', alias: 'Black' },
          { id: 'azul', value: 'Azul' },
        ],
      },
      {
        id: 'size',
        label: 'Tamanho',
        values: [
          { id: 'mm40', value: '40' },
          { id: 'mm42', value: '42' },
        ],
      },
    ],
    specifications: [{ label: 'Marca', value: 'Seculus' }],
    listings: [
      listing({
        variants: [
          variant({
            axes: [
              { axisId: 'color', valueId: 'preto' },
              { axisId: 'size', valueId: 'mm40' },
            ],
          }),
        ],
      }),
    ],
  })
}

describe('ProductSchema product shape (VAR-01)', () => {
  it('reads slug, title, description, audience, axes, specifications, and listings', () => {
    const result = ProductSchema.safeParse(productWithAxes())

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }
    expect(result.data.slug).toBe('seculus-kit')
    expect(result.data.title).toBe('Seculus')
    expect(result.data.description).toBe('Descrição do relógio.')
    expect(result.data.audience).toBe('male')
    expect(result.data.axes[0]).toEqual({
      id: 'color',
      label: 'Cor',
      values: [
        { id: 'preto', value: 'Preto', alias: 'Black' },
        { id: 'azul', value: 'Azul' },
      ],
    })
    expect(result.data.specifications).toEqual([{ label: 'Marca', value: 'Seculus' }])
    expect(result.data.listings).toHaveLength(1)
    expect(result.data.listings[0].id).toBe('listing')
  })

  it('accepts a product when description, audience, and specifications are omitted', () => {
    const result = ProductSchema.safeParse(product())

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }
    expect(result.data.description).toBeUndefined()
    expect(result.data.audience).toBeUndefined()
    expect(result.data.specifications).toBeUndefined()
  })

  it('rejects a product that omits axes', () => {
    const { axes: _axes, ...withoutAxes } = product()

    expect(ProductSchema.safeParse(withoutAxes).success).toBe(false)
  })
})

describe('ProductSchema audience (VAR-02, VAR-102)', () => {
  it.each(['male', 'female', 'unisex', 'child'])('accepts audience %s', (audience) => {
    const result = ProductSchema.safeParse(product({ audience }))

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.audience).toBe(audience)
    }
  })

  it.each(['Masculino', 'Feminino', 'Unissex', 'Infantil', 'men'])(
    'rejects audience %s',
    (audience) => {
      expect(ProductSchema.safeParse(product({ audience })).success).toBe(false)
    },
  )
})

describe('ProductSchema listings and variants (VAR-03, VAR-04)', () => {
  it('rejects a product when listings is omitted or empty', () => {
    const { listings: _listings, ...withoutListings } = product()

    expect(ProductSchema.safeParse(withoutListings).success).toBe(false)
    expect(ProductSchema.safeParse(product({ listings: [] })).success).toBe(false)
  })

  it('rejects a listing when variants is omitted or empty', () => {
    const { variants: _variants, ...withoutVariants } = listing()

    expect(
      ProductSchema.safeParse(product({ listings: [withoutVariants] })).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(product({ listings: [listing({ variants: [] })] })).success,
    ).toBe(false)
  })
})

describe('ProductSchema listing id (VAR-05)', () => {
  it.each(['Listing', 'listing-', '-listing', 'listing--a'])(
    'rejects listing id %s',
    (id) => {
      expect(ProductSchema.safeParse(product({ listings: [listing({ id })] })).success).toBe(false)
    },
  )

  it('rejects a repeated listing id and accepts two distinct ids', () => {
    expect(
      ProductSchema.safeParse(
        product({
          listings: [listing({ id: 'listing' }), listing({ id: 'listing' })],
        }),
      ).success,
    ).toBe(false)

    const result = ProductSchema.safeParse(
      product({
        listings: [listing({ id: 'listing' }), listing({ id: 'listing-b' })],
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings.map((item) => item.id)).toEqual(['listing', 'listing-b'])
    }
  })
})

describe('ProductSchema omitted flags (VAR-06, VAR-11, VAR-12)', () => {
  it('treats omitted enabled as visible and stores an explicit boolean', () => {
    const omitted = ProductSchema.safeParse(product())
    const turnedOn = ProductSchema.safeParse(
      product({ listings: [listing({ enabled: true })] }),
    )
    const turnedOff = ProductSchema.safeParse(
      product({ listings: [listing({ enabled: false })] }),
    )

    expect(omitted.success).toBe(true)
    expect(turnedOn.success).toBe(true)
    expect(turnedOff.success).toBe(true)
    if (!omitted.success || !turnedOn.success || !turnedOff.success) {
      return
    }
    expect(omitted.data.listings[0].enabled).toBeUndefined()
    expect(isProductListed(omitted.data.listings[0])).toBe(true)
    expect(turnedOn.data.listings[0].enabled).toBe(true)
    expect(isProductListed(turnedOn.data.listings[0])).toBe(true)
    expect(turnedOff.data.listings[0].enabled).toBe(false)
    expect(isProductListed(turnedOff.data.listings[0])).toBe(false)
    expect(
      ProductSchema.safeParse(product({ listings: [listing({ enabled: 'false' })] })).success,
    ).toBe(false)
  })

  it('treats omitted orderable as orderable', () => {
    const omitted = ProductSchema.safeParse(product())
    const explicit = ProductSchema.safeParse(
      product({
        listings: [
          listing({
            variants: [variant({ orderable: true })],
          }),
        ],
      }),
    )

    expect(omitted.success).toBe(true)
    expect(explicit.success).toBe(true)
    if (!omitted.success || !explicit.success) {
      return
    }
    expect(omitted.data.listings[0].variants[0].orderable).toBeUndefined()
    expect(omitted.data.listings[0].variants[0].orderable === false).toBe(false)
    expect(explicit.data.listings[0].variants[0].orderable).toBe(true)
    expect(
      ProductSchema.safeParse(
        product({ listings: [listing({ variants: [variant({ orderable: 'false' })] })] }),
      ).success,
    ).toBe(false)
  })
})

describe('ProductSchema availability and state tokens (VAR-07, VAR-08, VAR-102)', () => {
  it.each(['available', 'coming_soon', 'on_order'])(
    'stores availabilityStatus %s',
    (availabilityStatus) => {
      const state = availabilityStatus === 'on_order' ? 'new' : 'used'
      const result = ProductSchema.safeParse(
        product({ listings: [listing({ availabilityStatus, state })] }),
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.listings[0].availabilityStatus).toBe(availabilityStatus)
      }
    },
  )

  it.each(['unavailable', 'sold_out', 'Sob encomenda', 'Disponível', 'Chega em breve'])(
    'rejects availabilityStatus %s',
    (availabilityStatus) => {
      expect(
        ProductSchema.safeParse(product({ listings: [listing({ availabilityStatus })] })).success,
      ).toBe(false)
    },
  )

  it.each(['new', 'openbox', 'used', 'defective'])('stores state %s', (state) => {
    const result = ProductSchema.safeParse(product({ listings: [listing({ state })] }))

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].state).toBe(state)
    }
  })

  it.each(['Novo', 'Openbox', 'Usado', 'Com defeito'])('rejects state %s', (state) => {
    expect(ProductSchema.safeParse(product({ listings: [listing({ state })] })).success).toBe(false)
  })
})

describe('ProductSchema on-order rules (VAR-09, VAR-10)', () => {
  it.each(['openbox', 'used', 'defective'])(
    'rejects on_order combined with state %s',
    (state) => {
      expect(
        ProductSchema.safeParse(
          product({
            listings: [listing({ availabilityStatus: 'on_order', state })],
          }),
        ).success,
      ).toBe(false)
    },
  )

  it('accepts on_order only when state is new', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [listing({ availabilityStatus: 'on_order', state: 'new' })],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].availabilityStatus).toBe('on_order')
      expect(result.data.listings[0].state).toBe('new')
    }
  })

  it.each(['available', 'coming_soon'])(
    'rejects orderable false when availabilityStatus is %s',
    (availabilityStatus) => {
      expect(
        ProductSchema.safeParse(
          product({
            listings: [
              listing({
                availabilityStatus,
                state: 'new',
                variants: [variant({ orderable: false })],
              }),
            ],
          }),
        ).success,
      ).toBe(false)
    },
  )

  it('accepts orderable false only on an on_order listing', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [
          listing({
            availabilityStatus: 'on_order',
            state: 'new',
            variants: [variant({ orderable: false })],
          }),
        ],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].variants[0].orderable).toBe(false)
    }
  })
})

describe('ProductSchema variant price (VAR-13, VAR-14)', () => {
  it.each([0, -1, 0.001])('rejects price %s after truncateReais', (price) => {
    expect(
      ProductSchema.safeParse(
        product({ listings: [listing({ variants: [variant({ price })] })] }),
      ).success,
    ).toBe(false)
  })

  it('stores a positive price after truncateReais without rounding', () => {
    const result = ProductSchema.safeParse(
      product({ listings: [listing({ variants: [variant({ price: 369.999 })] })] }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].variants[0].price).toBe(369.99)
    }
  })

  it('rejects listPrice that is not greater than price after truncateReais', () => {
    expect(
      ProductSchema.safeParse(
        product({
          listings: [listing({ variants: [variant({ price: 369.9, listPrice: 369.9 })] })],
        }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({
          listings: [listing({ variants: [variant({ price: 100, listPrice: 50 })] })],
        }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({
          listings: [listing({ variants: [variant({ price: 100, listPrice: 100.009 })] })],
        }),
      ).success,
    ).toBe(false)
  })

  it('stores listPrice when it stays greater than price after truncateReais', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [listing({ variants: [variant({ price: 369.999, listPrice: 450.009 })] })],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].variants[0].price).toBe(369.99)
      expect(result.data.listings[0].variants[0].listPrice).toBe(450)
    }
  })
})

describe('ProductSchema axis combinations (VAR-15, VAR-16)', () => {
  it('rejects a listing that repeats one axis-value combination', () => {
    const repeated = productWithAxes()
    const first = repeated.listings[0].variants[0]
    repeated.listings[0].variants = [
      first,
      {
        ...first,
        axes: [
          { axisId: 'size', valueId: 'mm40' },
          { axisId: 'color', valueId: 'preto' },
        ],
      },
    ]

    expect(ProductSchema.safeParse(repeated).success).toBe(false)
  })

  it('accepts the same axis-value combination on two listings', () => {
    const sameCombo = productWithAxes()
    sameCombo.listings = [
      listing({
        id: 'listing-a',
        variants: [sameCombo.listings[0].variants[0]],
      }),
      listing({
        id: 'listing-b',
        state: 'used',
        variants: [variant({ axes: sameCombo.listings[0].variants[0].axes })],
      }),
    ]

    const result = ProductSchema.safeParse(sameCombo)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].variants[0].axes).toEqual(result.data.listings[1].variants[0].axes)
    }
  })
})

describe('ProductSchema variant axes (VAR-17, VAR-18)', () => {
  it('rejects a value id the product axes do not declare', () => {
    const unknown = productWithAxes()
    unknown.listings[0].variants[0].axes = [
      { axisId: 'color', valueId: 'verde' },
      { axisId: 'size', valueId: 'mm40' },
    ]

    expect(ProductSchema.safeParse(unknown).success).toBe(false)
  })

  it('rejects a value id declared on a different axis', () => {
    const swapped = productWithAxes()
    swapped.listings[0].variants[0].axes = [
      { axisId: 'color', valueId: 'mm40' },
      { axisId: 'size', valueId: 'preto' },
    ]

    expect(ProductSchema.safeParse(swapped).success).toBe(false)
  })

  it('rejects a variant that skips a declared axis', () => {
    const skipped = productWithAxes()
    skipped.listings[0].variants[0].axes = [{ axisId: 'color', valueId: 'preto' }]

    expect(ProductSchema.safeParse(skipped).success).toBe(false)
  })

  it('rejects a variant that selects the same axis twice', () => {
    const doubled = productWithAxes()
    doubled.listings[0].variants[0].axes = [
      { axisId: 'color', valueId: 'preto' },
      { axisId: 'color', valueId: 'azul' },
    ]

    expect(ProductSchema.safeParse(doubled).success).toBe(false)
  })

  it('accepts an empty axis list only when the variant selects nothing', () => {
    const accepted = ProductSchema.safeParse(product())
    const extra = product({
      listings: [listing({ variants: [variant({ axes: [{ axisId: 'color', valueId: 'preto' }] })] })],
    })

    expect(accepted.success).toBe(true)
    if (accepted.success) {
      expect(accepted.data.axes).toEqual([])
      expect(accepted.data.listings[0].variants[0].axes).toEqual([])
    }
    expect(ProductSchema.safeParse(extra).success).toBe(false)
  })
})

describe('ProductSchema mainImage (VAR-19)', () => {
  it('rejects mainImage that is not one of the listing images', () => {
    expect(
      ProductSchema.safeParse(
        product({
          listings: [listing({ variants: [variant({ mainImage: 'outra.jpg' })] })],
        }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({
          listings: [
            listing({
              images: ['Foto.jpg'],
              variants: [variant({ mainImage: 'foto.jpg' })],
            }),
          ],
        }),
      ).success,
    ).toBe(false)
  })

  it('accepts mainImage that matches a listing image exactly', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [
          listing({
            images: ['Foto.jpg', 'lado.png'],
            variants: [variant({ mainImage: 'Foto.jpg' })],
          }),
        ],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].variants[0].mainImage).toBe('Foto.jpg')
      expect(result.data.listings[0].images).toEqual(['Foto.jpg', 'lado.png'])
    }
  })
})

describe('ProductSchema images', () => {
  it('rejects an empty image list, a path separator, or a disallowed extension', () => {
    expect(
      ProductSchema.safeParse(product({ listings: [listing({ images: [] })] })).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({ listings: [listing({ images: ['path/foto.jpg'] })] }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({ listings: [listing({ images: ['path\\foto.jpg'] })] }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(product({ listings: [listing({ images: ['foto.gif'] })] })).success,
    ).toBe(false)
  })

  it.each(['a.jpg', 'b.JPEG', 'c.png', 'd.WebP', 'e.avif'])(
    'accepts image file name %s',
    (name) => {
      const result = ProductSchema.safeParse(
        product({
          listings: [listing({ images: [name], variants: [variant({ mainImage: name })] })],
        }),
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.listings[0].images[0]).toBe(name)
      }
    },
  )
})

describe('SPECIFICATION_LABELS', () => {
  it('exports the closed label list without Estado or Público-alvo', () => {
    expect([...SPECIFICATION_LABELS]).toEqual([...canonicalLabelsInOrder])
    expect(SPECIFICATION_LABELS).not.toContain('Estado')
    expect(SPECIFICATION_LABELS).not.toContain('Público-alvo')
    expect([...exportedLabels]).toEqual([...canonicalLabelsInOrder])
  })
})

describe('ProductSchema specification labels (VAR-20, VAR-21)', () => {
  it.each(['Estado', 'Público-alvo'])(
    'rejects product specification label %s',
    (label) => {
      expect(
        ProductSchema.safeParse(
          product({ specifications: [{ label, value: 'Seculus' }] }),
        ).success,
      ).toBe(false)
    },
  )

  it.each(['Estado', 'Público-alvo'])(
    'rejects listing specification label %s',
    (label) => {
      expect(
        ProductSchema.safeParse(
          product({
            listings: [listing({ specifications: [{ label, value: 'Seculus' }] })],
          }),
        ).success,
      ).toBe(false)
    },
  )

  it('rejects a repeated label in the product sheet, in one listing sheet, or across both', () => {
    expect(
      ProductSchema.safeParse(
        product({
          specifications: [
            { label: 'Marca', value: 'Seculus' },
            { label: 'Marca', value: 'Outra' },
          ],
        }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({
          listings: [
            listing({
              specifications: [
                { label: 'Modelo', value: 'Kit' },
                { label: 'Modelo', value: 'Outro' },
              ],
            }),
          ],
        }),
      ).success,
    ).toBe(false)
    expect(
      ProductSchema.safeParse(
        product({
          specifications: [{ label: 'Garantia', value: '90 dias.' }],
          listings: [listing({ specifications: [{ label: 'Garantia', value: '1 ano' }] })],
        }),
      ).success,
    ).toBe(false)
  })

  it('accepts the same label on two listings when the product sheet does not use it', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [
          listing({
            id: 'listing-a',
            specifications: [{ label: 'Marca', value: 'Seculus' }],
          }),
          listing({
            id: 'listing-b',
            specifications: [{ label: 'Marca', value: 'Seculus' }],
          }),
        ],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].specifications?.[0].label).toBe('Marca')
      expect(result.data.listings[1].specifications?.[0].label).toBe('Marca')
    }
  })
})

describe('ProductSchema axes identity (VAR-22, VAR-23)', () => {
  it('rejects a product that repeats an axis label', () => {
    const repeated = productWithAxes()
    repeated.axes[1].label = 'Cor'

    expect(ProductSchema.safeParse(repeated).success).toBe(false)
  })

  it.each(['Cor', 'color-', '-color', 'color--id'])('rejects axis id %s', (id) => {
    const invalid = productWithAxes()
    invalid.axes = [
      {
        id,
        label: 'Cor',
        values: [{ id: 'preto', value: 'Preto' }],
      },
    ]
    invalid.listings[0].variants[0].axes = [{ axisId: id, valueId: 'preto' }]

    expect(ProductSchema.safeParse(invalid).success).toBe(false)
  })

  it.each(['Preto', 'preto-', '-preto', 'preto--id'])('rejects axis value id %s', (id) => {
    const invalid = productWithAxes()
    invalid.axes = [
      {
        id: 'color',
        label: 'Cor',
        values: [{ id, value: 'Preto' }],
      },
    ]
    invalid.listings[0].variants[0].axes = [{ axisId: 'color', valueId: id }]

    expect(ProductSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects a repeated axis id and a repeated value id inside one axis', () => {
    const repeatedAxis = productWithAxes()
    repeatedAxis.axes[1].id = 'color'
    repeatedAxis.axes[1].label = 'Outro'
    repeatedAxis.listings[0].variants[0].axes = [
      { axisId: 'color', valueId: 'preto' },
      { axisId: 'color', valueId: 'mm40' },
    ]

    const repeatedValue = productWithAxes()
    repeatedValue.axes = [
      {
        id: 'color',
        label: 'Cor',
        values: [
          { id: 'preto', value: 'Preto' },
          { id: 'preto', value: 'Black' },
        ],
      },
    ]
    repeatedValue.listings[0].variants[0].axes = [{ axisId: 'color', valueId: 'preto' }]

    expect(ProductSchema.safeParse(repeatedAxis).success).toBe(false)
    expect(ProductSchema.safeParse(repeatedValue).success).toBe(false)
  })

  it('accepts the same value id on two different axes', () => {
    const shared = productWithAxes()
    shared.axes[1].values[0].id = 'preto'
    shared.listings[0].variants[0].axes = [
      { axisId: 'color', valueId: 'preto' },
      { axisId: 'size', valueId: 'preto' },
    ]

    const result = ProductSchema.safeParse(shared)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.axes[0].values[0].id).toBe('preto')
      expect(result.data.axes[1].values[0].id).toBe('preto')
    }
  })
})

const validOffer = {
  text: 'Black Friday',
  background: '#000000',
  color: '#FFFFFF',
  icon: 'Gift',
}

function variantWithOffers(
  offers: typeof validOffer[] | undefined,
  price = 369.9,
  listPrice?: number,
) {
  return variant({
    price,
    ...(listPrice !== undefined ? { listPrice } : {}),
    ...(offers !== undefined ? { offers } : {}),
  })
}

function productWithOneAxis(axisOverrides: Record<string, unknown> = {}) {
  return product({
    axes: [{ id: 'color', label: 'Cor', values: [{ id: 'preto', value: 'Preto' }], ...axisOverrides }],
    listings: [
      listing({
        variants: [variant({ axes: [{ axisId: 'color', valueId: 'preto' }] })],
      }),
    ],
  })
}

describe('ProductSchema unmissableOffer (OSC-03)', () => {
  it.each([true, false] as const)(
    'rejects a variant whose unmissableOffer is %s',
    (unmissableOffer) => {
      expect(
        ProductSchema.safeParse(
          product({ listings: [listing({ variants: [variant({ unmissableOffer })] })] }),
        ).success,
      ).toBe(false)
    },
  )
})

describe('ProductSchema axis presentation (OSC-01)', () => {
  it.each(['image', 'text'] as const)('accepts axis presentation %s', (presentation) => {
    const result = ProductSchema.safeParse(productWithOneAxis({ presentation }))

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.axes[0].presentation).toBe(presentation)
    }
  })

  it('accepts an axis when presentation is omitted', () => {
    const result = ProductSchema.safeParse(productWithOneAxis())

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.axes[0].presentation).toBeUndefined()
    }
  })

  it.each(['thumbnail', 'badge', ''])('rejects axis presentation %j', (presentation) => {
    expect(ProductSchema.safeParse(productWithOneAxis({ presentation })).success).toBe(false)
  })
})

describe('ProductSchema variant offers (OSC-04, OSC-05, OSC-06, OSC-07, OSC-08, OSC-10)', () => {
  it('accepts a variant when offers is omitted or an empty array', () => {
    const omitted = ProductSchema.safeParse(product())
    const empty = ProductSchema.safeParse(
      product({ listings: [listing({ variants: [variantWithOffers([])] })] }),
    )

    expect(omitted.success).toBe(true)
    expect(empty.success).toBe(true)
    if (omitted.success) {
      expect(omitted.data.listings[0].variants[0].offers).toBeUndefined()
    }
    if (empty.success) {
      expect(empty.data.listings[0].variants[0].offers).toEqual([])
    }
  })

  it('accepts a variant with one valid offer and keeps price and listPrice unchanged', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [
          listing({
            variants: [variantWithOffers([validOffer], 369.999, 450.009)],
          }),
        ],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      const parsed = result.data.listings[0].variants[0]
      expect(parsed.offers).toEqual([validOffer])
      expect(parsed.price).toBe(369.99)
      expect(parsed.listPrice).toBe(450)
    }
  })

  it.each([
    ['text', ''],
    ['icon', ''],
  ] as const)('rejects an offer whose %s is empty', (field, value) => {
    const offer = { ...validOffer, [field]: value }
    expect(
      ProductSchema.safeParse(
        product({ listings: [listing({ variants: [variantWithOffers([offer])] })] }),
      ).success,
    ).toBe(false)
  })

  it.each(['text', 'background', 'color', 'icon'] as const)(
    'rejects an offer that omits %s',
    (field) => {
      const { [field]: _removed, ...offer } = validOffer
      expect(
        ProductSchema.safeParse(
          product({
            listings: [listing({ variants: [variantWithOffers([offer as typeof validOffer])] })],
          }),
        ).success,
      ).toBe(false)
    },
  )

  it.each(['#fff', '#FFFFFF', '#0066cc', '#ABC'])(
    'accepts offer background and color %s',
    (hex) => {
      const offer = { ...validOffer, background: hex, color: hex }
      const result = ProductSchema.safeParse(
        product({ listings: [listing({ variants: [variantWithOffers([offer])] })] }),
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.listings[0].variants[0].offers?.[0].background).toBe(hex)
        expect(result.data.listings[0].variants[0].offers?.[0].color).toBe(hex)
      }
    },
  )

  it.each(['#ffff', '#12345', '#RRGGBBAA', '#RGBA', '0066cc', '#ggg'])(
    'rejects offer background or color %s',
    (hex) => {
      expect(
        ProductSchema.safeParse(
          product({
            listings: [
              listing({
                variants: [
                  variantWithOffers([{ ...validOffer, background: hex, color: '#fff' }]),
                ],
              }),
            ],
          }),
        ).success,
      ).toBe(false)
      expect(
        ProductSchema.safeParse(
          product({
            listings: [
              listing({
                variants: [
                  variantWithOffers([{ ...validOffer, background: '#fff', color: hex }]),
                ],
              }),
            ],
          }),
        ).success,
      ).toBe(false)
    },
  )

  it('accepts a non-empty icon name without validating Lucide exports in shared', () => {
    const result = ProductSchema.safeParse(
      product({
        listings: [
          listing({
            variants: [variantWithOffers([{ ...validOffer, icon: 'NotARealLucideExport' }])],
          }),
        ],
      }),
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.listings[0].variants[0].offers?.[0].icon).toBe('NotARealLucideExport')
    }
  })

  it('keeps lucide-react outside shared dependencies', () => {
    const packageJson = JSON.parse(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'),
        'utf8',
      ),
    ) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(packageJson.dependencies).not.toHaveProperty('lucide-react')
    expect(packageJson.devDependencies).not.toHaveProperty('lucide-react')
  })
})

describe('ProductSchema invalid document (VAR-26)', () => {
  it('rejects a product.json that does not match the product contract', () => {
    expect(
      ProductSchema.safeParse({
        slug: 'seculus',
        title: 'Seculus',
        state: 'Novo',
        availabilityStatus: 'available',
        price: 369.9,
        images: ['foto.jpg'],
      }).success,
    ).toBe(false)
  })
})
