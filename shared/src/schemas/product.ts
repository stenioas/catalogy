import { z } from 'zod'
import { truncateReais } from '../money.ts'

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const imageExtensionPattern = /\.(jpe?g|png|webp|avif)$/i

function preprocessReais(value: unknown): unknown {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return value
  }
  return truncateReais(value)
}

const positiveReais = z.preprocess(preprocessReais, z.number().positive())

export const SPECIFICATION_LABELS = [
  'Marca',
  'Modelo',
  'Homage de',
  'Tipo do relógio',
  'Funções',
  'Tipo de movimento',
  'Movimento',
  'Material da caixa',
  'Material da pulseira',
  'Material do vidro',
  'Material do bisel',
  'Resistência à água',
  'Largura da pulseira',
  'Tamanho da caixa',
  'Coroa',
  'Tampa inferior',
  'Diâmetro do mostrador',
  'Espessura da caixa',
  'Garantia',
] as const

function specificationValueHasText(value: string): boolean {
  return value.trim().length > 0
}

const SpecificationSchema = z.object({
  label: z.enum(SPECIFICATION_LABELS),
  value: z.string(),
})

function imageFileNameIsValid(name: string): boolean {
  if (name.includes('/') || name.includes('\\')) {
    return false
  }
  return imageExtensionPattern.test(name)
}

const hexColorPattern = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

const AxisValueSchema = z.object({
  id: z.string().regex(idPattern),
  value: z.string(),
  alias: z.string().optional(),
})

const OfferSchema = z.object({
  text: z.string().min(1),
  background: z.string().regex(hexColorPattern),
  color: z.string().regex(hexColorPattern),
  icon: z.string().min(1),
})

const AxisSchema = z.object({
  id: z.string().regex(idPattern),
  label: z.string(),
  values: z.array(AxisValueSchema),
  presentation: z.enum(['image', 'text']).optional(),
})

const VariantSchema = z
  .object({
    axes: z.array(
      z.object({
        axisId: z.string(),
        valueId: z.string(),
      }),
    ),
    price: positiveReais.optional(),
    listPrice: positiveReais.optional(),
    offers: z.array(OfferSchema).optional(),
    mainImage: z.string(),
    observations: z.string().optional(),
    orderable: z.boolean().optional(),
  })
  .strict()
  .superRefine((variant, context) => {
    if (variant.listPrice !== undefined &&
        (variant.price === undefined || variant.listPrice <= variant.price)) {
      context.addIssue({
        code: 'custom',
        message: 'listPrice requires price and must be greater than price after truncation',
        path: ['listPrice'],
      })
    }
  })

const ListingSchema = z.object({
  id: z.string().regex(idPattern),
  state: z.enum(['new', 'openbox', 'used', 'defective']),
  availabilityStatus: z.enum(['available', 'coming_soon', 'on_order']),
  enabled: z.boolean().optional(),
  images: z
    .array(z.string())
    .min(1)
    .refine(
      (names) => names.every(imageFileNameIsValid),
      'Each image file name must use an allowed extension and must not contain path separators',
    ),
  specifications: z.array(SpecificationSchema).optional(),
  variants: z.array(VariantSchema).min(1),
})

type Axis = z.infer<typeof AxisSchema>
export type Variant = z.infer<typeof VariantSchema>
export type Listing = z.infer<typeof ListingSchema>
type Specification = z.infer<typeof SpecificationSchema>

function addIssue(
  context: z.RefinementCtx,
  message: string,
  path: (string | number)[],
) {
  context.addIssue({ code: 'custom', message, path })
}

function checkSpecificationSheet(
  specifications: Specification[] | undefined,
  path: (string | number)[],
  context: z.RefinementCtx,
  blocked: ReadonlySet<string> | null,
): Set<string> {
  const seen = new Set<string>()
  if (specifications === undefined) {
    return seen
  }

  specifications.forEach((specification, index) => {
    if (!specificationValueHasText(specification.value)) {
      addIssue(context, 'specification value must contain a non-space character', [
        ...path,
        index,
        'value',
      ])
    }
    if (seen.has(specification.label) || blocked?.has(specification.label)) {
      addIssue(context, 'specification label must not repeat', [...path, index, 'label'])
    } else {
      seen.add(specification.label)
    }
  })

  return seen
}

function variantSelectionIsExact(
  axes: Axis[],
  variant: Variant,
  path: (string | number)[],
  context: z.RefinementCtx,
): boolean {
  const axesById = new Map(axes.map((axis) => [axis.id, axis]))
  const seen = new Set<string>()
  let valid = variant.axes.length === axes.length

  if (!valid) {
    addIssue(context, 'variant must select each declared axis exactly once', [...path, 'axes'])
  }

  variant.axes.forEach((selection, index) => {
    if (seen.has(selection.axisId)) {
      valid = false
      addIssue(context, 'variant must select each declared axis exactly once', [
        ...path,
        'axes',
        index,
        'axisId',
      ])
    }
    seen.add(selection.axisId)

    const axis = axesById.get(selection.axisId)
    if (axis === undefined || !axis.values.some((item) => item.id === selection.valueId)) {
      valid = false
      addIssue(context, 'variant references an axis value the product does not declare', [
        ...path,
        'axes',
        index,
        'valueId',
      ])
    }
  })

  if (valid) {
    for (const axis of axes) {
      if (!seen.has(axis.id)) {
        valid = false
        addIssue(context, 'variant must select each declared axis exactly once', [...path, 'axes'])
        break
      }
    }
  }

  return valid
}

export const ProductSchema = z
  .object({
    slug: z.string().regex(idPattern),
    title: z.string(),
    description: z.string().optional(),
    audience: z.enum(['male', 'female', 'unisex', 'child']).optional(),
    axes: z.array(AxisSchema),
    specifications: z.array(SpecificationSchema).optional(),
    listings: z.array(ListingSchema).min(1),
  })
  .superRefine((product, context) => {
    const productLabels = checkSpecificationSheet(
      product.specifications,
      ['specifications'],
      context,
      null,
    )

    const axisIds = new Set<string>()
    const axisLabels = new Set<string>()
    product.axes.forEach((axis, axisIndex) => {
      if (axisIds.has(axis.id)) {
        addIssue(context, 'axis id must be unique in the product', ['axes', axisIndex, 'id'])
      } else {
        axisIds.add(axis.id)
      }
      if (axisLabels.has(axis.label)) {
        addIssue(context, 'axis label must be unique in the product', ['axes', axisIndex, 'label'])
      } else {
        axisLabels.add(axis.label)
      }

      const valueIds = new Set<string>()
      axis.values.forEach((axisValue, valueIndex) => {
        if (valueIds.has(axisValue.id)) {
          addIssue(context, 'axis value id must be unique within the axis', [
            'axes',
            axisIndex,
            'values',
            valueIndex,
            'id',
          ])
        } else {
          valueIds.add(axisValue.id)
        }
      })
    })

    const listingIds = new Set<string>()
    product.listings.forEach((listing, listingIndex) => {
      if (listingIds.has(listing.id)) {
        addIssue(context, 'listing id must be unique in the product', [
          'listings',
          listingIndex,
          'id',
        ])
      } else {
        listingIds.add(listing.id)
      }

      if (listing.availabilityStatus === 'on_order' && listing.state !== 'new') {
        addIssue(context, 'on_order listings must use state new', [
          'listings',
          listingIndex,
          'state',
        ])
      }

      checkSpecificationSheet(
        listing.specifications,
        ['listings', listingIndex, 'specifications'],
        context,
        productLabels,
      )

      const combinations = new Set<string>()
      listing.variants.forEach((variant, variantIndex) => {
        const variantPath = ['listings', listingIndex, 'variants', variantIndex]
        if (listing.availabilityStatus !== 'on_order' && variant.price === undefined) {
          addIssue(context, 'price is required unless availabilityStatus is on_order', [
            ...variantPath,
            'price',
          ])
        }
        if (variant.orderable === false && listing.availabilityStatus !== 'on_order') {
          addIssue(context, 'orderable false is only valid when availabilityStatus is on_order', [
            ...variantPath,
            'orderable',
          ])
        }
        if (!listing.images.includes(variant.mainImage)) {
          addIssue(context, 'mainImage must be one of the listing images', [
            ...variantPath,
            'mainImage',
          ])
        }

        const selectionIsValid = variantSelectionIsExact(
          product.axes,
          variant,
          variantPath,
          context,
        )
        if (!selectionIsValid) {
          return
        }

        const key = product.axes
          .map((axis) => {
            const selected = variant.axes.find((item) => item.axisId === axis.id)
            return `${axis.id}:${selected?.valueId}`
          })
          .join('|')
        if (combinations.has(key)) {
          addIssue(context, 'listing repeats an axis-value combination', [...variantPath, 'axes'])
        } else {
          combinations.add(key)
        }
      })
    })
  })

export type Product = z.infer<typeof ProductSchema>
export type { Specification }

export function isProductListed(product: { enabled?: boolean }): boolean {
  return product.enabled !== false
}
