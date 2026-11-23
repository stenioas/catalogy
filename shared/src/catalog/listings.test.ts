import { describe, expect, it } from 'vitest'
import type { Listing, Product, Variant } from '../schemas/product.ts'
import { parseLabels } from './labels.ts'
import * as listingModule from './listings.ts'
import * as shared from '../index.ts'
import {
  MISSING_LISTING_TEXT,
  activeFilter,
  activeSection,
  canVariantRepresentCard,
  filterHasCards,
  homeCards,
  homeEmptyText,
  sectionHasCards,
  listingByPath,
  resolveVariant,
  shareMessage,
  variantQuery,
  variantQueue,
  type ListingView,
} from './listings.ts'

const img = 'watch.jpg'

function listingWithVariants(
  variants: Listing['variants'],
  overrides: Partial<Pick<Listing, 'availabilityStatus'>> = {},
): Listing {
  return {
    id: 'listing',
    state: 'new',
    availabilityStatus: overrides.availabilityStatus ?? 'available',
    images: [img],
    variants,
  }
}

describe('variantQueue', () => {
  it('moves orderable: false variants to the end while keeping relative order in each group', () => {
    const listing = listingWithVariants(
      [
        {
          axes: [],
          price: 1,
          mainImage: img,
          orderable: false,
        },
        {
          axes: [],
          price: 2,
          mainImage: img,
        },
        {
          axes: [],
          price: 3,
          mainImage: img,
          orderable: false,
        },
        {
          axes: [],
          price: 4,
          mainImage: img,
        },
      ],
      { availabilityStatus: 'on_order' },
    )

    const queue = variantQueue(listing)
    expect(queue.map((v) => v.price)).toEqual([2, 4, 1, 3])
  })
})

describe('resolveVariant', () => {
  it('opens the first variant in queue order when v is missing', () => {
    const listing = listingWithVariants([
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        price: 10,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        price: 20,
        mainImage: img,
      },
    ])
    expect(resolveVariant(listing, null).price).toBe(10)
    expect(resolveVariant(listing, '').price).toBe(10)
    expect(resolveVariant(listing, '   ').price).toBe(10)
  })

  it('opens the first variant in queue order when v does not match any variant of the listing', () => {
    const listing = listingWithVariants([
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        price: 10,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        price: 20,
        mainImage: img,
      },
    ])
    expect(resolveVariant(listing, 'x').price).toBe(10)
    expect(resolveVariant(listing, 'a,b').price).toBe(10)
  })

  it('when every variant is orderable false and v is invalid, opens the first variant of the original array', () => {
    const listing = listingWithVariants(
      [
        {
          axes: [],
          price: 1,
          mainImage: img,
          orderable: false,
        },
        {
          axes: [],
          price: 2,
          mainImage: img,
          orderable: false,
        },
      ],
      { availabilityStatus: 'on_order' },
    )
    expect(resolveVariant(listing, null).price).toBe(1)
    expect(resolveVariant(listing, 'bad').price).toBe(1)
  })

  it('when v names a valid combination, opens that variant even if orderable is false', () => {
    const listing = listingWithVariants(
      [
        {
          axes: [{ axisId: 'color', valueId: 'a' }],
          price: 10,
          mainImage: img,
        },
        {
          axes: [{ axisId: 'color', valueId: 'b' }],
          price: 20,
          mainImage: img,
          orderable: false,
        },
      ],
      { availabilityStatus: 'on_order' },
    )
    expect(resolveVariant(listing, 'b').price).toBe(20)
  })

  it('uses state and availability to disambiguate v, ignoring invalid or unmatched tokens', () => {
    const listing = listingWithVariants([
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        state: 'used',
        availabilityStatus: 'on_order',
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        state: 'new',
        availabilityStatus: 'coming_soon',
        price: 20,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        state: 'used',
        availabilityStatus: 'available',
        price: 30,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        state: 'new',
        availabilityStatus: 'on_order',
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        state: 'used',
        availabilityStatus: 'available',
        price: 40,
        mainImage: img,
      },
    ])

    expect(resolveVariant(listing, { v: 'a', state: 'used', availability: 'on_order' }).price)
      .toBeUndefined()
    expect(resolveVariant(listing, { v: 'a', state: 'used', availability: null }).price).toBe(30)
    expect(resolveVariant(listing, { v: 'a', state: 'invalid', availability: null }).price).toBe(30)
    expect(resolveVariant(listing, { v: 'a', state: 'openbox', availability: null }).price).toBe(30)
    expect(resolveVariant(listing, { v: 'a', state: null, availability: 'invalid' }).price).toBe(30)
    expect(resolveVariant(listing, { v: 'a', state: null, availability: 'available' }).price).toBe(30)
    expect(resolveVariant(listing, { v: 'b', state: null, availability: 'coming_soon' }).price).toBe(40)
  })

  it('falls back for absent or wrong-sized v and breaks equal availability ties by array order', () => {
    const listing = listingWithVariants([
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        availabilityStatus: 'available',
        price: 10,
        mainImage: img,
        orderable: false,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        availabilityStatus: 'available',
        price: 20,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        state: 'used',
        availabilityStatus: 'available',
        price: 30,
        mainImage: img,
      },
    ])

    expect(resolveVariant(listing, { v: null, state: null, availability: null }).price).toBe(20)
    expect(resolveVariant(listing, { v: 'b,extra', state: null, availability: null }).price).toBe(20)
    expect(resolveVariant(listing, { v: 'b', state: null, availability: null }).price).toBe(20)
  })
})

describe('canVariantRepresentCard', () => {
  it('returns false only when orderable is false', () => {
    expect(
      canVariantRepresentCard({
        axes: [],
        price: 1,
        mainImage: img,
      }),
    ).toBe(true)
    expect(
      canVariantRepresentCard({
        axes: [],
        price: 1,
        mainImage: img,
        orderable: true,
      }),
    ).toBe(true)
    expect(
      canVariantRepresentCard({
        axes: [],
        price: 1,
        mainImage: img,
        orderable: false,
      }),
    ).toBe(false)
  })
})

function variantOf(price: number, extras: Partial<Variant> = {}): Variant {
  return {
    axes: [],
    mainImage: img,
    ...extras,
    price,
  }
}

const initialLabels = parseLabels([
  {
    id: 'black-friday',
    enabled: true,
    type: 'campaign',
    text: 'Black Friday',
    shortText: 'Black Friday',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
  },
  {
    id: 'discount-20',
    enabled: true,
    type: 'offer',
    category: 'discount',
    description: 'Desconto mínimo',
    priority: 1,
    text: 'acima 20%',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
    trigger: { kind: 'discount-at-least', percent: 20 },
  },
])


function listingOf(id: string, extras: Partial<Listing> = {}): Listing {
  return {
    id,
    state: 'new',
    availabilityStatus: 'available',
    images: [img],
    variants: [variantOf(100)],
    ...extras,
  }
}

function productOf(
  slug: string,
  title: string,
  listings: Listing[],
  extras: Partial<Pick<Product, 'audience' | 'axes'>> = {},
): Product {
  return {
    slug,
    title,
    axes: extras.axes ?? [],
    audience: extras.audience,
    listings,
  }
}

describe('activeSection', () => {
  it('opens Todos when section is missing or invalid', () => {
    const products = [
      productOf('oculto', 'Oculto', [listingOf('oculto', { enabled: false })]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon' }),
      ]),
      productOf('encomenda', 'Encomenda', [
        listingOf('encomenda', { availabilityStatus: 'on_order' }),
      ]),
    ]

    expect(activeSection(products, null)).toBe('all')
    expect(activeSection(products, '')).toBe('all')
    expect(activeSection(products, 'coming_soon')).toBe('all')
    expect(activeSection(products, 'outro')).toBe('all')
  })

  it('keeps Disponível when that section is named and has a card', () => {
    const products = [
      productOf('pronto', 'Pronto', [listingOf('pronto')]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon' }),
      ]),
    ]
    expect(activeSection(products, 'available')).toBe('available')
    expect(activeSection(products, null)).toBe('all')
  })

  it('keeps Sob encomenda when that section is named and has a card', () => {
    const products = [
      productOf('encomenda', 'Encomenda', [
        listingOf('encomenda', { availabilityStatus: 'on_order', state: 'new' }),
      ]),
    ]
    expect(activeSection(products, 'on-order')).toBe('on-order')
    expect(activeSection(products, null)).toBe('all')
  })

  it('opens Todos when no section has a card', () => {
    const products = [
      productOf('oculto', 'Oculto', [listingOf('oculto', { enabled: false })]),
      productOf('vazio', 'Vazio', [
        listingOf('vazio', {
          availabilityStatus: 'on_order',
          state: 'new',
          variants: [variantOf(10, { orderable: false })],
        }),
      ]),
    ]
    expect(activeSection(products, null)).toBe('all')
    expect(activeSection(products, 'invalida')).toBe('all')
    expect(activeSection(products, 'all')).toBe('all')
    expect(homeEmptyText(products, null)).toBe('Não temos nenhum anúncio ativo.')
  })

  it('stays on the named section when that section has no card', () => {
    const products = [
      productOf('pronto', 'Pronto', [listingOf('pronto')]),
    ]
    expect(activeSection(products, 'on-order')).toBe('on-order')
    expect(homeCards(products, 'on-order', [])).toEqual([])
    expect(homeEmptyText(products, 'on-order')).toBeNull()
    expect(activeSection(products, 'coming-soon')).toBe('coming-soon')
    expect(activeSection(products, 'all')).toBe('all')
  })
})

describe('homeCards', () => {
  const color = {
    id: 'cor',
    label: 'Cor',
    values: [
      { id: 'preto', value: 'Preto', alias: 'Preto fosco' },
      { id: 'azul', value: 'Azul', alias: 'Az' },
      { id: 'verde', value: 'Verde' },
      { id: 'amarelo', value: 'Amarelo' },
    ],
  }

  const cheapOffer = {
    text: 'Leve 2',
    background: '#abc',
    color: '#fff',
    icon: 'Gift',
  }

  function pricedListing(status: 'available' | 'coming_soon'): Product {
    const listingId = status === 'available' ? 'novo' : 'breve'
    return productOf(
      'seculus',
      'Seculus',
      [
        listingOf(listingId, {
          availabilityStatus: status,
          variants: [
            variantOf(50, {
              mainImage: 'caro.jpg',
              axes: [{ axisId: 'cor', valueId: 'preto' }],
            }),
            variantOf(1, {
              mainImage: 'bloqueado.jpg',
              orderable: false,
              axes: [{ axisId: 'cor', valueId: 'amarelo' }],
            }),
            variantOf(12, {
              mainImage: 'barato.jpg',
              listPrice: 30,
              axes: [{ axisId: 'cor', valueId: 'azul' }],
            }),
          ],
        }),
      ],
      { axes: [color] },
    )
  }

  it('chooses the lowest price among variants whose orderable is not false', () => {
    const available = homeCards([pricedListing('available')], 'available', [])
    expect(available).toEqual([
      {
        slug: 'seculus',
        listingId: 'novo',
        title: 'Seculus',
        image: 'barato.jpg',
        price: 12,
        listPrice: 30,
        campaign: null,
        offers: [],
        availabilityStatus: 'available',
        statusLabel: 'Disponível',
        path: '/product/seculus/novo?v=azul',
      },
    ])
    expect(available[0].title).not.toContain('Az')
    expect(available[0].title).not.toContain('Preto fosco')

    expect(homeCards([pricedListing('coming_soon')], 'coming-soon', [])).toEqual([
      {
        slug: 'seculus',
        listingId: 'breve',
        title: 'Seculus',
        image: 'barato.jpg',
        price: 12,
        listPrice: 30,
        campaign: null,
        offers: [],
        availabilityStatus: 'coming_soon',
        statusLabel: 'Chega em breve',
        path: '/product/seculus/breve?v=azul',
      },
    ])
  })

  it('breaks a lowest-price tie with the earlier variant in listing.variants', () => {
    const tiedOffer = {
      text: 'Primeiro do arquivo',
      background: '#111111',
      color: '#ffffff',
      icon: 'Tag',
    }
    const product = productOf(
      'seculus',
      'Seculus',
      [
        listingOf('novo', {
          variants: [
            variantOf(40, {
              mainImage: 'caro.jpg',
              axes: [{ axisId: 'cor', valueId: 'preto' }],
            }),
            variantOf(15, {
              mainImage: 'primeiro.jpg',
              axes: [{ axisId: 'cor', valueId: 'azul' }],
            }),
            variantOf(15, {
              mainImage: 'segundo.jpg',
              axes: [{ axisId: 'cor', valueId: 'verde' }],
            }),
          ],
        }),
      ],
      { axes: [color] },
    )

    expect(homeCards([product], 'available', [])).toEqual([
      {
        slug: 'seculus',
        listingId: 'novo',
        title: 'Seculus',
        image: 'primeiro.jpg',
        price: 15,
        campaign: null,
        offers: [],
        availabilityStatus: 'available',
        statusLabel: 'Disponível',
        path: '/product/seculus/novo?v=azul',
      },
    ])
  })

  it('uses the listing cover and omits v when every orderable price is the same', () => {
    const product = productOf(
      'seculus',
      'Seculus',
      [
        listingOf('novo', {
          images: ['capa.jpg', 'azul.jpg', 'verde.jpg'],
          variants: [
            variantOf(15, {
              mainImage: 'azul.jpg',
              axes: [{ axisId: 'cor', valueId: 'azul' }],
            }),
            variantOf(15, {
              mainImage: 'verde.jpg',
              axes: [{ axisId: 'cor', valueId: 'verde' }],
            }),
          ],
        }),
      ],
      { axes: [color] },
    )

    expect(homeCards([product], 'available', [])).toEqual([
      {
        slug: 'seculus',
        listingId: 'novo',
        title: 'Seculus',
        image: 'capa.jpg',
        price: 15,
        campaign: null,
        offers: [],
        availabilityStatus: 'available',
        statusLabel: 'Disponível',
        path: '/product/seculus/novo',
      },
    ])
  })

  it('does not let an orderable false variant represent the card', () => {
    const products = [
      productOf(
        'seculus',
        'Seculus',
        [
          listingOf('encomenda', {
            availabilityStatus: 'on_order',
            state: 'new',
            variants: [
              variantOf(10, {
                mainImage: 'fora.jpg',
                orderable: false,
                axes: [{ axisId: 'cor', valueId: 'preto' }],
              }),
              variantOf(80, {
                mainImage: 'venda.jpg',
                listPrice: 90,
                axes: [{ axisId: 'cor', valueId: 'azul' }],
              }),
            ],
          }),
        ],
        { axes: [color] },
      ),
    ]
    expect(homeCards(products, 'on-order', [])).toEqual([
      {
        slug: 'seculus',
        listingId: 'encomenda',
        title: 'Seculus',
        image: img,
        campaign: null,
        offers: [],
        availabilityStatus: 'on_order',
        statusLabel: 'Sob encomenda',
        path: '/product/seculus/encomenda',
      },
    ])
    expect(homeCards(products, 'all', [])).toEqual([])
  })

  it('uses the listing availability label, including Chega em breve', () => {
    const products = [
      productOf('av', 'Av', [listingOf('av')]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon', state: 'used' }),
      ]),
    ]
    expect(homeCards(products, 'available', [])[0]).toEqual({
      slug: 'av',
      listingId: 'av',
      title: 'Av',
      image: img,
      price: 100,
      campaign: null,
      offers: [],
      availabilityStatus: 'available',
      statusLabel: 'Disponível',
      path: '/product/av/av',
    })
    expect(homeCards(products, 'coming-soon', [])[0]).toEqual({
      slug: 'breve',
      listingId: 'breve',
      title: 'Breve',
      image: img,
      price: 100,
      campaign: null,
      offers: [],
      availabilityStatus: 'coming_soon',
      statusLabel: 'Chega em breve',
      path: '/product/breve/breve',
    })
    expect(homeCards(products, 'available', [])[0].statusLabel).not.toBe('Indisponível')
  })

  it('orders cards by pt-BR title, then slug, then listing order', () => {
    const products = [
      productOf('zulu', 'bola', [listingOf('z')]),
      productOf('alfa', 'Águia', [listingOf('a')]),
      productOf('meio', 'bola', [
        listingOf('depois'),
        listingOf('antes'),
      ]),
    ]
    expect(homeCards(products, null, []).map((card) => card.path)).toEqual([
      '/product/alfa/a',
      '/product/meio/depois',
      '/product/meio/antes',
      '/product/zulu/z',
    ])
  })

  it('omits v when the product has no axes and orders value ids by declared axes', () => {
    const products = [
      productOf('liso', 'Liso', [listingOf('unico')]),
      productOf(
        'seculus',
        'Seculus',
        [
          listingOf('novo', {
            variants: [
              variantOf(10, {
                axes: [
                  { axisId: 'tamanho', valueId: 'gg' },
                  { axisId: 'cor', valueId: 'preto' },
                ],
              }),
              variantOf(20, {
                axes: [
                  { axisId: 'tamanho', valueId: 'gg' },
                  { axisId: 'cor', valueId: 'azul' },
                ],
              }),
            ],
          }),
        ],
        {
          axes: [
            { id: 'cor', label: 'Cor', values: [{ id: 'preto', value: 'Preto' }] },
            { id: 'tamanho', label: 'Tamanho', values: [{ id: 'gg', value: 'GG' }] },
          ],
        },
      ),
    ]
    expect(homeCards(products, 'available', []).map((card) => card.path)).toEqual([
      '/product/liso/unico',
      '/product/seculus/novo?v=preto,gg',
    ])
  })

  it('counts only an enabled listing with a variant that can represent a card', () => {
    const products = [
      productOf('oculto', 'Oculto', [
        listingOf('oculto', { enabled: false, state: 'defective' }),
      ]),
      productOf('todos-fora', 'Fora', [
        listingOf('todos-fora', {
          availabilityStatus: 'on_order',
          state: 'new',
          variants: [variantOf(10, { orderable: false })],
        }),
      ]),
      productOf('omisso', 'Omisso', [listingOf('omisso')]),
    ]
    expect(homeCards(products, null, []).map((card) => card.listingId)).toEqual(['omisso'])
    expect(activeSection(products, null)).toBe('all')
    expect(homeCards(products, 'on-order', [])).toEqual([])
  })

  it('lists available and coming soon together for all or null, and keeps on_order off Todos', () => {
    const products = [
      productOf('zulu', 'Zebra', [
        listingOf('z', { availabilityStatus: 'on_order', images: ['capa-zebra.jpg'] }),
      ]),
      productOf('alfa', 'Águia', [listingOf('a')]),
      productOf('meio', 'bola', [
        listingOf('breve', { availabilityStatus: 'coming_soon' }),
      ]),
    ]
    const expected = [
      {
        slug: 'alfa',
        listingId: 'a',
        title: 'Águia',
        image: img,
        price: 100,
        campaign: null,
        offers: [],
        availabilityStatus: 'available',
        statusLabel: 'Disponível',
        path: '/product/alfa/a',
      },
      {
        slug: 'meio',
        listingId: 'breve',
        title: 'bola',
        image: img,
        price: 100,
        campaign: null,
        offers: [],
        availabilityStatus: 'coming_soon',
        statusLabel: 'Chega em breve',
        path: '/product/meio/breve',
      },
    ]
    expect(homeCards(products, null, [])).toEqual(expected)
    expect(homeCards(products, 'all', [])).toEqual(expected)
    expect(homeCards(products, 'all', []).map((card) => card.availabilityStatus)).not.toContain('on_order')
    expect(homeCards(products, 'available', []).map((card) => card.listingId)).toEqual(['a'])
    expect(sectionHasCards(products, 'all')).toBe(true)
    expect(homeCards(products, 'on-order', [])).toEqual([
      {
        slug: 'zulu',
        listingId: 'z',
        title: 'Zebra',
        image: 'capa-zebra.jpg',
        campaign: null,
        offers: [],
        availabilityStatus: 'on_order',
        statusLabel: 'Sob encomenda',
        path: '/product/zulu/z',
      },
    ])
  })

  it('leaves Todos without cards when every listing that generates a card is on_order', () => {
    const products = [
      productOf('so', 'Só', [
        listingOf('enc', { availabilityStatus: 'on_order', images: ['capa.jpg'] }),
      ]),
    ]
    expect(homeCards(products, 'all', [])).toEqual([])
    expect(homeCards(products, null, [])).toEqual([])
    expect(sectionHasCards(products, 'all')).toBe(false)
    expect(sectionHasCards(products, 'on-order')).toBe(true)
    expect(homeEmptyText(products, 'all')).toBeNull()
  })

  it('keeps a repeated on-order combination on Encomendar and opens it from ?v=', () => {
    const axes = [{
      id: 'cor',
      label: 'Cor',
      values: [
        { id: 'amarelo', value: 'Amarelo' },
        { id: 'verde', value: 'Verde' },
      ],
    }]
    const products = [
      productOf(
        'curren',
        'Curren',
        [
          listingOf('encomenda', {
            availabilityStatus: 'on_order',
            images: ['capa.jpg'],
            variants: [
              variantOf(139.9, {
                mainImage: 'gold.jpg',
                axes: [{ axisId: 'cor', valueId: 'amarelo' }],
              }),
              variantOf(139.9, {
                mainImage: 'rose.jpg',
                axes: [{ axisId: 'cor', valueId: 'verde' }],
              }),
            ],
          }),
          listingOf('caminho', {
            availabilityStatus: 'coming_soon',
            variants: [
              variantOf(109.9, {
                mainImage: 'rose.jpg',
                axes: [{ axisId: 'cor', valueId: 'verde' }],
              }),
            ],
          }),
        ],
        { axes },
      ),
    ]
    const stored = structuredClone(products)

    expect(homeCards(products, 'on-order', [])).toEqual([
      {
        slug: 'curren',
        listingId: 'encomenda',
        title: 'Curren',
        image: 'capa.jpg',
        campaign: null,
        offers: [],
        availabilityStatus: 'on_order',
        statusLabel: 'Sob encomenda',
        path: '/product/curren/encomenda',
      },
    ])
    expect(sectionHasCards(products, 'on-order')).toBe(true)
    expect(homeCards(products, 'all', []).map((card) => card.listingId)).toEqual(['caminho'])
    expect(homeCards(products, 'coming-soon', [])[0]?.path).toBe('/product/curren/caminho')
    expect(homeCards(products, 'coming-soon', [])[0]?.image).toBe(img)

    const orderView = requireOpen(listingByPath(products, 'curren', 'encomenda', 'verde', []))
    expect(orderView.price).toBe(139.9)
    expect(orderView.title).toBe('Curren Verde')
    expect(orderView.availabilityStatus).toBe('on_order')
    const orderColors = orderView.selectors.find((selector) => selector.axisId === 'cor')?.options
    expect(orderColors?.map((option) => option.valueId)).toEqual(['amarelo', 'verde'])
    expect(orderColors?.find((option) => option.valueId === 'verde')?.disabled).toBe(false)
    expect(orderColors?.find((option) => option.valueId === 'amarelo')?.disabled).toBe(false)

    const soonView = requireOpen(listingByPath(products, 'curren', 'caminho', null, []))
    expect(soonView.selectors.find((selector) => selector.axisId === 'cor')?.options.map((option) => option.valueId)).toContain('verde')
    expect(products).toEqual(stored)
  })

  it('keeps the on-order card and opens the direct link when every combination is already stocked or arriving', () => {
    const products = [
      productOf(
        'curren',
        'Curren',
        [
          listingOf('encomenda', {
            availabilityStatus: 'on_order',
            variants: [
              variantOf(10, { axes: [{ axisId: 'cor', valueId: 'preto' }] }),
              variantOf(20, { axes: [{ axisId: 'cor', valueId: 'azul' }] }),
            ],
          }),
          listingOf('caminho', {
            availabilityStatus: 'coming_soon',
            variants: [
              variantOf(8, { axes: [{ axisId: 'cor', valueId: 'preto' }] }),
              variantOf(9, { axes: [{ axisId: 'cor', valueId: 'azul' }] }),
            ],
          }),
        ],
        { axes: [color] },
      ),
    ]

    expect(homeCards(products, 'on-order', [])).toEqual([
      {
        slug: 'curren',
        listingId: 'encomenda',
        title: 'Curren',
        image: img,
        campaign: null,
        offers: [],
        availabilityStatus: 'on_order',
        statusLabel: 'Sob encomenda',
        path: '/product/curren/encomenda',
      },
    ])
    expect(sectionHasCards(products, 'on-order')).toBe(true)
    expect(homeCards(products, 'all', []).map((card) => card.listingId)).toEqual(['caminho'])
    const opened = requireOpen(listingByPath(products, 'curren', 'encomenda', 'preto', []))
    expect(opened.price).toBe(10)
    expect(opened.title).toBe('Curren Preto fosco')
    expect(opened.availabilityStatus).toBe('on_order')
  })

  it('keeps an on-order variant when the matching stock listing is disabled', () => {
    const products = [
      productOf(
        'curren',
        'Curren',
        [
          listingOf('encomenda', {
            availabilityStatus: 'on_order',
            variants: [variantOf(10, { axes: [{ axisId: 'cor', valueId: 'preto' }] })],
          }),
          listingOf('estoque', {
            enabled: false,
            variants: [variantOf(10, { axes: [{ axisId: 'cor', valueId: 'preto' }] })],
          }),
        ],
        { axes: [color] },
      ),
    ]

    expect(homeCards(products, 'on-order', []).map((card) => card.path)).toEqual([
      '/product/curren/encomenda',
    ])
    expect(requireOpen(listingByPath(products, 'curren', 'encomenda', 'preto', [])).price).toBe(10)
    expect(requireOpen(listingByPath(products, 'curren', 'encomenda', 'preto', [])).title).toBe(
      'Curren Preto fosco',
    )
  })
})

describe('homeCards filters', () => {
  const offer = {
    text: 'Oferta',
    background: '#111111',
    color: '#ffffff',
    icon: 'Tag',
  }

  function filteredProduct(
    audience: Product['audience'],
    variants: Variant[],
    listing: Partial<Listing> = {},
  ): Product {
    return {
      slug: `watch-${audience ?? 'none'}`,
      title: 'Watch',
      audience,
      axes: [],
      listings: [
        {
          id: 'main-listing',
          images: ['cover.jpg', 'variant.jpg'],
          variants,
          ...listing,
        },
      ],
    }
  }

  function filteredVariant(overrides: Partial<Variant> = {}): Variant {
    return {
      axes: [],
      mainImage: 'variant.jpg',
      ...overrides,
    }
  }

  it('orders cards by availability, then Portuguese title', () => {
    const products = [
      {
        ...filteredProduct('unisex', [filteredVariant()]),
        slug: 'encomenda',
        title: 'Águia',
      },
      {
        ...filteredProduct('unisex', [
          filteredVariant({ availabilityStatus: 'available', price: 10 }),
        ]),
        slug: 'disponivel-z',
        title: 'Zebra',
      },
      {
        ...filteredProduct('unisex', [
          filteredVariant({ availabilityStatus: 'coming_soon', price: 10 }),
        ]),
        slug: 'breve',
        title: 'Bola',
      },
      {
        ...filteredProduct('unisex', [
          filteredVariant({ availabilityStatus: 'available', price: 10 }),
        ]),
        slug: 'disponivel-a',
        title: 'Addiesdive',
      },
    ]

    expect(homeCards(products, null, []).map((card) => card.title)).toEqual([
      'Addiesdive',
      'Zebra',
      'Bola',
      'Águia',
    ])
  })

  it('shows enabled on-order listings in Todos and hides disabled or non-representable listings', () => {
    const onOrder = filteredProduct('unisex', [filteredVariant()])
    const disabled = filteredProduct('unisex', [filteredVariant()], { enabled: false })
    const unavailable = filteredProduct('unisex', [filteredVariant({ orderable: false })])

    expect(homeCards([onOrder, disabled, unavailable], null, []).map((card) => card.slug)).toEqual([
      'watch-unisex',
    ])
    expect(homeCards([onOrder, disabled, unavailable], null, [])[0]).toMatchObject({
      availabilityStatus: 'on_order',
      statusLabel: 'Sob encomenda',
    })
  })

  it('treats an absent or unknown filter as Todos and reports whether a filter has cards', () => {
    const product = filteredProduct('unisex', [filteredVariant({ state: 'used' })])

    expect(activeFilter(null, initialLabels)).toBe('all')
    expect(activeFilter('unknown', initialLabels)).toBe('all')
    expect(activeFilter('discount', initialLabels)).toBe('all')
    expect(activeFilter('discount-20', initialLabels)).toBe('discount-20')
    expect(activeFilter('black-friday', initialLabels)).toBe('black-friday')
    expect(homeCards([product], 'unknown', initialLabels)).toEqual(
      homeCards([product], null, initialLabels),
    )
    expect(filterHasCards([product], 'used', [])).toBe(true)
    expect(filterHasCards([product], 'new', [])).toBe(false)
  })

  it('applies the exact truncated 20 percent discount boundary and excludes on-order variants', () => {
    const passing = filteredProduct('unisex', [
      filteredVariant({
        availabilityStatus: 'available',
        price: 80,
        listPrice: 100,
      }),
    ])
    const below = {
      ...filteredProduct('male', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 80.1,
          listPrice: 100,
        }),
      ]),
      slug: 'below',
    }
    const onOrder = {
      ...filteredProduct('female', [
        filteredVariant({
          availabilityStatus: 'on_order',
          price: 80,
          listPrice: 100,
        }),
      ]),
      slug: 'on-order',
    }

    expect(
      homeCards([passing, below, onOrder], 'discount-20', initialLabels).map((card) => card.slug),
    ).toEqual(['watch-unisex'])
  })

  it('matches female and male audiences through unisex, excluding child and missing audience', () => {
    const products = [
      filteredProduct('female', [filteredVariant()]),
      filteredProduct('male', [filteredVariant()]),
      filteredProduct('unisex', [filteredVariant()]),
      filteredProduct('child', [filteredVariant()]),
      filteredProduct(undefined, [filteredVariant()]),
    ]

    expect(homeCards(products, 'female', []).map((card) => card.slug)).toEqual([
      'watch-female',
      'watch-unisex',
    ])
    expect(homeCards(products, 'male', []).map((card) => card.slug)).toEqual([
      'watch-male',
      'watch-unisex',
    ])
  })

  it('filters by effective state and excludes defective from the three state filters', () => {
    const products = [
      filteredProduct('unisex', [filteredVariant()]),
      {
        ...filteredProduct('female', [filteredVariant({ state: 'openbox' })]),
        slug: 'openbox',
      },
      {
        ...filteredProduct('male', [filteredVariant({ state: 'used' })]),
        slug: 'used',
      },
      {
        ...filteredProduct('child', [filteredVariant({ state: 'defective' })]),
        slug: 'defective',
      },
    ]

    expect(homeCards(products, 'new', []).map((card) => card.slug)).toEqual(['watch-unisex'])
    expect(homeCards(products, 'openbox', []).map((card) => card.slug)).toEqual(['openbox'])
    expect(homeCards(products, 'used', []).map((card) => card.slug)).toEqual(['used'])
    expect(
      ['new', 'openbox', 'used'].flatMap((filter) =>
        homeCards(products, filter, []).map((card) => card.slug),
      ),
    ).not.toContain('defective')
  })

  it('uses every representable variant for Todos and gender cards, but only matching variants for state cards', () => {
    const product = filteredProduct('female', [
      filteredVariant({
        state: 'used',
        availabilityStatus: 'available',
        price: 20,
      }),
      filteredVariant({
        state: 'new',
        availabilityStatus: 'coming_soon',
        price: 50,
      }),
    ])

    expect(homeCards([product], null, [])).toHaveLength(1)
    expect(homeCards([product], null, [])[0]).toMatchObject({
      price: 20,
      availabilityStatus: 'available',
      statusLabel: 'Disponível',
      campaign: null,
      offers: [],
    })
    expect(homeCards([product], 'female', [])[0]?.price).toBe(20)
    const male = filteredProduct('male', [
      filteredVariant({
        state: 'new',
        availabilityStatus: 'coming_soon',
        price: 50,
      }),
      filteredVariant({
        orderable: false,
        state: 'used',
        availabilityStatus: 'available',
        price: 5,
      }),
      filteredVariant({
        state: 'used',
        availabilityStatus: 'available',
        price: 20,
      }),
    ])
    expect(homeCards([male], 'male', [])[0]?.price).toBe(20)
    expect(homeCards([product], 'new', [])[0]).toMatchObject({
      price: 50,
      availabilityStatus: 'coming_soon',
      statusLabel: 'Chega em breve',
    })
  })

  it('limits the card pool to the variants that match discount, openbox, and used', () => {
    const product = filteredProduct('unisex', [
      filteredVariant({
        state: 'new',
        availabilityStatus: 'available',
        price: 10,
      }),
      filteredVariant({
        state: 'openbox',
        availabilityStatus: 'available',
        price: 40,
        listPrice: 45,
      }),
      filteredVariant({
        state: 'used',
        availabilityStatus: 'available',
        price: 60,
        listPrice: 70,
      }),
      filteredVariant({
        state: 'new',
        availabilityStatus: 'available',
        price: 80,
        listPrice: 100,
      }),
    ])

    expect(homeCards([product], 'discount-20', initialLabels)[0]?.price).toBe(80)
    expect(homeCards([product], 'openbox', [])[0]?.price).toBe(40)
    expect(homeCards([product], 'used', [])[0]?.price).toBe(60)
  })

  it('LBL-39: filter=black-friday lists only cards whose resolved campaign is black-friday', () => {
    const withCampaign = {
      ...filteredProduct('unisex', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 100,
          listPrice: 100,
        }),
      ]),
      slug: 'with-campaign',
    }
    const withoutCampaign = {
      ...filteredProduct('male', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 100,
          listPrice: 100,
        }),
      ]),
      slug: 'without-campaign',
      listings: [
        {
          id: 'main-listing',
          images: ['cover.jpg', 'variant.jpg'],
          disabledLabels: ['black-friday'],
          variants: [
            filteredVariant({
              availabilityStatus: 'available',
              price: 100,
              listPrice: 100,
            }),
          ],
        },
      ],
    }

    expect(
      homeCards([withCampaign, withoutCampaign], 'black-friday', initialLabels).map((card) => card.slug),
    ).toEqual(['with-campaign'])
  })

  it('LBL-40: filter=discount-20 lists only cards where discount-20 is the winning offer', () => {
    const withOffer = {
      ...filteredProduct('unisex', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 80,
          listPrice: 100,
        }),
      ]),
      slug: 'with-offer',
    }
    const belowThreshold = {
      ...filteredProduct('male', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 80.1,
          listPrice: 100,
        }),
      ]),
      slug: 'below-threshold',
    }
    const offerOptOut = {
      ...filteredProduct('female', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 80,
          listPrice: 100,
          disabledLabels: ['discount-20'],
        }),
      ]),
      slug: 'offer-opt-out',
    }

    expect(
      homeCards([withOffer, belowThreshold, offerOptOut], 'discount-20', initialLabels).map(
        (card) => card.slug,
      ),
    ).toEqual(['with-offer'])
  })

  it('LBL-41: picks the cheapest variant that matches a label filter', () => {
    const product = filteredProduct('unisex', [
      filteredVariant({
        state: 'new',
        availabilityStatus: 'available',
        price: 80,
        listPrice: 100,
      }),
      filteredVariant({
        state: 'used',
        availabilityStatus: 'available',
        price: 70,
        listPrice: 100,
      }),
      filteredVariant({
        state: 'openbox',
        availabilityStatus: 'available',
        price: 50,
        listPrice: 100,
      }),
    ])

    expect(homeCards([product], 'discount-20', initialLabels)[0]?.price).toBe(50)
  })

  it('LBL-43: an unknown label id in the query falls back to Todos without extra filtering', () => {
    const withOffer = filteredProduct('unisex', [
      filteredVariant({
        availabilityStatus: 'available',
        price: 80,
        listPrice: 100,
      }),
    ])
    const withoutOffer = {
      ...filteredProduct('male', [
        filteredVariant({
          availabilityStatus: 'available',
          price: 100,
          listPrice: 100,
        }),
      ]),
      slug: 'full-price',
    }

    expect(activeFilter('not-a-label', initialLabels)).toBe('all')
    expect(homeCards([withOffer, withoutOffer], 'not-a-label', initialLabels).map((card) => card.slug)).toEqual(
      homeCards([withOffer, withoutOffer], null, initialLabels).map((card) => card.slug),
    )
  })

  it('uses the cover for equal lowest prices and for a pool without price', () => {
    const tied = filteredProduct('unisex', [
      filteredVariant({ availabilityStatus: 'available', price: 40 }),
      filteredVariant({
        availabilityStatus: 'coming_soon',
        price: 40,
      }),
    ])
    const noPrice = {
      ...filteredProduct('unisex', [
        filteredVariant({
          availabilityStatus: 'on_order',
        }),
      ]),
      slug: 'no-price',
    }

    expect(homeCards([tied], null, [])[0]).toMatchObject({
      image: 'cover.jpg',
      price: 40,
    })
    expect(homeCards([noPrice], null, [])[0]).toEqual({
      slug: 'no-price',
      listingId: 'main-listing',
      title: 'Watch',
      image: 'cover.jpg',
      campaign: null,
      offers: [],
      availabilityStatus: 'on_order',
      statusLabel: 'Sob encomenda',
      path: '/product/no-price/main-listing',
    })
  })

  it('identifies the card with v when the axes repeat', () => {
    const product = filteredProduct('unisex', [
      filteredVariant({
        axes: [{ axisId: 'color', valueId: 'steel' }],
        state: 'used',
        availabilityStatus: 'available',
        price: 30,
      }),
      filteredVariant({
        axes: [{ axisId: 'color', valueId: 'steel' }],
        state: 'new',
        availabilityStatus: 'on_order',
      }),
    ])
    product.axes = [{ id: 'color', label: 'Cor', values: [{ id: 'steel', value: 'Steel' }] }]

    expect(homeCards([product], 'new', [])[0]?.path).toBe('/product/watch-unisex/main-listing?v=steel')
  })
})

function requireOpen(view: ListingView) {
  expect(view.missing).toBe(false)
  if (view.missing) {
    throw new Error('expected an open listing')
  }
  return view
}

function conditionProduct(): Product {
  return productOf(
    'condition',
    'Condition',
    [
      {
        id: 'main-listing',
        images: ['cover.jpg', 'red.jpg', 'blue.jpg'],
        variants: [
          {
            axes: [{ axisId: 'color', valueId: 'red' }],
            state: 'used',
            availabilityStatus: 'available',
            price: 30,
            mainImage: 'red.jpg',
          },
          {
            axes: [{ axisId: 'color', valueId: 'red' }],
            state: 'new',
            availabilityStatus: 'available',
            price: 40,
            mainImage: 'red.jpg',
          },
          {
            axes: [{ axisId: 'color', valueId: 'red' }],
            state: 'used',
            availabilityStatus: 'on_order',
            mainImage: 'red.jpg',
          },
          {
            axes: [{ axisId: 'color', valueId: 'blue' }],
            state: 'new',
            availabilityStatus: 'coming_soon',
            price: 50,
            mainImage: 'blue.jpg',
          },
        ],
      },
    ],
    {
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [
            { id: 'red', value: 'Vermelho' },
            { id: 'blue', value: 'Azul' },
          ],
        },
      ],
    },
  )
}

describe('variant condition selectors and query', () => {
  it('keeps selectors on the product axes when conditions share those axes', () => {
    const product = conditionProduct()
    const view = requireOpen(listingByPath([product], 'condition', 'main-listing', 'red', []))
    expect(view.selectors.map((selector) => selector.axisId)).toEqual(['color'])
    expect(view.state).toBe('used')
    expect(view.availability).toBe('available')
    const unique = requireOpen(listingByPath([product], 'condition', 'main-listing', 'blue', []))
    expect(unique.selectors.map((selector) => selector.axisId)).toEqual(['color'])
  })

  it('keeps v axis-only', () => {
    const product = conditionProduct()
    const listing = product.listings[0]!

    expect(variantQuery(product, listing.variants[0]!)).toEqual({ v: 'red' })
    expect(variantQuery(product, listing.variants[3]!)).toEqual({ v: 'blue' })
  })

  it('uses effective labels and the axis query in the share message', () => {
    const product = conditionProduct()
    const listing = product.listings[0]!

    expect(shareMessage(product, listing, listing.variants[0]!, 'https://loja.example')).toBe(
      'Olá, tenho interesse no Condition Vermelho. Usado, Disponível. https://loja.example/product/condition/main-listing?v=red',
    )
  })

  it('omits offers from an on-order listing view', () => {
    const product = conditionProduct()
    const listing = product.listings[0]!
    const onOrder = listing.variants[2]!
    const isolated = {
      ...product,
      listings: [{ ...listing, variants: [onOrder] }],
    }

    expect(requireOpen(listingByPath([isolated], 'condition', 'main-listing', 'red', [])).offers).toEqual(
      [],
    )
  })
})

describe('listingByPath', () => {
  it('opens the first listing that would enter the home, by section then listings order', () => {
    const product = productOf('fila', 'Fila', [
      listingOf('breve', { availabilityStatus: 'coming_soon', variants: [variantOf(1)] }),
      listingOf('segundo', { variants: [variantOf(2)] }),
      listingOf('primeiro', { variants: [variantOf(3)] }),
    ])

    expect(requireOpen(listingByPath([product], 'fila', null, null, [])).listingId).toBe('segundo')
  })

  it('skips an on_order listing whose every variant is orderable false', () => {
    const dead = listingOf('dead', {
      availabilityStatus: 'on_order',
      variants: [variantOf(1, { orderable: false })],
    })
    const live = listingOf('live', {
      availabilityStatus: 'on_order',
      variants: [variantOf(30), variantOf(4, { orderable: false })],
    })
    const stock = listingOf('stock', { variants: [variantOf(5)] })

    expect(
      requireOpen(listingByPath([productOf('pula', 'Pula', [dead, live])], 'pula', null, null, []))
        .listingId,
    ).toBe('live')
    expect(
      requireOpen(
        listingByPath([productOf('misto', 'Misto', [dead, stock])], 'misto', null, null, []),
      ).listingId,
    ).toBe('stock')
    expect(
      listingByPath(
        [productOf('so-morto', 'Morto', [dead])],
        'so-morto',
        null,
        null,
        [],
      ),
    ).toEqual({ missing: true })
  })

  it('opens a direct id even outside the home, and returns missing when the listing cannot be shown', () => {
    const dead = listingOf('dead', {
      availabilityStatus: 'on_order',
      variants: [variantOf(1, { orderable: false })],
    })
    const stock = listingOf('stock', { variants: [variantOf(5)] })
    const hidden = listingOf('hidden', { enabled: false, variants: [variantOf(9)] })
    const product = productOf('relogio', 'Relógio', [stock, dead, hidden])
    const allHidden = productOf('oculto', 'Oculto', [
      listingOf('a', { enabled: false }),
      listingOf('b', { enabled: false }),
    ])

    const deadView = requireOpen(listingByPath([product], 'relogio', 'dead', null, []))
    expect(deadView.price).toBe(1)
    expect(deadView.availabilityLabel).toBe('Indisponível')
    expect(deadView.availabilityStatus).toBe('on_order')
    expect(deadView.offers).toEqual([])
    expect(requireOpen(listingByPath([product], 'relogio', null, null, [])).listingId).toBe('stock')
    expect(listingByPath([product], 'relogio', 'hidden', null, [])).toEqual({ missing: true })
    expect(listingByPath([product], 'relogio', 'ausente', null, [])).toEqual({ missing: true })
    expect(listingByPath([product], 'nao-existe', null, null, [])).toEqual({ missing: true })
    expect(listingByPath([product], 'nao-existe', 'stock', null, [])).toEqual({ missing: true })
    expect(listingByPath([allHidden], 'oculto', null, null, [])).toEqual({ missing: true })
    expect(listingByPath([allHidden], 'oculto', 'a', null, [])).toEqual({ missing: true })
    expect(MISSING_LISTING_TEXT).toBe('Este relógio não está no catálogo.')
  })

  it('builds the title from alias or value and shows each selector value, with impossible options disabled', () => {
    const product = vistaProduct()
    const view = requireOpen(listingByPath([product], 'vista', 'vista', 'preto,m', []))

    expect(view.title).toBe('Pulseira Black M')
    expect(requireOpen(listingByPath([product], 'vista', 'vista', 'azul,p', [])).title).toBe(
      'Pulseira Azul P',
    )

    const plain = productOf('liso', 'Liso', [
      listingOf('listing', {
        images: ['a.jpg', 'b.jpg'],
        variants: [variantOf(9, { mainImage: 'b.jpg' })],
      }),
    ])
    const plainView = requireOpen(listingByPath([plain], 'liso', null, null, []))
    expect(plainView.title).toBe('Liso')
    expect(plainView.selectors).toEqual([])

    const color = view.selectors.find((selector) => selector.axisId === 'color')
    const size = view.selectors.find((selector) => selector.axisId === 'size')
    expect(view.selectors.map((selector) => selector.label)).toEqual(['Cor', 'Tamanho'])
    expect(color?.presentation).toBe('text')
    expect(size?.presentation).toBe('text')
    expect(color?.options[0]).not.toHaveProperty('imageFile')
    expect(size?.options[0]).not.toHaveProperty('imageFile')
    expect(color?.options.map((option) => option.value)).toEqual(['Preto', 'Azul'])
    expect(color?.options).toEqual([
      { valueId: 'preto', value: 'Preto', disabled: false, unavailable: false, v: 'preto,m' },
      { valueId: 'azul', value: 'Azul', disabled: false, unavailable: false, v: 'azul,p' },
    ])
    expect(size?.options).toEqual([
      { valueId: 'p', value: 'P', disabled: true, unavailable: false, v: null },
      { valueId: 'm', value: 'M', disabled: false, unavailable: false, v: 'preto,m' },
    ])
  })

  it('lands on the first queue variant that contains the new axis value and starts the carousel at mainImage', () => {
    const product = vistaProduct()
    const current = requireOpen(listingByPath([product], 'vista', 'vista', 'preto,m', []))
    const azul = current.selectors
      .find((selector) => selector.axisId === 'color')
      ?.options.find((option) => option.valueId === 'azul')

    expect(azul).toEqual({
      valueId: 'azul',
      value: 'Azul',
      disabled: false,
      unavailable: false,
      v: 'azul,p',
    })

    const next = requireOpen(listingByPath([product], 'vista', 'vista', azul?.v ?? null, []))
    expect(next.price).toBe(10)
    expect(next.title).toBe('Pulseira Azul P')
    expect(current.images).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
    expect(current.images[current.imageIndex]).toBe('b.jpg')
    expect(current.images.slice(current.imageIndex)).toEqual(['b.jpg', 'c.jpg'])
    expect(next.images).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
    expect(next.images[next.imageIndex]).toBe('a.jpg')
    expect(next.images.slice(next.imageIndex)).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])

    const queued = productOf(
      'fila-eixo',
      'Fila',
      [
        listingOf('item', {
          availabilityStatus: 'on_order',
          images: [img],
          variants: [
            variantOf(99, {
              orderable: false,
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'p' },
              ],
            }),
            variantOf(20, {
              axes: [
                { axisId: 'color', valueId: 'preto' },
                { axisId: 'size', valueId: 'm' },
              ],
            }),
            variantOf(30, {
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'm' },
              ],
            }),
          ],
        }),
      ],
      {
        axes: [
          {
            id: 'color',
            label: 'Cor',
            values: [
              { id: 'preto', value: 'Preto' },
              { id: 'azul', value: 'Azul' },
            ],
          },
          {
            id: 'size',
            label: 'Tamanho',
            values: [
              { id: 'p', value: 'P' },
              { id: 'm', value: 'M' },
            ],
          },
        ],
      },
    )
    const queuedView = requireOpen(listingByPath([queued], 'fila-eixo', 'item', 'preto,m', []))
    const queuedAzul = queuedView.selectors
      .find((selector) => selector.axisId === 'color')
      ?.options.find((option) => option.valueId === 'azul')
    expect(queuedAzul?.v).toBe('azul,m')
    expect(requireOpen(listingByPath([queued], 'fila-eixo', 'item', queuedAzul?.v ?? null, [])).price).toBe(
      30,
    )
  })

  it('keeps description and specification sheets while price, observations, and offer follow the variant', () => {
    const product = vistaProduct()
    const current = requireOpen(listingByPath([product], 'vista', 'vista', 'preto,m', initialLabels))
    const next = requireOpen(listingByPath([product], 'vista', 'vista', 'azul,p', initialLabels))

    expect([current.productSpecifications, current.listingSpecifications]).toEqual([
      [{ label: 'Marca', value: 'Seiko' }],
      [{ label: 'Modelo', value: 'Vista' }],
    ])
    expect(next.description).toBe(current.description)
    expect(next.productSpecifications).toEqual(current.productSpecifications)
    expect(next.listingSpecifications).toEqual(current.listingSpecifications)
    expect(current.description).toBe('Texto fixo')
    expect(current.price).toBe(20)
    expect(current.listPrice).toBe(40)
    expect(current.observations).toBe('Caixa')
    expect(current.campaign).toMatchObject({
      id: 'black-friday',
      shortText: 'Black Friday',
      text: 'Black Friday',
    })
    expect(current.offers).toEqual([
      {
        id: 'discount-20',
        text: 'acima 20%',
        icon: 'Gift',
        background: '#000000',
        color: '#FFFFFF',
      },
    ])
    expect(current.availabilityStatus).toBe('available')
    expect(next.price).toBe(10)
    expect(next.listPrice).toBeUndefined()
    expect(next.observations).toBeUndefined()
    expect(next.offers).toEqual([])
    expect(current.listingId).toBe('vista')
  })

  it('shows Indisponível for an non-orderable variant, keeps the state label, and keeps the price', () => {
    const product = productOf(
      'encomenda',
      'Encomenda',
      [
        listingOf('dead', {
          state: 'new',
          availabilityStatus: 'on_order',
          images: [img, 'b.jpg'],
          variants: [
            variantOf(55, {
              orderable: false,
              mainImage: 'b.jpg',
              axes: [{ axisId: 'color', valueId: 'a' }],
            }),
            variantOf(70, {
              orderable: false,
              axes: [{ axisId: 'color', valueId: 'b' }],
            }),
          ],
        }),
      ],
      {
        axes: [
          {
            id: 'color',
            label: 'Cor',
            values: [
              { id: 'a', value: 'A' },
              { id: 'b', value: 'B' },
            ],
          },
        ],
      },
    )

    const view = requireOpen(listingByPath([product], 'encomenda', 'dead', 'b', []))
    expect(view.price).toBe(70)
    expect(view.availabilityLabel).toBe('Indisponível')
    expect(view.availabilityStatus).toBe('on_order')
    expect(view.stateLabel).toBe('Novo')
    expect(view.images[view.imageIndex]).toBe(img)

    const states: [Listing['state'], string][] = [
      ['new', 'Novo'],
      ['openbox', 'Openbox'],
      ['used', 'Usado'],
      ['defective', 'Com defeito'],
    ]
    for (const [state, label] of states) {
      const labeled = productOf('estado', 'Estado', [listingOf('item', { state })])
      expect(requireOpen(listingByPath([labeled], 'estado', 'item', null, [])).stateLabel).toBe(label)
    }

    const available = requireOpen(listingByPath([vistaProduct()], 'vista', 'vista', 'preto,m', []))
    expect(available.availabilityLabel).toBe('Disponível')
    expect(available.stateLabel).toBe('Usado')
  })

  it('treats an omitted axis presentation as text and copies imageFile from the first variantQueue variant', () => {
    const product = productOf(
      'eixos',
      'Eixos',
      [
        listingOf('item', {
          images: ['capa.jpg'],
          variants: [
            variantOf(99, {
              orderable: false,
              mainImage: 'morta.jpg',
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'p' },
              ],
            }),
            variantOf(20, {
              mainImage: 'fila.jpg',
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'm' },
              ],
            }),
            variantOf(30, {
              mainImage: 'preto.jpg',
              axes: [
                { axisId: 'color', valueId: 'preto' },
                { axisId: 'size', valueId: 'm' },
              ],
            }),
          ],
        }),
      ],
      {
        axes: [
          {
            id: 'color',
            label: 'Cor',
            presentation: 'image',
            values: [
              { id: 'preto', value: 'Preto' },
              { id: 'azul', value: 'Azul' },
              { id: 'verde', value: 'Verde' },
            ],
          },
          {
            id: 'size',
            label: 'Tamanho',
            values: [
              { id: 'p', value: 'P' },
              { id: 'm', value: 'M' },
            ],
          },
        ],
      },
    )

    const view = requireOpen(listingByPath([product], 'eixos', 'item', 'preto,m', []))
    const color = view.selectors.find((selector) => selector.axisId === 'color')
    const size = view.selectors.find((selector) => selector.axisId === 'size')

    expect(color?.presentation).toBe('image')
    expect(size?.presentation).toBe('text')
    expect(size?.options.every((option) => !('imageFile' in option))).toBe(true)
    expect(color?.options).toEqual([
      {
        valueId: 'preto',
        value: 'Preto',
        disabled: false,
        unavailable: false,
        v: 'preto,m',
        imageFile: 'preto.jpg',
      },
      {
        valueId: 'azul',
        value: 'Azul',
        disabled: false,
        unavailable: false,
        v: 'azul,m',
        imageFile: 'fila.jpg',
      },
    ])
  })
})

describe('published catalog module', () => {
  it('does not export listingForDisplay or coveredVariantKeys', () => {
    expect('listingForDisplay' in listingModule).toBe(false)
    expect('coveredVariantKeys' in listingModule).toBe(false)
    expect('listingForDisplay' in shared).toBe(false)
    expect('coveredVariantKeys' in shared).toBe(false)
  })
})

describe('shareMessage', () => {
  const origin = 'https://loja.example'

  it('builds the spec sentence with page title, Portuguese state and availability, and absolute URL with path /product/slug/id and v only when there are axes', () => {
    const product = vistaProduct()
    const listing = product.listings.find((item) => item.id === 'vista')!
    const variant = listing.variants.find((item) => item.price === 20)!

    expect(shareMessage(product, listing, variant, origin)).toBe(
      'Olá, tenho interesse no Pulseira Black M. Usado, Disponível. https://loja.example/product/vista/vista?v=preto,m',
    )
  })

  it('uses Indisponível in the sentence when the variant is orderable false', () => {
    const product = productOf(
      'encomenda',
      'Encomenda',
      [
        listingOf('dead', {
          state: 'new',
          availabilityStatus: 'on_order',
          images: [img],
          variants: [
            variantOf(55, {
              orderable: false,
              mainImage: img,
              axes: [{ axisId: 'color', valueId: 'a' }],
            }),
          ],
        }),
      ],
      {
        axes: [
          {
            id: 'color',
            label: 'Cor',
            values: [{ id: 'a', value: 'A' }],
          },
        ],
      },
    )
    const listing = product.listings[0]!
    const variant = listing.variants[0]!

    expect(shareMessage(product, listing, variant, `${origin}/`)).toBe(
      'Olá, tenho interesse no Encomenda A. Novo, Indisponível. https://loja.example/product/encomenda/dead?v=a',
    )
  })

  it('omits ?v= when the product has no axes', () => {
    const product = productOf('liso', 'Liso', [
      listingOf('listing', {
        images: ['a.jpg'],
        variants: [variantOf(9, { mainImage: 'a.jpg' })],
      }),
    ])
    const listing = product.listings[0]!
    const variant = listing.variants[0]!

    expect(shareMessage(product, listing, variant, origin)).toBe(
      'Olá, tenho interesse no Liso. Novo, Disponível. https://loja.example/product/liso/listing',
    )
  })
})

function vistaProduct(): Product {
  return {
    ...productOf(
      'vista',
      'Pulseira',
      [
        listingOf('vista', {
          state: 'used',
          images: ['a.jpg', 'b.jpg', 'c.jpg'],
          specifications: [{ label: 'Modelo', value: 'Vista' }],
          variants: [
            variantOf(10, {
              mainImage: 'a.jpg',
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'p' },
              ],
            }),
            variantOf(20, {
              mainImage: 'b.jpg',
              listPrice: 40,
              availabilityStatus: 'available',
              observations: 'Caixa',
              axes: [
                { axisId: 'color', valueId: 'preto' },
                { axisId: 'size', valueId: 'm' },
              ],
            }),
            variantOf(30, {
              mainImage: 'c.jpg',
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'm' },
              ],
            }),
          ],
        }),
        listingOf('outro', {
          availabilityStatus: 'coming_soon',
          specifications: [{ label: 'Modelo', value: 'Outro' }],
        }),
      ],
      {
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
              { id: 'p', value: 'P' },
              { id: 'm', value: 'M' },
            ],
          },
        ],
      },
    ),
    description: 'Texto fixo',
    specifications: [{ label: 'Marca', value: 'Seiko' }],
  }
}


describe('resolved labels on cards and listing views', () => {
  it('LBL-15/LBL-27/LBL-34: on_order leaves campaign and offers empty on cards and views, including legacy listings', () => {
    const legacy = productOf(
      'watch',
      'Watch',
      [
        listingOf('sob-encomenda', {
          availabilityStatus: 'on_order',
          images: ['cover.png'],
          variants: [{ axes: [], mainImage: 'cover.png', price: 100 }],
        }),
      ],
    )
    const modern = productOf('modern', 'Modern', [
      listingOf('item', {
        variants: [{ axes: [], mainImage: img, availabilityStatus: 'on_order', price: 50 }],
      }),
    ])

    expect(homeCards([legacy], 'on-order', initialLabels)[0]).toMatchObject({
      campaign: null,
      offers: [],
    })
    expect(homeCards([modern], null, initialLabels)[0]).toMatchObject({
      campaign: null,
      offers: [],
    })

    const legacyView = requireOpen(
      listingByPath([legacy], 'watch', 'sob-encomenda', null, initialLabels),
    )
    expect(legacyView.campaign).toBeNull()
    expect(legacyView.offers).toEqual([])
  })

  it('LBL-19/LBL-20: attaches one campaign and the winning discount offer to cards and views', () => {
    const product = productOf('promo', 'Promo', [
      listingOf('main', {
        variants: [variantOf(80, { listPrice: 100, availabilityStatus: 'available' })],
      }),
    ])

    const card = homeCards([product], null, initialLabels)[0]!
    expect(card.campaign).toMatchObject({ id: 'black-friday', shortText: 'Black Friday' })
    expect(card.offers).toEqual([
      {
        id: 'discount-20',
        text: 'acima 20%',
        icon: 'Gift',
        background: '#000000',
        color: '#FFFFFF',
      },
    ])

    const view = requireOpen(listingByPath([product], 'promo', 'main', null, initialLabels))
    expect(view.campaign?.id).toBe('black-friday')
    expect(view.offers.map((item) => item.id)).toEqual(['discount-20'])
  })

  it('LBL-16: listing disabledLabels remove the campaign from every variant card', () => {
    const product = productOf('promo', 'Promo', [
      listingOf('main', {
        disabledLabels: ['black-friday'],
        variants: [variantOf(80, { listPrice: 100, availabilityStatus: 'available' })],
      }),
    ])

    const card = homeCards([product], null, initialLabels)[0]!
    expect(card.campaign).toBeNull()
    expect(card.offers.map((item) => item.id)).toEqual(['discount-20'])
  })
})

describe('on_order without a required price', () => {
  it.each([undefined, 100])('omits card prices and opens a variant with optional price %s', (price) => {
    const listing = listingOf('sob-encomenda', {
      availabilityStatus: 'on_order',
      images: ['cover.png', 'variant.png'],
      variants: [{ axes: [], mainImage: 'variant.png', ...(price === undefined ? {} : { price }) }],
    })
    const product = productOf('watch', 'Watch', [listing])
    const cards = homeCards([product], 'on-order', [])
    expect(cards).toHaveLength(1)
    expect(cards[0].image).toBe('cover.png')
    expect(cards[0].price).toBeUndefined()
    const view = listingByPath([product], 'watch', 'sob-encomenda', null, [])
    expect(view.missing).toBe(false)
    if (!view.missing) {
      expect(view.price).toBe(price)
      expect(view.imageIndex).toBe(0)
      expect(view.images[view.imageIndex]).toBe('cover.png')
      expect(view.availabilityLabel).toBe('Sob encomenda')
    }
    const direct = listingByPath([product], 'watch', 'sob-encomenda', 'variant', [])
    expect(direct.missing).toBe(false)
    if (!direct.missing) {
      expect(direct.price).toBe(price)
      expect(direct.imageIndex).toBe(1)
      expect(direct.images[direct.imageIndex]).toBe('variant.png')
    }
  })
})
