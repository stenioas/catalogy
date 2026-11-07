import type { ListingSelector } from '@catalogo/shared'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type AxisSelectorsProps = {
  selectors: ListingSelector[]
  activeV: string | null
  onSelect: (v: string | null) => void
}

function activeValueIdsFromV(selectors: ListingSelector[], v: string | null): Record<string, string> {
  if (v === null || v.trim() === '') return {}
  const parts = v.split(',').map((part) => part.trim())
  const out: Record<string, string> = {}
  for (let i = 0; i < selectors.length && i < parts.length; i += 1) {
    const axisId = selectors[i]!.axisId
    const piece = parts[i]!
    if (piece !== '') out[axisId] = piece
  }
  return out
}

export function AxisSelectors({ selectors, activeV, onSelect }: AxisSelectorsProps) {
  if (selectors.length === 0) return null

  const activeByAxis = activeValueIdsFromV(selectors, activeV)

  return (
    <div data-testid="axis-selectors" className="flex w-full min-w-0 flex-col gap-3">
      {selectors.map((group) => (
        <div
          key={group.axisId}
          data-testid="axis-selector-group"
          data-axis-id={group.axisId}
          className="flex flex-col gap-1.5"
        >
          <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={group.label}>
            {group.options.map((option) => {
              const activeValueId = activeByAxis[group.axisId]
              const isPressed = activeValueId !== undefined && option.valueId === activeValueId
              const isUnavailable = option.unavailable && !option.disabled

              return (
                <Button
                  key={`${group.axisId}-${option.valueId}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={option.disabled}
                  aria-pressed={isPressed}
                  data-testid="axis-option"
                  data-axis-id={group.axisId}
                  data-value-id={option.valueId}
                  data-disabled={option.disabled ? 'true' : 'false'}
                  data-unavailable={isUnavailable ? 'true' : 'false'}
                  className={cn(
                    isUnavailable &&
                      cn(
                        'border-dashed opacity-60',
                        isPressed
                          ? 'border-primary ring-2 ring-primary ring-offset-1'
                          : 'border-muted-foreground',
                      ),
                    !isUnavailable &&
                      isPressed &&
                      'border-primary ring-2 ring-primary ring-offset-1',
                  )}
                  onClick={() => {
                    if (!option.disabled && option.v !== null) onSelect(option.v)
                  }}
                >
                  {option.value}
                </Button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
