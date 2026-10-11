import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Gallery } from './gallery'

const photos = ['foto-1.webp', 'foto-2.webp']

function renderGallery(onClose = vi.fn()) {
  return render(
    <Gallery
      images={photos}
      alt="Relógio Seculus"
      index={0}
      onIndexChange={vi.fn()}
      onClose={onClose}
    />,
  )
}

afterEach(() => {
  cleanup()
})

describe('Gallery modal (GAL-03–GAL-07, GAL-10, GAL-12, GAL-13, GAL-15–GAL-18, GAL-23)', () => {
  it('opens a named modal, moves focus to it, and covers the page with the specified backdrop', () => {
    renderGallery()

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.tabIndex).toBe(-1)
    expect(document.activeElement).toBe(dialog)
    expect(dialog.className.split(/\s+/)).toContain('fixed')
    expect(dialog.className.split(/\s+/)).toContain('inset-0')
    expect(dialog.className.split(/\s+/)).toContain('z-30')
    expect(dialog.className.split(/\s+/)).toContain('bg-[rgb(0_0_0/80%)]')
    expect(dialog.style.backdropFilter).toBe('saturate(180%) blur(20px)')
  })

  it('closes when Fechar is activated', () => {
    const onClose = vi.fn()
    renderGallery(onClose)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a background click but keeps open when the photo is clicked', () => {
    const onClose = vi.fn()
    renderGallery(onClose)
    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })

    fireEvent.click(screen.getByRole('img', { name: 'Relógio Seculus' }))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', () => {
    const onClose = vi.fn()
    renderGallery(onClose)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses a 44px circular close button with a dark chip and responsive corners', () => {
    renderGallery()

    const close = screen.getByRole('button', { name: 'Fechar' })
    const classes = close.className.split(/\s+/)
    expect(classes).toContain('size-11')
    expect(classes).toContain('rounded-full')
    expect(classes).toContain('top-3')
    expect(classes).toContain('left-3')
    expect(classes).toContain('md:left-auto')
    expect(classes).toContain('md:right-3')
    expect(classes).toContain(
      'bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)]',
    )
    expect(classes).toContain('text-[var(--body-on-dark)]')
    expect(close.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('shows the current photo contained in a square frame', () => {
    renderGallery()

    const frame = screen.getByTestId('watch-gallery-frame')
    const photo = screen.getByRole('img', { name: 'Relógio Seculus' })
    expect(frame.className.split(/\s+/)).toContain('aspect-square')
    expect(photo.className.split(/\s+/)).toContain('object-contain')
    expect(photo.getAttribute('src')).toBe(photos[0])
  })

  it('locks page scrolling while open, removes overlay transitions, and leaves browser history unchanged', () => {
    const previousOverflow = document.body.style.overflow
    const previousLength = window.history.length
    const previousUrl = window.location.href
    const view = renderGallery()

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    expect(document.body.style.overflow).toBe('hidden')
    expect(dialog.style.transitionDuration).toBe('0ms')
    expect(window.history.length).toBe(previousLength)
    expect(window.location.href).toBe(previousUrl)

    view.unmount()

    expect(document.body.style.overflow).toBe(previousOverflow)
    expect(window.history.length).toBe(previousLength)
    expect(window.location.href).toBe(previousUrl)
  })
})
