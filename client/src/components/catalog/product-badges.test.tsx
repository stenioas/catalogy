import { AVAILABILITY_LABEL, STATE_LABEL, type Listing } from '@catalogo/shared'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  ProductAvailabilityBadge,
  ProductConditionLine,
  ProductStateBadge,
} from './product-badges'

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
