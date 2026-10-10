const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const phonePattern = /^\d{10,15}$/

export type Seller = {
  slug: string
  name: string
  phone: string
}

function parseSeller(item: unknown): Seller | null {
  if (typeof item !== 'object' || item === null) {
    return null
  }
  const record = item as Record<string, unknown>
  if (
    typeof record.slug !== 'string' ||
    !slugPattern.test(record.slug) ||
    typeof record.name !== 'string' ||
    typeof record.phone !== 'string' ||
    !phonePattern.test(record.phone)
  ) {
    return null
  }
  return {
    slug: record.slug,
    name: record.name,
    phone: record.phone,
  }
}

export async function loadSellers(): Promise<Seller[]> {
  const response = await fetch('/catalog/sellers.json')
  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('sellers.json failed the shared contract')
  }

  const sellers: Seller[] = []
  for (const item of data) {
    const parsed = parseSeller(item)
    if (parsed === null) {
      throw new Error('sellers.json failed the shared contract')
    }
    sellers.push(parsed)
  }

  return sellers
}
