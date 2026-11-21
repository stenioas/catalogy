import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { ListingSelector, ListingSelectorOption } from '@catalogo/shared'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { productThumbSrc } from './watch-card'

export type AxisSelectorsProps = {
  selectors: ListingSelector[]
  activeV: string | null
  activeState?: ListingSelectorOption['state']
  activeAvailability?: ListingSelectorOption['availability']
  onSelect: (
    v: string | null,
    condition?: Pick<ListingSelectorOption, 'state' | 'availability'>,
  ) => void
  slug?: string
  /** Rendered on the label row of the first axis, after the selected value. */
  labelEnd?: ReactNode
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

function activeConditionValue(
  group: ListingSelector,
  activeState: ListingSelectorOption['state'],
  activeAvailability: ListingSelectorOption['availability'],
): string | undefined {
  if (group.axisId === 'variant-state') return activeState
  if (group.axisId === 'variant-availability') return activeAvailability
  return undefined
}

export function advanceVariantScrollLeft(metrics: {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
  clickedOffsetLeft: number
  firstOffsetLeft: number
}): number | null {
  const target = metrics.clickedOffsetLeft - metrics.firstOffsetLeft
  const max = Math.max(0, metrics.scrollWidth - metrics.clientWidth)
  const clamped = Math.min(max, Math.max(0, target))
  if (clamped === metrics.scrollLeft) return null
  return clamped
}

function scrollImageRow(clicked: HTMLElement, behavior: ScrollBehavior) {
  const row = clicked.parentElement
  if (!(row instanceof HTMLElement)) return
  const first = row.firstElementChild
  if (!(first instanceof HTMLElement)) return
  const left = advanceVariantScrollLeft({
    scrollLeft: row.scrollLeft,
    scrollWidth: row.scrollWidth,
    clientWidth: row.clientWidth,
    clickedOffsetLeft: clicked.offsetLeft,
    firstOffsetLeft: first.offsetLeft,
  })
  if (left === null) return
  row.scrollTo({ left, behavior })
}

function alignPressedImageRows(root: HTMLElement, behavior: ScrollBehavior) {
  for (const row of root.querySelectorAll<HTMLElement>('[data-variant-row="image"]')) {
    const pressed = row.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (pressed) scrollImageRow(pressed, behavior)
  }
}

function imageButtonClass(option: ListingSelectorOption, pressed: boolean): string {
  const orderable = !option.disabled && !option.unavailable
  return cn(
    'size-16 shrink-0 cursor-pointer overflow-hidden rounded-md p-0',
    orderable
      ? pressed
        ? 'border-[3px] border-primary'
        : 'border-2 border-transparent'
      : cn(
          'border-dashed opacity-60',
          pressed ? 'border-[3px] border-primary' : 'border-2 border-muted-foreground',
        ),
  )
}

export function AxisSelectors({
  selectors,
  activeV,
  activeState,
  activeAvailability,
  onSelect,
  slug = '',
  labelEnd,
}: AxisSelectorsProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const initialAlign = useRef(true)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const behavior: ScrollBehavior = initialAlign.current ? 'auto' : 'smooth'
    initialAlign.current = false
    alignPressedImageRows(root, behavior)
  }, [activeV, activeState, activeAvailability])

  if (selectors.length === 0) return null

  const axisSelectors = selectors.filter(
    (group) => group.axisId !== 'variant-state' && group.axisId !== 'variant-availability',
  )
  const activeByAxis = activeValueIdsFromV(axisSelectors, activeV)

  return (
    <div ref={rootRef} data-testid="axis-selectors" className="flex w-full min-w-0 flex-col gap-3">
      {selectors.map((group, index) => {
        const image = group.presentation === 'image'
        const line = axisLine(group, activeByAxis)
        const activeValueId =
          activeConditionValue(group, activeState, activeAvailability) ?? activeByAxis[group.axisId]

        return (
          <div
            key={group.axisId}
            data-testid="axis-selector-group"
            data-axis-id={group.axisId}
            className="flex flex-col gap-1.5"
          >
            <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs font-medium text-muted-foreground">{line}</span>
              {index === 0 && labelEnd !== undefined ? labelEnd : null}
            </div>
            <div
              data-variant-row={image ? 'image' : undefined}
              className={image ? 'flex w-full gap-2 overflow-x-auto px-1.5 py-2' : 'flex flex-wrap gap-2 px-1.5 py-1'}
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
                            'cursor-pointer',
                            isUnavailable &&
                              cn(
                                'border-dashed opacity-60',
                                isPressed ? 'border-[3px] border-primary' : 'border-muted-foreground',
                              ),
                            !isUnavailable && isPressed && 'border-[3px] border-primary',
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
                          src={productThumbSrc(slug, option.imageFile)}
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
