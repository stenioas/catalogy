import { z } from 'zod'
import { truncateReais } from '../money.ts'
import type { Listing, Variant } from '../schemas/product.ts'
import { effectiveAvailability } from './variant-condition.ts'

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const hexColorPattern = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

const DiscountAtLeastTriggerSchema = z.object({
  kind: z.literal('discount-at-least'),
  percent: z.number().gt(0).lte(100),
})

const CampaignLabelSchema = z.object({
  id: z.string().regex(idPattern),
  enabled: z.boolean(),
  type: z.literal('campaign'),
  text: z.string().min(1),
  shortText: z.string().min(1),
  icon: z.string().min(1),
  background: z.string().regex(hexColorPattern),
  color: z.string().regex(hexColorPattern),
  filterable: z.boolean(),
})

const OfferLabelSchema = z.object({
  id: z.string().regex(idPattern),
  enabled: z.boolean(),
  type: z.literal('offer'),
  category: z.string().min(1),
  description: z.string(),
  priority: z.number().int(),
  text: z.string().min(1),
  icon: z.string().min(1),
  background: z.string().regex(hexColorPattern),
  color: z.string().regex(hexColorPattern),
  filterable: z.boolean(),
  trigger: DiscountAtLeastTriggerSchema,
})

const LabelSchema = z.discriminatedUnion('type', [
  CampaignLabelSchema,
  OfferLabelSchema,
])

const LabelsArraySchema = z
  .array(LabelSchema)
  .superRefine((labels, context) => {
    const seenIds = new Set<string>()
    labels.forEach((label, index) => {
      if (seenIds.has(label.id)) {
        context.addIssue({
          code: 'custom',
          message: 'label id must be unique',
          path: [index, 'id'],
        })
      } else {
        seenIds.add(label.id)
      }
    })

    const enabledCampaignCount = labels.filter(
      (label) => label.type === 'campaign' && label.enabled,
    ).length
    if (enabledCampaignCount > 1) {
      context.addIssue({
        code: 'custom',
        message: 'at most one campaign may be enabled',
        path: [],
      })
    }

    const priorityByCategory = new Map<string, Set<number>>()
    labels.forEach((label, index) => {
      if (label.type !== 'offer') {
        return
      }
      let priorities = priorityByCategory.get(label.category)
      if (priorities === undefined) {
        priorities = new Set()
        priorityByCategory.set(label.category, priorities)
      }
      if (priorities.has(label.priority)) {
        context.addIssue({
          code: 'custom',
          message: 'offer priority must be unique within category',
          path: [index, 'priority'],
        })
      } else {
        priorities.add(label.priority)
      }
    })
  })

export type CampaignLabel = z.infer<typeof CampaignLabelSchema>
export type OfferLabel = z.infer<typeof OfferLabelSchema>
export type Label = z.infer<typeof LabelSchema>

export function parseLabels(input: unknown): Label[] {
  return LabelsArraySchema.parse(input)
}

export type ResolvedOffer = {
  id: string
  text: string
  icon: string
  background: string
  color: string
}

export type ResolvedCampaign = ResolvedOffer & { shortText: string }

export type ResolvedLabels = {
  campaign: ResolvedCampaign | null
  offers: ResolvedOffer[]
}

type ListingWithDisabled = Listing & { disabledLabels?: string[] }

function isLabelDisabled(
  labelId: string,
  listing: ListingWithDisabled,
  variant: Variant,
): boolean {
  return (
    (listing.disabledLabels?.includes(labelId) ?? false) ||
    (variant.disabledLabels?.includes(labelId) ?? false)
  )
}

function discountAtLeastFires(variant: Variant, percent: number): boolean {
  if (variant.price === undefined || variant.listPrice === undefined) {
    return false
  }
  const price = truncateReais(variant.price)
  const listPrice = truncateReais(variant.listPrice)
  return (listPrice - price) / listPrice >= percent / 100
}

function toResolvedOffer(label: CampaignLabel | OfferLabel): ResolvedOffer {
  return {
    id: label.id,
    text: label.text,
    icon: label.icon,
    background: label.background,
    color: label.color,
  }
}

export function resolveLabels(
  labels: Label[],
  listing: ListingWithDisabled,
  variant: Variant,
): ResolvedLabels {
  if (effectiveAvailability(variant) === 'on_order') {
    return { campaign: null, offers: [] }
  }

  const activeLabels = labels.filter(
    (label) => label.enabled && !isLabelDisabled(label.id, listing, variant),
  )

  let campaign: ResolvedCampaign | null = null
  for (const label of activeLabels) {
    if (label.type === 'campaign') {
      campaign = { ...toResolvedOffer(label), shortText: label.shortText }
      break
    }
  }

  const categoryOrder: string[] = []
  const seenCategories = new Set<string>()
  for (const label of labels) {
    if (label.type === 'offer' && !seenCategories.has(label.category)) {
      seenCategories.add(label.category)
      categoryOrder.push(label.category)
    }
  }

  const winnersByCategory = new Map<string, OfferLabel>()
  for (const label of activeLabels) {
    if (label.type !== 'offer') {
      continue
    }
    if (!discountAtLeastFires(variant, label.trigger.percent)) {
      continue
    }
    const current = winnersByCategory.get(label.category)
    if (current === undefined || label.priority < current.priority) {
      winnersByCategory.set(label.category, label)
    }
  }

  const offers: ResolvedOffer[] = []
  for (const category of categoryOrder) {
    const winner = winnersByCategory.get(category)
    if (winner !== undefined) {
      offers.push(toResolvedOffer(winner))
    }
  }

  return { campaign, offers }
}