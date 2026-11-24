import { describe, expect, it } from 'vitest'
import type { Listing, Variant } from '../schemas/product.ts'
import { parseLabels, resolveLabels } from './labels.ts'

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 'black-friday',
    enabled: true,
    type: 'campaign',
    text: 'Black Friday',
    shortText: 'Black Friday',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
    ...overrides,
  }
}

function offer(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  }
}

describe('parseLabels', () => {
  it('LBL-02: rejeita dois ids de etiqueta iguais', () => {
    expect(() =>
      parseLabels([campaign(), offer({ id: 'black-friday' })]),
    ).toThrow()
  })

  it('LBL-03: rejeita mais de uma campanha com enabled true', () => {
    expect(() =>
      parseLabels([
        campaign({ id: 'black-friday' }),
        campaign({ id: 'cyber-monday', enabled: true }),
      ]),
    ).toThrow()
  })

  it('LBL-04: aceita várias campanhas com enabled false', () => {
    const labels = parseLabels([
      campaign({ id: 'black-friday', enabled: false }),
      campaign({ id: 'cyber-monday', enabled: false }),
      campaign({ id: 'natal', enabled: false }),
      offer(),
    ])
    expect(labels).toHaveLength(4)
    expect(labels.filter((item) => item.type === 'campaign')).toHaveLength(3)
  })

  it('LBL-05: rejeita duas ofertas da mesma categoria com a mesma prioridade', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ id: 'discount-20', priority: 1, enabled: true }),
        offer({
          id: 'discount-30',
          priority: 1,
          enabled: false,
          text: 'acima 30%',
          trigger: { kind: 'discount-at-least', percent: 30 },
        }),
      ]),
    ).toThrow()
  })

  it('LBL-06: rejeita gatilho com kind diferente de discount-at-least', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({
          trigger: { kind: 'last-piece', percent: 20 },
        }),
      ]),
    ).toThrow()
  })

  it('LBL-07: rejeita trigger.percent igual a 0', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ trigger: { kind: 'discount-at-least', percent: 0 } }),
      ]),
    ).toThrow()
  })

  it('LBL-07: aceita trigger.percent igual a 100', () => {
    const labels = parseLabels([
      campaign({ enabled: false }),
      offer({ trigger: { kind: 'discount-at-least', percent: 100 } }),
    ])
    expect(labels).toHaveLength(2)
    const parsed = labels.find((item) => item.type === 'offer')
    expect(parsed?.type === 'offer' && parsed.trigger.percent).toBe(100)
  })

  it('LBL-07: rejeita trigger.percent igual a 101', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ trigger: { kind: 'discount-at-least', percent: 101 } }),
      ]),
    ).toThrow()
  })

  it('LBL-08: rejeita text vazio na campanha', () => {
    expect(() =>
      parseLabels([campaign({ text: '' }), offer({ enabled: false })].reverse()),
    ).toThrow()
  })

  it('LBL-08: rejeita shortText vazio na campanha', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false, shortText: '' }),
        offer(),
      ]),
    ).toThrow()
  })

  it('LBL-08: rejeita icon vazio', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false, icon: '' }),
        offer({ icon: 'Tag' }),
      ]),
    ).toThrow()
  })

  it('LBL-08: rejeita text vazio na oferta', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ text: '' }),
      ]),
    ).toThrow()
  })

  it('aceita cadastro válido com campanha e oferta', () => {
    const labels = parseLabels([campaign(), offer()])
    expect(labels).toHaveLength(2)
    expect(labels[0]?.type).toBe('campaign')
    expect(labels[1]?.type).toBe('offer')
  })
})

type ListingWithDisabled = Listing & { disabledLabels?: string[] }

function catalogListing(overrides: Record<string, unknown> = {}): ListingWithDisabled {
  return {
    id: 'listing-a',
    images: ['foto.jpg'],
    variants: [],
    ...overrides,
  }
}

function catalogVariant(overrides: Record<string, unknown> = {}): Variant {
  return {
    axes: [],
    mainImage: 'foto.jpg',
    availabilityStatus: 'available',
    price: 80,
    listPrice: 100,
    ...overrides,
  } as Variant
}

describe('resolveLabels', () => {
  it('LBL-15: variante on_order devolve campanha e ofertas vazias', () => {
    const labels = parseLabels([campaign(), offer()])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ availabilityStatus: 'on_order', price: undefined }),
    )
    expect(resolved.campaign).toBeNull()
    expect(resolved.offers).toEqual([])
  })

  it('LBL-16: ignora etiquetas com enabled false na resolução', () => {
    const labels = parseLabels([
      campaign({ enabled: false }),
      offer({ enabled: false }),
    ])
    const resolved = resolveLabels(labels, catalogListing(), catalogVariant())
    expect(resolved.campaign).toBeNull()
    expect(resolved.offers).toEqual([])
  })

  it('LBL-17: disabledLabels no anúncio omite a etiqueta em todas as variantes', () => {
    const labels = parseLabels([campaign(), offer()])
    const listing = catalogListing({ disabledLabels: ['black-friday'] })
    const resolved = resolveLabels(labels, listing, catalogVariant())
    expect(resolved.campaign).toBeNull()
    expect(resolved.offers).toHaveLength(1)
    expect(resolved.offers[0]?.id).toBe('discount-20')
  })

  it('LBL-18: disabledLabels na variante omite só nessa variante', () => {
    const labels = parseLabels([campaign(), offer()])
    const listing = catalogListing()
    const withOptOut = resolveLabels(
      labels,
      listing,
      catalogVariant({ disabledLabels: ['discount-20'] }),
    )
    const withoutOptOut = resolveLabels(labels, listing, catalogVariant())
    expect(withOptOut.offers).toEqual([])
    expect(withoutOptOut.offers).toHaveLength(1)
    expect(withOptOut.campaign?.id).toBe('black-friday')
  })

  it('LBL-19: devolve no máximo uma campanha', () => {
    const labels = parseLabels([campaign(), offer()])
    const resolved = resolveLabels(labels, catalogListing(), catalogVariant())
    expect(resolved.campaign?.id).toBe('black-friday')
    expect(resolved.campaign?.shortText).toBe('Black Friday')
  })

  it('LBL-20: três ofertas de desconto elegíveis devolvem só a de menor prioridade', () => {
    const labels = parseLabels([
      campaign({ enabled: false }),
      offer({
        id: 'discount-30',
        priority: 3,
        text: 'acima 30%',
        trigger: { kind: 'discount-at-least', percent: 30 },
      }),
      offer({
        id: 'discount-25',
        priority: 2,
        text: 'acima 25%',
        trigger: { kind: 'discount-at-least', percent: 25 },
      }),
      offer({
        id: 'discount-20',
        priority: 1,
        text: 'acima 20%',
        trigger: { kind: 'discount-at-least', percent: 20 },
      }),
    ])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ price: 65, listPrice: 100 }),
    )
    expect(resolved.offers).toHaveLength(1)
    expect(resolved.offers[0]?.id).toBe('discount-20')
  })

  it('LBL-21: preço 80 e listPrice 100 ativa gatilho discount-at-least com percent 20', () => {
    const labels = parseLabels([campaign({ enabled: false }), offer()])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ price: 80, listPrice: 100 }),
    )
    expect(resolved.offers.map((item) => item.id)).toContain('discount-20')
  })

  it('LBL-22: preço 80.1 e listPrice 100 não ativa gatilho discount-at-least com percent 20', () => {
    const labels = parseLabels([campaign({ enabled: false }), offer()])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ price: 80.1, listPrice: 100 }),
    )
    expect(resolved.offers).toEqual([])
  })

  it('LBL-23: sem price o gatilho discount-at-least é falso', () => {
    const labels = parseLabels([campaign({ enabled: false }), offer()])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ price: undefined, listPrice: 100 }),
    )
    expect(resolved.offers).toEqual([])
  })

  it('LBL-23: sem listPrice o gatilho discount-at-least é falso', () => {
    const labels = parseLabels([campaign({ enabled: false }), offer()])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ price: 80, listPrice: undefined }),
    )
    expect(resolved.offers).toEqual([])
  })

  it('LBL-24: ofertas vencedoras seguem a ordem das categorias em labels.json', () => {
    const labels = parseLabels([
      campaign({ enabled: false }),
      offer({
        id: 'discount-20',
        category: 'discount',
        priority: 1,
        text: 'acima 20%',
        trigger: { kind: 'discount-at-least', percent: 20 },
      }),
      offer({
        id: 'clearance-15',
        category: 'clearance',
        priority: 1,
        text: 'liquidação 15%',
        trigger: { kind: 'discount-at-least', percent: 15 },
      }),
    ])
    const resolved = resolveLabels(
      labels,
      catalogListing(),
      catalogVariant({ price: 70, listPrice: 100 }),
    )
    expect(resolved.offers.map((item) => item.id)).toEqual([
      'discount-20',
      'clearance-15',
    ])
  })
})