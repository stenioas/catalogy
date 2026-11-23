import { z } from 'zod'

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