import { describe, expect, it } from 'vitest'
import {
  ProductSchema,
  SellerSchema,
  formatBrl,
  truncateReais,
} from './index'

describe('@catalogo/shared barrel (CAT-01, CAT-07, CAT-09, CAT-95)', () => {
  it('exports schemas and money helpers with spec-defined behavior', () => {
    expect(
      SellerSchema.safeParse({
        slug: 'alexandre',
        name: 'Alexandre',
        phone: '5511999999999',
      }).success,
    ).toBe(true)

    expect(
      ProductSchema.safeParse({
        slug: 'seculus',
        title: 'Seculus',
        price: 369.9,
        images: ['foto.jpg'],
      }).success,
    ).toBe(true)

    expect(truncateReais(369.999)).toBe(369.99)
    expect(formatBrl(369.9)).toBe('R$ 369,90')
  })
})
