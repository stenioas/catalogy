import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sharedDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(sharedDir, '../..')

describe('@catalogo/shared workspace', () => {
  it('names the shared package @catalogo/shared', () => {
    const pkg = JSON.parse(
      readFileSync(join(sharedDir, '../package.json'), 'utf-8'),
    ) as { name: string }
    expect(pkg.name).toBe('@catalogo/shared')
  })
})

describe('pnpm workspace root', () => {
  it('pins pnpm 12.3.4 and runs tests recursively', () => {
    const root = JSON.parse(
      readFileSync(join(repoRoot, 'package.json'), 'utf-8'),
    ) as { packageManager?: string; scripts?: { test?: string } }
    expect(root.packageManager).toBe('pnpm@12.3.4')
    expect(root.scripts?.test).toBe('pnpm -r test')
  })
})

describe('.gitignore', () => {
  it('ignores the generated product list module', () => {
    const gitignore = readFileSync(join(repoRoot, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('client/src/catalog/products.generated.ts')
  })
})
