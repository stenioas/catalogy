import { describe, expect, it } from 'vitest'
import { SellerSchema } from './seller'

const validSeller = {
  slug: 'alexandre',
  name: 'Alexandre',
  phone: '5511999999999',
}

describe('SellerSchema phone (CAT-01, CAT-02, CAT-03)', () => {
  it('accepts a phone with only digits between 10 and 15 characters', () => {
    expect(SellerSchema.safeParse(validSeller).success).toBe(true)
  })

  it('rejects a phone that contains a plus sign', () => {
    const result = SellerSchema.safeParse({
      ...validSeller,
      phone: '+5511999999999',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a phone that contains a space', () => {
    const result = SellerSchema.safeParse({
      ...validSeller,
      phone: '5511 999999999',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a phone that contains parentheses', () => {
    const result = SellerSchema.safeParse({
      ...validSeller,
      phone: '(55)11999999999',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a phone that contains a letter', () => {
    const result = SellerSchema.safeParse({
      ...validSeller,
      phone: '551199999999a',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a phone with fewer than 10 digits', () => {
    const result = SellerSchema.safeParse({
      ...validSeller,
      phone: '123456789',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a phone with more than 15 digits', () => {
    const result = SellerSchema.safeParse({
      ...validSeller,
      phone: '1234567890123456',
    })
    expect(result.success).toBe(false)
  })
})

describe('SellerSchema slug (CAT-04)', () => {
  it('rejects a slug outside lowercase letters, digits, and single hyphens', () => {
    expect(
      SellerSchema.safeParse({ ...validSeller, slug: 'Alexandre' }).success,
    ).toBe(false)
    expect(
      SellerSchema.safeParse({ ...validSeller, slug: 'alexandre-' }).success,
    ).toBe(false)
    expect(
      SellerSchema.safeParse({ ...validSeller, slug: '-alexandre' }).success,
    ).toBe(false)
    expect(
      SellerSchema.safeParse({ ...validSeller, slug: 'alex--andre' }).success,
    ).toBe(false)
  })

  it('accepts a slug matching the contract pattern', () => {
    expect(
      SellerSchema.safeParse({ ...validSeller, slug: 'ana-claudia' }).success,
    ).toBe(true)
  })
})
