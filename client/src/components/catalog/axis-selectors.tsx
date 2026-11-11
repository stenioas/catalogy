import type { ListingSelector, ListingSelectorOption } from '@catalogo/shared'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { productImageSrc } from './watch-card'

export type AxisSelectorsProps = {
  selectors: ListingSelector[]
  activeV: string | null
  onSelect: (v: string | null) => void
  slug?: string
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

function selectedOption(
  group: ListingSelector,
  activeByAxis: Record<string, string>,
): ListingSelectorOption | undefined {
  const activeValueId = activeByAxis[group.axisId]
  if (activeValueId === undefined) return undefined
  return group.options.find((option) => option.valueId === activeValueId)
}

function axisLine(group: ListingSelector, activeByAxis: Record<string, string>): string {
  const selected = selectedOption(group, activeByAxis)
  if (selected === undefined) return group.label
  return `${group.label}: ${selected.value}`
}

function imageButtonClass(option: ListingSelectorOption, pressed: boolean): string {
  const orderable = !option.disabled && !option.unavailable
  return cn(
    'size-16 shrink-0 overflow-hidden rounded-md border-2 p-0',
    orderable
      ? pressed
        ? 'border-primary ring-2 ring-primary ring-offset-1'
        : 'border-transparent opacity-100'
      : cn(
          'border-dashed opacity-60',
          pressed ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-muted-foreground',
        ),
  )
}

export function AxisSelectors({ selectors, activeV, onSelect, slug = '' }: AxisSelectorsProps) {
  if (selectors.length === 0) return null

  const activeByAxis = activeValueIdsFromV(selectors, activeV)

  return (
    <div data-testid="axis-selectors" className="flex w-full min-w-0 flex-col gap-3">
      {selectors.map((group) => {
        const image = group.presentation === 'image'
        const line = axisLine(group, activeByAxis)
        const activeValueId = activeByAxis[group.axisId]

        return (
          <div
            key={group.axisId}
            data-testid="axis-selector-group"
            data-axis-id={group.axisId}
            className="flex flex-col gap-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">{line}</span>
            <div
              className={image ? 'flex w-full gap-2 overflow-x-auto py-2' : 'flex flex-wrap gap-2'}
              role="group"
              aria-label={line}
            >
              {group.options.map((option) => {
                const isPressed = activeValueId !== undefined && option.valueId === activeValueId
                const controlDisabled = image ? option.disabled || option.unavailable : option.disabled
                const isUnavailable = option.unavailable && !controlDisabled

                return (
                  <Button
                    key={`${group.axisId}-${option.valueId}`}
                    type="button"
                    variant={image ? 'ghost' : 'outline'}
                    size={image ? 'icon' : 'sm'}
                    disabled={controlDisabled}
                    aria-pressed={isPressed}
                    data-testid="axis-option"
                    data-axis-id={group.axisId}
                    data-value-id={option.valueId}
                    data-disabled={controlDisabled ? 'true' : 'false'}
                    data-unavailable={isUnavailable ? 'true' : 'false'}
                    className={
                      image
                        ? imageButtonClass(option, isPressed)
                        : cn(
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
                          )
                    }
                    onClick={() => {
                      if (controlDisabled || option.v === null) return
                      onSelect(option.v)
                    }}
                  >
                    {image ? (
                      option.imageFile ? (
                        <img
                          src={productImageSrc(slug, option.imageFile)}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : null
                    ) : (
                      option.value
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
