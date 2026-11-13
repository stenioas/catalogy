import { listingByPath, ProductSchema, type Listing, type Product } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AxisSelectors } from './axis-selectors'
import { productImageSrc } from './watch-card'

const img = 'watch.jpg'

function variant(price: number, extras: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    axes: [],
    mainImage: img,
    price,
    ...extras,
  }
}

function listingFixture(overrides: Record<string, unknown> = {}): Listing {
  return {
    id: 'item',
    state: 'new',
    availabilityStatus: 'on_order',
    images: [img, 'b.jpg'],
    variants: [
      variant(20, {
        mainImage: 'b.jpg',
        axes: [
          { axisId: 'color', valueId: 'preto' },
          { axisId: 'size', valueId: 'm' },
        ],
      }),
      variant(30, {
        orderable: false,
        mainImage: 'b.jpg',
        axes: [
          { axisId: 'color', valueId: 'azul' },
          { axisId: 'size', valueId: 'm' },
        ],
      }),
    ],
    ...overrides,
  } as Listing
}

function axisProduct(): Product {
  return {
    slug: 'axis-ui',
    title: 'Eixos',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        values: [
          { id: 'preto', value: 'Preto' },
          { id: 'azul', value: 'Azul' },
        ],
      },
      {
        id: 'size',
        label: 'Tamanho',
        values: [
          { id: 'p', value: 'P' },
          { id: 'm', value: 'M' },
        ],
      },
    ],
    listings: [listingFixture()],
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AxisSelectors (VAR-68, VAR-75, VAR-76)', () => {
  it('shows each option label as the axis value text (VAR-68)', () => {
    const product = axisProduct()
    const view = listingByPath([product], product.slug, 'item', 'preto,m')
    if (view.missing) throw new Error('expected open listing')

    render(
      <AxisSelectors selectors={view.selectors} activeV="preto,m" onSelect={() => {}} />,
    )

    const root = screen.getByTestId('axis-selectors')
    const groups = within(root).getAllByTestId('axis-selector-group')
    const color = groups.find((node) => node.getAttribute('data-axis-id') === 'color')
    expect(color).toBeDefined()
    expect(within(color!).getByRole('button', { name: 'Preto' })).toBeTruthy()
    expect(within(color!).getByRole('button', { name: 'Azul' })).toBeTruthy()

    const sizeGroup = groups.find((node) => node.getAttribute('data-axis-id') === 'size')
    expect(sizeGroup).toBeDefined()
    expect(within(sizeGroup!).getByRole('button', { name: 'P' })).toBeTruthy()
    expect(within(sizeGroup!).getByRole('button', { name: 'M' })).toBeTruthy()
  })

  it('keeps an impossible combination visible and disabled (VAR-75)', () => {
    const product = axisProduct()
    const view = listingByPath([product], product.slug, 'item', 'preto,m')
    if (view.missing) throw new Error('expected open listing')

    render(
      <AxisSelectors selectors={view.selectors} activeV="preto,m" onSelect={() => {}} />,
    )

    const p = screen.getByRole('button', { name: 'P' })
    expect(p.hasAttribute('disabled')).toBe(true)
    expect(p.getAttribute('data-disabled')).toBe('true')
  })

  it('keeps an unavailable combination clickable, dimmed, with dashed border (VAR-76)', () => {
    const product = axisProduct()
    const view = listingByPath([product], product.slug, 'item', 'preto,m')
    if (view.missing) throw new Error('expected open listing')

    const onSelect = vi.fn()
    render(<AxisSelectors selectors={view.selectors} activeV="preto,m" onSelect={onSelect} />)

    const azul = screen.getByRole('button', { name: 'Azul' })
    expect(azul.hasAttribute('disabled')).toBe(false)
    expect(azul.getAttribute('data-unavailable')).toBe('true')
    expect(azul.className).toMatch(/border-dashed/)
    expect(azul.className).toMatch(/opacity-60/)

    fireEvent.click(azul)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('azul,m')
  })
})

function openSelectors(product: Product, v: string) {
  const view = listingByPath([product], product.slug, 'item', v)
  if (view.missing) throw new Error('expected open listing')
  return view.selectors
}

function imageAndTextProduct(): Product {
  return ProductSchema.parse({
    slug: 'eixos-ui',
    title: 'Eixos',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        presentation: 'image',
        values: [
          { id: 'preto', value: 'Preto', alias: 'Apelido Preto' },
          { id: 'branco', value: 'Branco', alias: 'Apelido Branco' },
          { id: 'azul', value: 'Azul', alias: 'Apelido Azul' },
          { id: 'verde', value: 'Verde', alias: 'Apelido Verde' },
        ],
      },
      {
        id: 'size',
        label: 'Tamanho',
        presentation: 'text',
        values: [
          { id: 'p', value: 'P', alias: 'Pequeno' },
          { id: 'm', value: 'M', alias: 'Médio' },
        ],
      },
    ],
    listings: [
      {
        id: 'item',
        state: 'new',
        availabilityStatus: 'on_order',
        images: ['branco.jpg', 'primeiro.jpg', 'fora.jpg', 'azul.jpg'],
        variants: [
          {
            axes: [
              { axisId: 'color', valueId: 'branco' },
              { axisId: 'size', valueId: 'm' },
            ],
            price: 20,
            mainImage: 'branco.jpg',
          },
          {
            axes: [
              { axisId: 'color', valueId: 'preto' },
              { axisId: 'size', valueId: 'p' },
            ],
            price: 10,
            mainImage: 'primeiro.jpg',
          },
          {
            axes: [
              { axisId: 'color', valueId: 'preto' },
              { axisId: 'size', valueId: 'm' },
            ],
            price: 30,
            orderable: false,
            mainImage: 'fora.jpg',
          },
          {
            axes: [
              { axisId: 'color', valueId: 'azul' },
              { axisId: 'size', valueId: 'm' },
            ],
            price: 40,
            orderable: false,
            mainImage: 'azul.jpg',
          },
        ],
      },
    ],
  })
}

function singleImageProduct(): Product {
  return ProductSchema.parse({
    slug: 'eixo-unico',
    title: 'Único',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        presentation: 'image',
        values: [{ id: 'preto', value: 'Preto', alias: 'Noite' }],
      },
    ],
    listings: [
      {
        id: 'item',
        state: 'new',
        availabilityStatus: 'available',
        images: ['so.jpg'],
        variants: [
          {
            axes: [{ axisId: 'color', valueId: 'preto' }],
            price: 10,
            mainImage: 'so.jpg',
          },
        ],
      },
    ],
  })
}

function groupByAxis(axisId: string) {
  const groups = screen.getAllByTestId('axis-selector-group')
  const group = groups.find((node) => node.getAttribute('data-axis-id') === axisId)
  expect(group).toBeDefined()
  return group!
}

describe('AxisSelectors image and text (OSC-41, OSC-42, OSC-43, OSC-44, OSC-45)', () => {
  it('shows label and selected value, with the control below that line (OSC-41)', () => {
    const product = imageAndTextProduct()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto,m')}
        activeV="preto,m"
        onSelect={() => {}}
      />,
    )

    for (const [axisId, line, alias] of [
      ['color', 'Cor: Preto', 'Apelido Preto'],
      ['size', 'Tamanho: M', 'Médio'],
    ] as const) {
      const group = groupByAxis(axisId)
      const label = within(group).getByText(line)
      const control = label.nextElementSibling
      expect(group.className).toMatch(/flex-col/)
      expect(control).not.toBeNull()
      expect(label.compareDocumentPosition(control!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(group.textContent).not.toContain(alias)
    }
  })

  it('keeps a single image value visible as a 64px thumbnail (OSC-42, OSC-43)', () => {
    const product = singleImageProduct()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto')}
        activeV="preto"
        onSelect={() => {}}
      />,
    )

    const group = groupByAxis('color')
    expect(within(group).getByText('Cor: Preto')).toBeTruthy()
    expect(group.textContent).not.toContain('Noite')
    const control = within(group).getByRole('group')
    expect(control.className).toMatch(/overflow-x-auto/)
    const thumb = within(control).getByRole('button')
    expect(thumb.className).toMatch(/size-16/)
    expect(thumb.querySelector('img')?.getAttribute('src')).toBe(productImageSrc(product.slug, 'so.jpg'))
  })

  it('scrolls 64px thumbnails from the first queued photo and rings the selected one (OSC-43)', () => {
    const product = imageAndTextProduct()
    const onSelect = vi.fn()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto,m')}
        activeV="preto,m"
        onSelect={onSelect}
      />,
    )

    const control = within(groupByAxis('color')).getByRole('group')
    expect(control.className).toMatch(/overflow-x-auto/)
    expect(control.className).toMatch(/px-1\.5/)
    expect(control.className).not.toMatch(/flex-wrap/)
    const thumbs = within(control).getAllByRole('button')
    expect(thumbs).toHaveLength(4)
    expect(thumbs.map((thumb) => thumb.className).every((className) => /size-16/.test(className))).toBe(true)

    const srcs = thumbs.map((thumb) => thumb.querySelector('img')?.getAttribute('src') ?? null)
    expect(srcs).toEqual([
      productImageSrc(product.slug, 'primeiro.jpg'),
      productImageSrc(product.slug, 'branco.jpg'),
      productImageSrc(product.slug, 'azul.jpg'),
      null,
    ])

    const selected = thumbs[0]!
    expect(selected.getAttribute('aria-pressed')).toBe('true')
    expect(selected.className).toMatch(/border-2/)
    expect(selected.className).toMatch(/border-primary/)
    expect(selected.className).toMatch(/ring-2/)
    expect(selected.className).toMatch(/ring-primary/)
    expect(selected.className).toMatch(/ring-offset-1/)

    fireEvent.click(thumbs[1]!)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('branco,m')
  })

  it('keeps an impossible or unavailable image option visible and disabled (OSC-44)', () => {
    const product = imageAndTextProduct()
    const onSelect = vi.fn()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto,m')}
        activeV="preto,m"
        onSelect={onSelect}
      />,
    )

    const thumbs = within(within(groupByAxis('color')).getByRole('group')).getAllByRole('button')
    const unavailable = thumbs[2]!
    const impossible = thumbs[3]!

    expect(unavailable.querySelector('img')?.getAttribute('src')).toBe(productImageSrc(product.slug, 'azul.jpg'))
    expect(unavailable.hasAttribute('disabled')).toBe(true)
    expect(unavailable.className).toMatch(/size-16/)
    expect(unavailable.className).toMatch(/border-dashed/)
    expect(unavailable.className).toMatch(/opacity-60/)

    expect(impossible.querySelector('img')).toBeNull()
    expect(impossible.hasAttribute('disabled')).toBe(true)
    expect(impossible.className).toMatch(/size-16/)

    fireEvent.click(unavailable)
    fireEvent.click(impossible)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('wraps text values and does not scroll that axis (OSC-45)', () => {
    const product = imageAndTextProduct()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto,m')}
        activeV="preto,m"
        onSelect={() => {}}
      />,
    )

    const control = within(groupByAxis('size')).getByRole('group')
    expect(control.className).toMatch(/flex-wrap/)
    expect(control.className).toMatch(/px-1\.5/)
    expect(control.className).not.toMatch(/overflow-x/)
    expect(within(control).getByRole('button', { name: 'P' })).toBeTruthy()
    expect(within(control).getByRole('button', { name: 'M' })).toBeTruthy()
    expect(control.textContent).not.toContain('Pequeno')
    expect(control.textContent).not.toContain('Médio')
  })
})

function stubImageRow(
  row: HTMLElement,
  buttons: HTMLElement[],
  offsets: number[],
  layout: { scrollLeft: number; scrollWidth: number; clientWidth: number },
) {
  Object.defineProperty(row, 'scrollLeft', { configurable: true, value: layout.scrollLeft })
  Object.defineProperty(row, 'scrollWidth', { configurable: true, value: layout.scrollWidth })
  Object.defineProperty(row, 'clientWidth', { configurable: true, value: layout.clientWidth })
  const scrollTo = vi.fn()
  row.scrollTo = scrollTo
  buttons.forEach((button, index) => {
    Object.defineProperty(button, 'offsetLeft', { configurable: true, value: offsets[index] })
  })
  return scrollTo
}

describe('AxisSelectors image row advances to the next variant', () => {
  function renderImageRow() {
    const product = imageAndTextProduct()
    const onSelect = vi.fn()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto,m')}
        activeV="preto,m"
        onSelect={onSelect}
      />,
    )
    const row = within(groupByAxis('color')).getByRole('group')
    const buttons = within(row).getAllByRole('button')
    return { onSelect, row, buttons }
  }

  it('scrolls by the distance to the next thumbnail when one sits to the right', () => {
    const { onSelect, row, buttons } = renderImageRow()
    const scrollTo = stubImageRow(row, buttons, [8, 80, 152, 224], {
      scrollLeft: 10,
      scrollWidth: 1000,
      clientWidth: 300,
    })

    fireEvent.click(buttons[1]!)

    expect(scrollTo).toHaveBeenCalledOnce()
    expect(scrollTo).toHaveBeenCalledWith({ left: 82, behavior: 'smooth' })
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('branco,m')
  })

  it('does not scroll when the clicked thumbnail is the last one', () => {
    const onSelect = vi.fn()
    render(
      <AxisSelectors
        slug="fila"
        activeV="a"
        onSelect={onSelect}
        selectors={[
          {
            axisId: 'color',
            label: 'Cor',
            presentation: 'image',
            options: [
              { valueId: 'a', value: 'A', disabled: false, unavailable: false, v: 'a', imageFile: 'a.jpg' },
              { valueId: 'b', value: 'B', disabled: false, unavailable: false, v: 'b', imageFile: 'b.jpg' },
            ],
          },
        ]}
      />,
    )
    const row = within(groupByAxis('color')).getByRole('group')
    const buttons = within(row).getAllByRole('button')
    const scrollTo = stubImageRow(row, buttons, [0, 72], {
      scrollLeft: 40,
      scrollWidth: 1000,
      clientWidth: 300,
    })

    fireEvent.click(buttons[1]!)

    expect(scrollTo).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('clamps the scroll to the end of the row and still selects', () => {
    const { onSelect, row, buttons } = renderImageRow()
    const scrollTo = stubImageRow(row, buttons, [0, 144, 216, 288], {
      scrollLeft: 180,
      scrollWidth: 400,
      clientWidth: 200,
    })

    fireEvent.click(buttons[1]!)

    expect(scrollTo).toHaveBeenCalledOnce()
    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' })
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('branco,m')
  })

  it('does not scroll a wrapping text axis', () => {
    const product = imageAndTextProduct()
    const onSelect = vi.fn()
    render(
      <AxisSelectors
        slug={product.slug}
        selectors={openSelectors(product, 'preto,m')}
        activeV="preto,m"
        onSelect={onSelect}
      />,
    )
    const row = within(groupByAxis('size')).getByRole('group')
    const buttons = within(row).getAllByRole('button')
    const scrollTo = stubImageRow(row, buttons, [0, 80], {
      scrollLeft: 0,
      scrollWidth: 400,
      clientWidth: 120,
    })

    fireEvent.click(buttons[0]!)

    expect(scrollTo).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
