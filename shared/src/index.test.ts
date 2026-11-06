import { describe, expect, it } from 'vitest'
import * as barrel from './index.ts'
import {
  ProductSchema,
  formatBrl,
  truncateReais,
} from './index.ts'

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
        axes: [],
        listings: [
          {
            id: 'listing',
            state: 'new',
            availabilityStatus: 'available',
            images: ['foto.jpg'],
            variants: [{ axes: [], price: 369.9, mainImage: 'foto.jpg' }],
          },
        ],
      }).success,
    ).toBe(true)

    expect(truncateReais(369.999)).toBe(369.99)
    expect(formatBrl(369.9)).toBe('R$ 369,90')
  })
})
