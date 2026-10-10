import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { Badge } from './badge'
import { Button } from './button'
import { Card } from './card'
import { Table, TableBody, TableCell, TableRow } from './table'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function blockBody(css: string, selector: string): string {
  const pattern = new RegExp(`(?:^|\\n)\\s*${selector}\\s*\\{`)
  const start = css.search(pattern)
  if (start < 0) throw new Error(`missing ${selector}`)
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  throw new Error(`unclosed ${selector}`)
}

function decl(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`(?:^|[\\s;{])${name}\\s*:\\s*([^;}]+)`))
  return match?.[1]?.trim()
}

describe('shadcn primitives (SV-50)', () => {
  it('ships button, badge, card and table under components/ui', () => {
    expect(typeof Button).toBe('function')
    expect(typeof Badge).toBe('function')
    expect(typeof Card).toBe('function')
    expect(typeof Table).toBe('function')
    expect(typeof TableBody).toBe('function')
    expect(typeof TableRow).toBe('function')
    expect(typeof TableCell).toBe('function')
    for (const file of ['button.tsx', 'badge.tsx', 'card.tsx', 'table.tsx']) {
      expect(existsSync(join(clientRoot, 'src/components/ui', file))).toBe(true)
    }
  })

  it('keeps --primary at #0066cc and maps --card to canvas in light and surface-tile-2 in dark', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const root = blockBody(css, ':root')
    const dark = blockBody(css, '\\.dark')
    expect(decl(root, '--primary')).toBe('#0066cc')
    expect(decl(root, '--card')).toBe('var(--canvas)')
    expect(decl(dark, '--card')).toBe('var(--surface-tile-2)')
  })

  it('gives body width 100% and does not declare width 100vw (SV-50)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const body = blockBody(css, 'body')
    const widths = [...body.matchAll(/width:\s*([^;]+)/g)].map((match) => match[1].trim())
    expect(widths).toEqual(['100%'])
    expect(body).not.toMatch(/100vw/)
  })
})
