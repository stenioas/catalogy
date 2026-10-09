import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import type { Seller } from '@catalogo/shared'

import { loadSellers } from '../catalog/sellers'

export const SELLER_GATE_ERROR_MESSAGE =
  'Este link está incompleto ou o vendedor não existe.'

export function findSellerBySlug(
  sellers: Seller[],
  sellerQuery: string,
): Seller | null {
  return sellers.find((seller) => seller.slug === sellerQuery) ?? null
}

type SellerGateProps = {
  sellerQuery: string | null
  children: (seller: Seller) => ReactNode
}

type GateState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; seller: Seller }

export function SellerGate({ sellerQuery, children }: SellerGateProps) {
  const [state, setState] = useState<GateState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function resolveSeller() {
      if (sellerQuery === null || sellerQuery === '') {
        if (!cancelled) {
          setState({ status: 'error' })
        }
        return
      }

      try {
        const sellers = await loadSellers()
        const seller = findSellerBySlug(sellers, sellerQuery)
        if (!cancelled) {
          setState(
            seller ? { status: 'ready', seller } : { status: 'error' },
          )
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'error' })
        }
      }
    }

    setState({ status: 'loading' })
    void resolveSeller()

    return () => {
      cancelled = true
    }
  }, [sellerQuery])

  if (state.status === 'ready') {
    return <>{children(state.seller)}</>
  }

  if (state.status === 'error') {
    return (
      <div className="catalog-column py-8">
        <p className="m-0 text-[var(--ink-primary)]">{SELLER_GATE_ERROR_MESSAGE}</p>
      </div>
    )
  }

  return null
}
