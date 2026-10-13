import { describe, expect, it } from 'vitest'
import * as barrel from './index'
import {
  ProductSchema,
  formatBrl,
  truncateReais,
} from './index'

describe('@catalogo/shared barrel (CAT-07, CAT-09, CAT-95, SV-09)', () => {
  it('does not export SellerSchema (SV-09)', () => {
    expect(Object.hasOwn(barrel, 'SellerSchema')).toBe(false)
    expect(barrel.SellerSchema).toBeUndefined()
  })

  it('exports ProductSchema and money helpers with spec-defined behavior', () => {
    expect(
      ProductSchema.safeParse({
        slug: 'seculus',
        title: 'Seculus',
        state: 'Novo',
        price: 369.9,
        images: ['foto.jpg'],
      }).success,
    ).toBe(true)

    expect(truncateReais(369.999)).toBe(369.99)
    expect(formatBrl(369.9)).toBe('R$ 369,90')
  })
})
