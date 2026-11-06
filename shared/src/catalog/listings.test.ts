import { describe, expect, it } from 'vitest'
import type { Listing, Product, Variant } from '../schemas/product'
import {
  activeSection,
  canVariantRepresentCard,
  filterGroups,
  homeCards,
  homeEmptyText,
  resolveVariant,
  variantQueue,
  type FilterMarks,
} from './listings'

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

const noMarks: FilterMarks = { state: [], audience: [], axes: {} }

function variantOf(price: number, extras: Partial<Variant> = {}): Variant {
  return {
    axes: [],
    mainImage: img,
    ...extras,
    price,
  }
}

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
  it('opens the first section that has a card when section is missing or invalid', () => {
    const products = [
      productOf('oculto', 'Oculto', [listingOf('oculto', { enabled: false })]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon' }),
      ]),
      productOf('encomenda', 'Encomenda', [
        listingOf('encomenda', { availabilityStatus: 'on_order' }),
      ]),
    ]

    expect(activeSection(products, null)).toBe('coming-soon')
    expect(activeSection(products, '')).toBe('coming-soon')
    expect(activeSection(products, 'coming_soon')).toBe('coming-soon')
    expect(activeSection(products, 'outro')).toBe('coming-soon')
  })

  it('opens Disponível when that section has a card', () => {
    const products = [
      productOf('pronto', 'Pronto', [listingOf('pronto')]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon' }),
      ]),
    ]
    expect(activeSection(products, null)).toBe('available')
  })

  it('opens Sob encomenda when earlier sections have no card', () => {
    const products = [
      productOf('encomenda', 'Encomenda', [
        listingOf('encomenda', { availabilityStatus: 'on_order', state: 'new' }),
      ]),
    ]
    expect(activeSection(products, null)).toBe('on-order')
  })

  it('stays on Disponível when no section has a card', () => {
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
    expect(activeSection(products, null)).toBe('available')
    expect(activeSection(products, 'invalida')).toBe('available')
    expect(homeEmptyText(products, null, noMarks)).toBe('Não temos nenhum anúncio ativo.')
  })

  it('stays on the named section when that section has no card', () => {
    const products = [
      productOf('pronto', 'Pronto', [listingOf('pronto')]),
    ]
    expect(activeSection(products, 'on-order')).toBe('on-order')
    expect(homeCards(products, 'on-order', noMarks)).toEqual([])
    expect(activeSection(products, 'coming-soon')).toBe('coming-soon')
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

  function colored(id: string): Product {
    return productOf(
      'seculus',
      'Seculus',
      [
        listingOf(id, {
          variants: [
            variantOf(10, {
              mainImage: 'barato.jpg',
              unmissableOffer: true,
              axes: [{ axisId: 'cor', valueId: 'preto' }],
            }),
            variantOf(30, {
              mainImage: 'oferta.jpg',
              listPrice: 40,
              unmissableOffer: true,
              axes: [{ axisId: 'cor', valueId: 'azul' }],
            }),
            variantOf(20, {
              mainImage: 'comum.jpg',
              axes: [{ axisId: 'cor', valueId: 'verde' }],
            }),
          ],
        }),
      ],
      { axes: [color] },
    )
  }

  it('renders one card from the first unmissable variant that passes the filter and can represent the card', () => {
    const cards = homeCards([colored('novo')], 'available', {
      state: [],
      audience: [],
      axes: { cor: ['azul', 'verde'] },
    })
    expect(cards).toEqual([
      {
        slug: 'seculus',
        listingId: 'novo',
        title: 'Seculus',
        image: 'oferta.jpg',
        price: 30,
        listPrice: 40,
        unmissableOffer: true,
        statusLabel: 'Disponível',
        path: '/product/seculus/novo?v=azul',
      },
    ])
    expect(cards[0].title).not.toContain('Az')
    expect(cards[0].title).not.toContain('Preto fosco')
  })

  it('uses the first variant in queue order that passes the filter when none of them is unmissable', () => {
    expect(
      homeCards([colored('novo')], 'available', {
        state: [],
        audience: [],
        axes: { cor: ['verde'] },
      }),
    ).toEqual([
      {
        slug: 'seculus',
        listingId: 'novo',
        title: 'Seculus',
        image: 'comum.jpg',
        price: 20,
        unmissableOffer: false,
        statusLabel: 'Disponível',
        path: '/product/seculus/novo?v=verde',
      },
    ])
  })

  it('omits the card when no variant both passes the filter and can represent it', () => {
    expect(
      homeCards([colored('novo')], 'available', {
        state: [],
        audience: [],
        axes: { cor: ['amarelo'] },
      }),
    ).toEqual([])
    expect(
      homeEmptyText([colored('novo')], 'available', {
        state: [],
        audience: [],
        axes: { cor: ['amarelo'] },
      }),
    ).toBe('Nenhum anúncio corresponde aos filtros.')
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
                unmissableOffer: true,
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
    expect(homeCards(products, 'on-order', noMarks)).toEqual([
      {
        slug: 'seculus',
        listingId: 'encomenda',
        title: 'Seculus',
        image: 'venda.jpg',
        price: 80,
        listPrice: 90,
        unmissableOffer: false,
        statusLabel: 'Sob encomenda',
        path: '/product/seculus/encomenda?v=azul',
      },
    ])
  })

  it('uses the listing availability label, including Chega em breve', () => {
    const products = [
      productOf('av', 'Av', [listingOf('av')]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon', state: 'used' }),
      ]),
    ]
    expect(homeCards(products, 'available', noMarks)[0]).toEqual({
      slug: 'av',
      listingId: 'av',
      title: 'Av',
      image: img,
      price: 100,
      unmissableOffer: false,
      statusLabel: 'Disponível',
      path: '/product/av/av',
    })
    expect(homeCards(products, 'coming-soon', noMarks)[0]).toEqual({
      slug: 'breve',
      listingId: 'breve',
      title: 'Breve',
      image: img,
      price: 100,
      unmissableOffer: false,
      statusLabel: 'Chega em breve',
      path: '/product/breve/breve',
    })
    expect(homeCards(products, 'available', noMarks)[0].statusLabel).not.toBe('Indisponível')
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
    expect(homeCards(products, null, noMarks).map((card) => card.path)).toEqual([
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
    expect(homeCards(products, 'available', noMarks).map((card) => card.path)).toEqual([
      '/product/liso/unico',
      '/product/seculus/novo?v=preto,gg',
    ])
  })

  it('keeps the same marks when the section changes and when the home is opened again', () => {
    const products = [
      productOf('novo', 'Novo', [listingOf('novo', { state: 'new' })]),
      productOf('breve', 'Breve', [
        listingOf('breve', { availabilityStatus: 'coming_soon', state: 'used' }),
      ]),
    ]
    const marks: FilterMarks = { state: ['new'], audience: [], axes: {} }
    const first = homeCards(products, 'available', marks).map((card) => card.path)
    const again = homeCards(products, 'available', marks).map((card) => card.path)
    expect(first).toEqual(['/product/novo/novo'])
    expect(again).toEqual(['/product/novo/novo'])
    expect(homeCards(products, 'coming-soon', marks)).toEqual([])
    expect(marks).toEqual({ state: ['new'], audience: [], axes: {} })
  })

  it('ORs marks inside a group and ANDs marks across groups', () => {
    const products = [
      productOf('m-new', 'B', [listingOf('m-new', { state: 'new' })], { audience: 'male' }),
      productOf('f-new', 'A', [listingOf('f-new', { state: 'new' })], { audience: 'female' }),
      productOf('m-used', 'C', [listingOf('m-used', { state: 'used' })], { audience: 'male' }),
      productOf('plain', 'D', [listingOf('plain', { state: 'new' })]),
    ]
    expect(homeCards(products, 'available', noMarks).map((card) => card.listingId)).toEqual([
      'f-new',
      'm-new',
      'm-used',
      'plain',
    ])
    expect(
      homeCards(products, 'available', { state: ['new', 'used'], audience: [], axes: {} }).map(
        (card) => card.listingId,
      ),
    ).toEqual(['f-new', 'm-new', 'm-used', 'plain'])
    expect(
      homeCards(products, 'available', { state: ['new'], audience: [], axes: {} }).map(
        (card) => card.listingId,
      ),
    ).toEqual(['f-new', 'm-new', 'plain'])
    expect(
      homeCards(products, 'available', {
        state: ['new'],
        audience: ['male'],
        axes: {},
      }).map((card) => card.listingId),
    ).toEqual(['m-new'])
    expect(
      homeCards(products, 'available', {
        state: [],
        audience: ['male', 'female'],
        axes: {},
      }).map((card) => card.listingId),
    ).toEqual(['f-new', 'm-new', 'm-used'])
  })

  it('ignores an unknown mark and still restricts a known mark absent from the section', () => {
    const products = [
      productOf('usado', 'Usado', [listingOf('usado', { state: 'used' })]),
      productOf('novo', 'Novo', [listingOf('novo', { state: 'new' })]),
    ]
    const absent: FilterMarks = { state: ['openbox'], audience: [], axes: { seller: ['loja'] } }
    expect(filterGroups(products, 'available')).toEqual([
      {
        id: 'state',
        label: 'Estado',
        options: [
          { id: 'new', label: 'Novo' },
          { id: 'used', label: 'Usado' },
        ],
      },
    ])
    expect(homeCards(products, 'available', absent)).toEqual([])
    expect(homeEmptyText(products, 'available', absent)).toBe(
      'Nenhum anúncio corresponde aos filtros.',
    )
    expect(absent).toEqual({ state: ['openbox'], audience: [], axes: { seller: ['loja'] } })
    expect(
      homeCards(products, 'available', {
        state: ['zzz', 'new'],
        audience: ['baby'],
        axes: { cor: ['fantasma'], seller: ['loja'] },
      }).map((card) => card.listingId),
    ).toEqual(['novo'])
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
    expect(homeCards(products, null, noMarks).map((card) => card.listingId)).toEqual(['omisso'])
    expect(activeSection(products, null)).toBe('available')
    expect(filterGroups(products, 'on-order')).toEqual([])
  })
})

describe('filterGroups', () => {
  it('orders Estado, Público-alvo, then axes by label, and omits values the section does not have', () => {
    const products = [
      productOf('alfa', 'Alfa', [listingOf('alfa', { state: 'defective' })]),
      productOf('unissex', 'Beta', [listingOf('unissex', { state: 'used' })], {
        audience: 'unisex',
      }),
      productOf('crianca', 'Celta', [listingOf('crianca', { state: 'openbox' })], {
        audience: 'child',
      }),
      productOf(
        'cores',
        'Delta',
        [
          listingOf('cores', {
            state: 'new',
            variants: [
              variantOf(10, {
                axes: [
                  { axisId: 'pulseira', valueId: 'm' },
                  { axisId: 'cor', valueId: 'az' },
                ],
              }),
              variantOf(20, {
                axes: [
                  { axisId: 'pulseira', valueId: 'g' },
                  { axisId: 'cor', valueId: 'am' },
                ],
              }),
            ],
          }),
        ],
        {
          audience: 'male',
          axes: [
            {
              id: 'pulseira',
              label: 'Pulseira',
              values: [
                { id: 'm', value: 'Médio' },
                { id: 'g', value: 'Grande' },
              ],
            },
            {
              id: 'cor',
              label: 'Cor',
              values: [
                { id: 'az', value: 'Azul', alias: 'Az' },
                { id: 'am', value: 'Amarelo' },
              ],
            },
          ],
        },
      ),
      productOf(
        'breve',
        'Breve',
        [listingOf('breve', { availabilityStatus: 'coming_soon', state: 'new' })],
        { audience: 'female' },
      ),
      productOf(
        'oculto',
        'Oculto',
        [listingOf('oculto', { enabled: false, state: 'new' })],
        { audience: 'female' },
      ),
    ]

    expect(filterGroups(products, 'available')).toEqual([
      {
        id: 'state',
        label: 'Estado',
        options: [
          { id: 'new', label: 'Novo' },
          { id: 'openbox', label: 'Openbox' },
          { id: 'used', label: 'Usado' },
          { id: 'defective', label: 'Com defeito' },
        ],
      },
      {
        id: 'audience',
        label: 'Público-alvo',
        options: [
          { id: 'male', label: 'Masculino' },
          { id: 'unisex', label: 'Unissex' },
          { id: 'child', label: 'Infantil' },
        ],
      },
      {
        id: 'cor',
        label: 'Cor',
        options: [
          { id: 'am', label: 'Amarelo' },
          { id: 'az', label: 'Azul' },
        ],
      },
      {
        id: 'pulseira',
        label: 'Pulseira',
        options: [
          { id: 'g', label: 'Grande' },
          { id: 'm', label: 'Médio' },
        ],
      },
    ])
    expect(filterGroups(products, 'outro')[0].options.map((option) => option.id)).toEqual([
      'new',
      'openbox',
      'used',
      'defective',
    ])
  })

  it('hides a group that has exactly one option in the section catalog', () => {
    const products = [
      productOf(
        'unico',
        'Único',
        [
          listingOf('unico', {
            variants: [variantOf(10, { axes: [{ axisId: 'cor', valueId: 'preto' }] })],
          }),
        ],
        {
          audience: 'male',
          axes: [{ id: 'cor', label: 'Cor', values: [{ id: 'preto', value: 'Preto' }] }],
        },
      ),
    ]
    expect(filterGroups(products, 'available')).toEqual([])
  })

  it('lets every variant of a Disponível listing contribute options, including orderable false', () => {
    const products = [
      productOf(
        'cores',
        'Cores',
        [
          listingOf('cores', {
            variants: [
              variantOf(10, { axes: [{ axisId: 'cor', valueId: 'preto' }] }),
              variantOf(20, {
                orderable: false,
                axes: [{ axisId: 'cor', valueId: 'verde' }],
              }),
            ],
          }),
        ],
        {
          axes: [
            {
              id: 'cor',
              label: 'Cor',
              values: [
                { id: 'preto', value: 'Preto' },
                { id: 'verde', value: 'Verde' },
              ],
            },
          ],
        },
      ),
    ]
    expect(filterGroups(products, 'available')).toEqual([
      {
        id: 'cor',
        label: 'Cor',
        options: [
          { id: 'preto', label: 'Preto' },
          { id: 'verde', label: 'Verde' },
        ],
      },
    ])
  })

  it('takes Sob encomenda options only from variants that can represent a card', () => {
    const products = [
      productOf(
        'misto',
        'Misto',
        [
          listingOf('misto', {
            availabilityStatus: 'on_order',
            state: 'new',
            variants: [
              variantOf(10, { axes: [{ axisId: 'cor', valueId: 'preto' }] }),
              variantOf(20, { axes: [{ axisId: 'cor', valueId: 'azul' }] }),
              variantOf(30, {
                orderable: false,
                axes: [{ axisId: 'cor', valueId: 'verde' }],
              }),
            ],
          }),
        ],
        {
          axes: [
            {
              id: 'cor',
              label: 'Cor',
              values: [
                { id: 'verde', value: 'Verde' },
                { id: 'preto', value: 'Preto' },
                { id: 'azul', value: 'Azul' },
              ],
            },
          ],
        },
      ),
      productOf(
        'fora',
        'Fora',
        [
          listingOf('fora', {
            availabilityStatus: 'on_order',
            state: 'defective',
            variants: [
              variantOf(5, {
                orderable: false,
                axes: [{ axisId: 'cor', valueId: 'rosa' }],
              }),
            ],
          }),
        ],
        {
          audience: 'female',
          axes: [
            {
              id: 'cor',
              label: 'Cor',
              values: [{ id: 'rosa', value: 'Rosa' }],
            },
          ],
        },
      ),
      productOf('usado', 'Usado', [
        listingOf('usado', { availabilityStatus: 'on_order', state: 'used' }),
      ]),
    ]
    expect(filterGroups(products, 'on-order')).toEqual([
      {
        id: 'state',
        label: 'Estado',
        options: [
          { id: 'new', label: 'Novo' },
          { id: 'used', label: 'Usado' },
        ],
      },
      {
        id: 'cor',
        label: 'Cor',
        options: [
          { id: 'azul', label: 'Azul' },
          { id: 'preto', label: 'Preto' },
        ],
      },
    ])
    expect(homeCards(products, 'on-order', noMarks).map((card) => card.listingId)).toEqual([
      'misto',
      'usado',
    ])
  })
})
