import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { waUrl, WantLink } from './want-link'

describe('WantLink (CAT-110–CAT-115)', () => {
  afterEach(() => {
    cleanup()
  })

  it('links to wa.me with the seller phone and URL-encoded watch title (CAT-110, CAT-111)', () => {
    render(<WantLink phone="5585997689165" title="Seculus" />)
    const link = screen.getByRole('link', { name: 'Eu quero!' })
    const message = encodeURIComponent('Olá, tenho interesse no Seculus.')
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/5585997689165?text=${message}`,
    )
  })

  it('opens in a new tab with noopener noreferrer (CAT-112, CAT-113, CAT-114)', () => {
    render(<WantLink phone="5585996043447" title="Addiesdive" />)
    const link = screen.getByRole('link', { name: 'Eu quero!' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('does not use the whatsapp:// scheme (CAT-115)', () => {
    expect(waUrl('5585992387201', 'CURREN')).not.toMatch(/^whatsapp:\/\//)
    render(<WantLink phone="5585992387201" title="CURREN" />)
    const href = screen.getByRole('link', { name: 'Eu quero!' }).getAttribute('href')
    expect(href).toMatch(/^https:\/\/wa\.me\//)
    expect(href).not.toMatch(/whatsapp:\/\//)
  })
})
