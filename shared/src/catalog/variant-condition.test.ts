import { describe, expect, it } from 'vitest'
import type { Product, Variant } from '../schemas/product.ts'
import { effectiveAvailability, effectiveState, variantKey } from './variant-condition.ts'

type ConditionVariant = Variant & {
  state?: 'new' | 'openbox' | 'used' | 'defective'
  availabilityStatus?: 'available' | 'coming_soon' | 'on_order'
}

function product(): Product {
  return {
    slug: 'relogio',
    title: 'Relógio',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        values: [{ id: 'black', value: 'Preto' }],
      },
      {
        id: 'size',
        label: 'Tamanho',
        values: [{ id: 'large', value: 'Grande' }],
      },
    ],
    listings: [],
  }
}

function variant(overrides: Partial<ConditionVariant> = {}): ConditionVariant {
  return {
    axes: [
      { axisId: 'size', valueId: 'large' },
      { axisId: 'color', valueId: 'black' },
    ],
    mainImage: 'watch.jpg',
    ...overrides,
  }
}

describe('variant condition helpers', () => {
  it('uses new when state is absent', () => {
    expect(effectiveState(variant())).toBe('new')
    expect(effectiveState(variant({ state: 'used' }))).toBe('used')
  })

  it('uses on_order when availabilityStatus is absent', () => {
    expect(effectiveAvailability(variant())).toBe('on_order')
    expect(effectiveAvailability(variant({ availabilityStatus: 'available' }))).toBe('available')
  })

  it('builds the key with product axis order and effective condition', () => {
    expect(variantKey(product(), variant())).toBe('color:black|size:large|new|on_order')
    expect(
      variantKey(product(), variant({ state: 'openbox', availabilityStatus: 'available' })),
    ).toBe('color:black|size:large|openbox|available')
  })
})
