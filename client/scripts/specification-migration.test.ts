import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const productsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public/catalog/products',
)

type Specification = {
  label: string
  value: string
}

type CatalogProduct = {
  description: string
  specifications?: Specification[]
}

function readProduct(slug: string): CatalogProduct {
  return JSON.parse(
    readFileSync(join(productsDir, slug, 'product.json'), 'utf8'),
  ) as CatalogProduct
}

function labels(product: CatalogProduct): string[] {
  return (product.specifications ?? []).map((item) => item.label)
}

function value(product: CatalogProduct, label: string): string | undefined {
  return product.specifications?.find((item) => item.label === label)?.value
}

describe('catalog specification migration', () => {
  it('omits Formato da caixa from benyar-5229', () => {
    expect(labels(readProduct('benyar-5229'))).not.toContain('Formato da caixa')
  })

  it('records benyar-5229 water resistance as 30m (3 ATM)', () => {
    expect(value(readProduct('benyar-5229'), 'Resistência à água')).toBe(
      '30m (3 ATM)',
    )
  })

  it('omits Homage de Não se aplica from curren-9096', () => {
    const specifications = readProduct('curren-9096').specifications ?? []
    expect(
      specifications.some(
        (item) => item.label === 'Homage de' && item.value === 'Não se aplica',
      ),
    ).toBe(false)
  })

  it('records curren-9096 water resistance as 30m (3 ATM)', () => {
    expect(value(readProduct('curren-9096'), 'Resistência à água')).toBe(
      '30m (3 ATM)',
    )
  })

  it('omits an empty Material do bisel from keaso-k002', () => {
    const specifications = readProduct('keaso-k002').specifications ?? []
    expect(
      specifications.some(
        (item) => item.label === 'Material do bisel' && item.value === '',
      ),
    ).toBe(false)
  })

  it('records keaso-k002 water resistance as 200m (20 ATM)', () => {
    expect(value(readProduct('keaso-k002'), 'Resistência à água')).toBe(
      '200m (20 ATM)',
    )
  })

  it('records skmei-2126 water resistance as 50m (5 ATM)', () => {
    expect(value(readProduct('skmei-2126'), 'Resistência à água')).toBe(
      '50m (5 ATM)',
    )
  })

  it('keeps natação in the skmei-2126 description', () => {
    expect(readProduct('skmei-2126').description).toContain('natação')
  })

  it('records seculus-kit-cantil water resistance as 50m (5 ATM)', () => {
    expect(value(readProduct('seculus-kit-cantil'), 'Resistência à água')).toBe(
      '50m (5 ATM)',
    )
  })

  it('omits Estado from seculus-kit-cantil product sheet; state lives on the listing', () => {
    const product = readProduct('seculus-kit-cantil') as CatalogProduct & {
      listings?: { state?: string }[]
    }
    expect(labels(product)).not.toContain('Estado')
    expect(product.listings?.[0]?.state).toBe('used')
  })

  it('records addiesdive-ad2554 water resistance as 100m (10 ATM)', () => {
    expect(value(readProduct('addiesdive-ad2554'), 'Resistência à água')).toBe(
      '100m (10 ATM)',
    )
  })

  it('omits Coroa and Tampa inferior from addiesdive-ad2554', () => {
    const productLabels = labels(readProduct('addiesdive-ad2554'))
    expect(productLabels).not.toContain('Coroa')
    expect(productLabels).not.toContain('Tampa inferior')
  })

  it('keeps the addiesdive-ad2554 movement caliber', () => {
    expect(value(readProduct('addiesdive-ad2554'), 'Tipo de movimento')).toBe(
      'Quartzo japonês',
    )
    expect(value(readProduct('addiesdive-ad2554'), 'Movimento')).toBe('Miyota 2035')
  })

  it('records addiesdive-my-h3-2qz water resistance as 200m (20 ATM)', () => {
    expect(
      value(readProduct('addiesdive-my-h3-2qz'), 'Resistência à água'),
    ).toBe('200m (20 ATM)')
  })

  it('keeps the specifications consolidated from the previous Addiesdive products', () => {
    const product = readProduct('addiesdive-my-h3-2qz')
    expect(value(product, 'Homage de')).toBe('Rolex Submariner Date')
    expect(value(product, 'Material do vidro')).toBe('Vidro mineral endurecido')
    expect(value(product, 'Largura da pulseira')).toBe('20 mm no encaixe da caixa')
  })

  it('records curren-8455 water resistance as 30m (3 ATM)', () => {
    expect(value(readProduct('curren-8455'), 'Resistência à água')).toBe(
      '30m (3 ATM)',
    )
  })

  it('gives every product a 90 dias Garantia except the Seculus kit', () => {
    const slugs = readdirSync(productsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    expect(slugs.length).toBeGreaterThan(0)
    for (const slug of slugs) {
      const garantia = value(readProduct(slug), 'Garantia')
      if (slug === 'seculus-kit-cantil') {
        expect(garantia, slug).toBe('1 ano e 6 meses.')
      } else {
        expect(garantia, slug).toBe('90 dias')
      }
    }
  })

  it('records curren-8498l-black water resistance as 30m (3 ATM)', () => {
    expect(value(readProduct('curren-8498l-black'), 'Resistência à água')).toBe(
      '30m (3 ATM)',
    )
  })

  it('keeps benyar-5229 Movimento as Sunon PE702', () => {
    expect(value(readProduct('benyar-5229'), 'Tipo de movimento')).toBe('Quartzo')
    expect(value(readProduct('benyar-5229'), 'Movimento')).toBe('Sunon PE702')
  })

})
