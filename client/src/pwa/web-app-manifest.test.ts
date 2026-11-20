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
})
