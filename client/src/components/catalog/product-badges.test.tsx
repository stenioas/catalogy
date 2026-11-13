import { AVAILABILITY_LABEL, STATE_LABEL, type Listing } from '@catalogo/shared'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  OfferRow,
  ProductAvailabilityBadge,
  ProductConditionLine,
  ProductStateBadge,
} from './product-badges'

const sampleOffer = {
  text: 'Black Friday',
  background: '#000000',
  color: '#FFFFFF',
  icon: 'Gift',
} as const

describe('OfferRow (OSC-30, OSC-31, OSC-32)', () => {
  afterEach(() => {
    cleanup()
  })

  it('OSC-32: renders nothing when offers is an empty array', () => {
    const { container } = render(<OfferRow offers={[]} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId('offer-row')).toBeNull()
  })

  it('OSC-30: renders one badge per offer in array order, side by side with line wrap', () => {
    const offers = [
      { text: 'Primeira', background: '#111111', color: '#ffffff', icon: 'Gift' },
      { text: 'Segunda', background: '#222222', color: '#eeeeee', icon: 'Gift' },
    ]
    render(<OfferRow offers={offers} />)
    const row = screen.getByTestId('offer-row')
    expect(row.className).toMatch(/\bflex\b/)
    expect(row.className).toMatch(/\bflex-wrap\b/)
    const badges = screen.getAllByTestId('offer-badge')
    expect(badges).toHaveLength(2)
    expect(badges[0]?.textContent).toContain('Primeira')
    expect(badges[1]?.textContent).toContain('Segunda')
  })

  it('OSC-31: keeps offer text exactly as stored, without forcing uppercase', async () => {
    render(
      <OfferRow
        offers={[
          {
            text: 'miXed CaSe',
            background: '#0066cc',
            color: '#ffffff',
            icon: 'Gift',
          },
        ]}
      />,
    )
    await waitFor(() => {
      const badge = screen.getByTestId('offer-badge')
      expect(badge.textContent).toContain('miXed CaSe')
      expect(badge.className).not.toMatch(/\buppercase\b/)
    })
  })

  it('OSC-31: applies background and color from JSON as inline styles in both themes', () => {
    render(<OfferRow offers={[sampleOffer]} />)
    const badge = screen.getByTestId('offer-badge') as HTMLElement
    expect(badge.style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect(badge.style.color).toBe('rgb(255, 255, 255)')
  })

  it('OSC-31: loads the Lucide icon named in the offer JSON', async () => {
    render(<OfferRow offers={[sampleOffer]} />)
    await waitFor(() => {
      expect(screen.getByTestId('offer-badge').querySelector('svg')).not.toBeNull()
    })
  })

  it('keeps the loaded icon mounted when the offer row rerenders', async () => {
    const { rerender } = render(<OfferRow offers={[sampleOffer]} />)
    await waitFor(() => {
      expect(screen.getByTestId('offer-badge').querySelector('svg')).not.toBeNull()
    })
    const icon = screen.getByTestId('offer-badge').querySelector('svg')
    rerender(<OfferRow offers={[{ ...sampleOffer }]} />)
    expect(screen.getByTestId('offer-badge').querySelector('svg')).toBe(icon)
  })
})

describe('ProductAvailabilityBadge (VAR-38, listing availability tokens)', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(
    (['available', 'coming_soon', 'on_order'] as const).map((availabilityStatus) => [
      availabilityStatus,
      AVAILABILITY_LABEL[availabilityStatus],
    ] as const),
  )('renders %s as %s', (availabilityStatus, expectedLabel) => {
    render(<ProductAvailabilityBadge availabilityStatus={availabilityStatus} />)
    expect(screen.getByTestId('availability-badge').textContent).toBe(expectedLabel)
  })

  it('does not use legacy product availability copy for listing tokens', () => {
    render(<ProductAvailabilityBadge availabilityStatus="available" />)
    expect(screen.queryByText('Em estoque')).toBeNull()
    expect(screen.queryByText('Esgotado')).toBeNull()
  })
})

describe('ProductStateBadge (VAR-102, listing state tokens)', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(
    (['new', 'openbox', 'used', 'defective'] as const).map((state) => [
      state,
      STATE_LABEL[state],
    ] as const),
  )('renders %s as %s', (state, expectedLabel) => {
    render(<ProductStateBadge state={state} />)
    expect(screen.getByTestId('state-badge').textContent).toBe(expectedLabel)
  })
})

describe('ProductConditionLine', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows Portuguese state and availability from English tokens without legacy availability phrases', () => {
    const state: Listing['state'] = 'used'
    const availabilityStatus: Listing['availabilityStatus'] = 'on_order'
    render(<ProductConditionLine state={state} availabilityStatus={availabilityStatus} />)
    expect(screen.getByTestId('state-label').textContent).toBe(STATE_LABEL[state])
    expect(screen.getByTestId('availability-badge').textContent).toBe(
      AVAILABILITY_LABEL[availabilityStatus],
    )
    expect(screen.queryByText('Indisponível')).toBeNull()
    expect(screen.queryByText('Em estoque')).toBeNull()
  })
})
