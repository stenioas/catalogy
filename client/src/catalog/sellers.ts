import { SellerSchema, type Seller } from '@catalogo/shared'

export async function loadSellers(): Promise<Seller[]> {
  const response = await fetch('/catalog/sellers.json')
  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('sellers.json failed the shared contract')
  }

  const sellers: Seller[] = []
  for (const item of data) {
    const parsed = SellerSchema.safeParse(item)
    if (!parsed.success) {
      throw new Error('sellers.json failed the shared contract')
    }
    sellers.push(parsed.data)
  }

  return sellers
}
