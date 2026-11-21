import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

function pngSize(file: string): [number, number] {
  const data = readFileSync(file)
  return [data.readUInt32BE(16), data.readUInt32BE(20)]
}

describe('manifest do Achavio', () => {
  it('declara instalação standalone com os ícones da logo', () => {
    const manifest = JSON.parse(
      readFileSync(join(clientRoot, 'public/manifest.webmanifest'), 'utf8'),
    )
    expect(manifest).toEqual({
      name: 'Achavio',
      short_name: 'Achavio',
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#f5f5f7',
      theme_color: '#f5f5f7',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    })
    expect(pngSize(join(clientRoot, 'public/icons/icon-192.png'))).toEqual([192, 192])
    expect(pngSize(join(clientRoot, 'public/icons/icon-512.png'))).toEqual([512, 512])
    expect(pngSize(join(clientRoot, 'public/icons/apple-touch-icon.png'))).toEqual([
      180, 180,
    ])
  })

  it('aponta o documento para o manifest e para o ícone da logo', () => {
    const html = readFileSync(join(clientRoot, 'index.html'), 'utf8')
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain(
      '<link rel="icon" href="/icons/favicon.png" type="image/png" />',
    )
    expect(html).toContain(
      '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />',
    )
    expect(html).toContain('<meta name="theme-color" content="#f5f5f7" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
    expect(html).toContain('<meta name="mobile-web-app-capable" content="yes" />')
    expect(html).toContain(
      '<meta name="apple-mobile-web-app-title" content="Achavio" />',
    )
    expect(html).toContain(
      'name="viewport" content="width=device-width, initial-scale=1.0"',
    )
    expect(html).not.toContain('viewport-fit=cover')
    expect(html).not.toContain('favicon.svg')
  })

  it('responde o fetch pela rede e não abre Cache Storage', () => {
    const source = readFileSync(join(clientRoot, 'public/sw.js'), 'utf8')
    expect(source).toContain("addEventListener('fetch'")
    expect(source).toContain('event.respondWith(fetch(event.request))')
    expect(source).not.toContain('caches')
  })
})
