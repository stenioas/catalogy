import { AVAILABILITY_LABEL, STATE_LABEL, type Listing } from '@catalogo/shared'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  CampaignBadge,
  CampaignStripe,
  OfferRow,
  ProductAvailabilityBadge,
  ProductConditionLine,
  ProductStateBadge,
} from './product-badges'

const sampleCampaign = {
  id: 'black-friday',
  text: 'Black Friday',
  shortText: 'BF',
  icon: 'Gift',
  background: '#000000',
  color: '#FFFFFF',
} as const

const sampleOffer = {
  text: 'Black Friday',
  background: '#000000',
  color: '#FFFFFF',
  icon: 'Gift',
} as const

describe('CampaignBadge (LBL-25)', () => {
  afterEach(() => {
    cleanup()
  })

  it('LBL-25: shows shortText with h-5 and text-xs', async () => {
    render(<CampaignBadge campaign={sampleCampaign} />)
    const badge = screen.getByTestId('campaign-badge')
    expect(badge.textContent).toContain('BF')
    expect(badge.textContent).not.toContain('Black Friday')
    expect(badge.className).toMatch(/\bh-5\b/)
    expect(badge.className).toMatch(/\btext-xs\b/)
    expect(badge.className).toMatch(/rounded-tr-\[4px\]!/)
    expect(badge.className).toMatch(/rounded-tl-none!/)
    expect(badge.className).toMatch(/rounded-bl-none!/)
    expect(badge.className).toMatch(/rounded-br-none!/)
  })

  it('LBL-25: applies campaign colors and loads the Lucide icon', async () => {
    render(<CampaignBadge campaign={sampleCampaign} />)
    const badge = screen.getByTestId('campaign-badge') as HTMLElement
    expect(badge.style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect(badge.style.color).toBe('rgb(255, 255, 255)')
    await waitFor(() => {
      expect(badge.querySelector('svg')).not.toBeNull()
    })
  })
})

describe('CampaignStripe (LBL-28, LBL-29, LBL-30)', () => {
  afterEach(() => {
    cleanup()
  })

  it('LBL-28: shows the campaign text on the stripe', async () => {
    render(<CampaignStripe campaign={sampleCampaign} />)
    const stripe = screen.getByTestId('campaign-stripe')
    expect(stripe.textContent).toContain('Black Friday')
    expect(stripe.textContent).not.toContain('BF')
  })

  it('LBL-29: uses h-5 and text-xs for viewports below 768px', () => {
    render(<CampaignStripe campaign={sampleCampaign} />)
    const stripe = screen.getByTestId('campaign-stripe')
    expect(stripe.className).toMatch(/\bh-5\b/)
    expect(stripe.className).toMatch(/\btext-xs\b/)
  })

  it('LBL-30: uses h-6 and text-sm from 768px', async () => {
    render(<CampaignStripe campaign={sampleCampaign} />)
    const stripe = screen.getByTestId('campaign-stripe')
    expect(stripe.className).toMatch(/\bmd:h-6\b/)
    expect(stripe.className).toMatch(/\bmd:text-sm\b/)
    await waitFor(() => {
      expect(stripe.querySelector('svg')).not.toBeNull()
    })
    const iconClass = stripe.querySelector('svg')?.getAttribute('class') ?? ''
    expect(iconClass).toMatch(/\bsize-3\b/)
    expect(iconClass).toMatch(/\bmd:size-3\.5\b/)
  })

  it('LBL-28: spans the viewport width', () => {
    render(<CampaignStripe campaign={sampleCampaign} />)
    const stripe = screen.getByTestId('campaign-stripe')
    expect(stripe.className).toMatch(/\bw-full\b/)
    expect(stripe.className).toMatch(/\brounded-none\b/)
    expect(stripe.className).not.toMatch(/rounded-\[4px\]/)
    expect(stripe.className).toMatch(/\bsticky\b/)
    expect(stripe.className).toMatch(/\btop-16\b/)
    expect(stripe.className).toContain('group-has-[header[inert]]/route:top-0')
  })
})

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
    const stateLabel = screen.getByTestId('state-label')
    const availability = screen.getByTestId('availability-badge')
    expect(stateLabel.textContent).toBe(STATE_LABEL[state])
    expect(stateLabel.className).toMatch(/\brounded-full\b/)
    expect(stateLabel.className).toMatch(/\bbg-orange-600\b/)
    expect(availability.textContent).toBe(AVAILABILITY_LABEL[availabilityStatus])
    expect(availability.className).toMatch(/\brounded-full\b/)
    expect(availability.className).toMatch(/\bbg-orange-600\b/)
    expect(stateLabel.querySelector('svg')?.classList.contains('lucide-recycle')).toBe(true)
    expect(availability.querySelector('svg')?.classList.contains('lucide-shopping-bag')).toBe(true)
    expect(screen.queryByText('Indisponível')).toBeNull()
    expect(screen.queryByText('Em estoque')).toBeNull()
  })
})
