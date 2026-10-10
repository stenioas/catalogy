import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const clientSrc = dirname(fileURLToPath(import.meta.url))
const clientDir = join(clientSrc, '..')
const repoRoot = join(clientDir, '..')

type PackageJson = {
  name: string
  scripts?: { test?: string }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function readClientPackage(): PackageJson {
  return JSON.parse(
    readFileSync(join(clientDir, 'package.json'), 'utf-8'),
  ) as PackageJson
}

describe('pnpm workspace', () => {
  it('lists the client package beside shared', () => {
    const workspace = readFileSync(
      join(repoRoot, 'pnpm-workspace.yaml'),
      'utf-8',
    )
    expect(workspace).toMatch(/^\s*-\s*shared/m)
    expect(workspace).toMatch(/^\s*-\s*client/m)
  })
})

describe('client package (CAT-20 toolchain)', () => {
  it('names the package client and runs Vitest on test', () => {
    const pkg = readClientPackage()
    expect(pkg.name).toBe('client')
    expect(pkg.scripts?.test).toBe(
      'vitest run scripts/prebuild-catalog.test.ts && vitest run',
    )
  })

  it('links @catalogo/shared through the workspace protocol', () => {
    const pkg = readClientPackage()
    expect(pkg.dependencies?.['@catalogo/shared']).toBe('workspace:*')
  })

  it('declares Vite, React 19, React Router v7, Tailwind v4, shadcn, and Vitest', () => {
    const pkg = readClientPackage()
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(deps.vite).toBeDefined()
    expect(deps.react).toMatch(/^[\^~]?19\./)
    expect(deps['react-dom']).toMatch(/^[\^~]?19\./)
    expect(deps['react-router-dom']).toMatch(/^[\^~]?7\./)
    expect(deps.tailwindcss).toMatch(/^[\^~]?4\./)
    expect(deps['@tailwindcss/vite']).toBeDefined()
    expect(deps.shadcn).toBeDefined()
    expect(deps.vitest).toBeDefined()
  })
})

describe('@catalogo/shared resolution', () => {
  it('imports the shared barrel from the workspace without SellerSchema (SV-09)', async () => {
    const shared = await import('@catalogo/shared')
    expect(Object.hasOwn(shared, 'SellerSchema')).toBe(false)
    expect(shared.SellerSchema).toBeUndefined()
    expect(shared.ProductSchema).toBeDefined()
  })
})
