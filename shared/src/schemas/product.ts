import { z } from 'zod'
import { truncateReais } from '../money'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const imageExtensionPattern = /\.(jpe?g|png|webp|avif)$/i

function preprocessReais(value: unknown): unknown {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return value
  }
  return truncateReais(value)
}

const positiveReais = z.preprocess(
  preprocessReais,
  z.number().positive(),
)

export const SPECIFICATION_LABELS = [
  'Marca',
  'Modelo',
  'Homage de',
  'Estado',
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

export const ProductSchema = z
  .object({
    slug: z.string().regex(slugPattern),
    title: z.string(),
    price: positiveReais,
    listPrice: positiveReais.optional(),
    images: z
      .array(z.string())
      .min(1)
      .refine(
        (names) => names.every(imageFileNameIsValid),
        'Each image file name must use an allowed extension and must not contain path separators',
      ),
    description: z.string().optional(),
    color: z.string().optional(),
    state: z.enum(['Novo', 'Usado', 'Openbox']),
    availabilityStatus: z.enum(['available', 'on_order', 'unavailable', 'sold_out']),
    enabled: z.boolean().optional(),
    specifications: z.array(SpecificationSchema).optional(),
    observations: z.string().optional(),
    unmissableOffer: z.boolean().optional(),
  })
  .superRefine((product, context) => {
    if (
      product.listPrice !== undefined &&
      product.listPrice <= product.price
    ) {
      context.addIssue({
        code: 'custom',
        message: 'listPrice must be greater than price after truncation',
        path: ['listPrice'],
      })
    }

    if (product.specifications === undefined) {
      return
    }

    const seenLabels = new Set<string>()
    for (let index = 0; index < product.specifications.length; index++) {
      const spec = product.specifications[index]
      if (!specificationValueHasText(spec.value)) {
        context.addIssue({
          code: 'custom',
          message: 'specification value must contain a non-space character',
          path: ['specifications', index, 'value'],
        })
      }
      if (seenLabels.has(spec.label)) {
        context.addIssue({
          code: 'custom',
          message: 'specification label must not repeat',
          path: ['specifications', index, 'label'],
        })
      } else {
        seenLabels.add(spec.label)
      }
    }
  })

export type Product = z.infer<typeof ProductSchema>
export type Specification = z.infer<typeof SpecificationSchema>

export function isProductListed(product: { enabled?: boolean }): boolean {
  return product.enabled !== false
}
