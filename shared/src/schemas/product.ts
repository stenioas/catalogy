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

const SpecificationSchema = z.object({
  label: z.string(),
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
    new: z.boolean().optional(),
    enabled: z.boolean().optional(),
    specifications: z.array(SpecificationSchema).optional(),
    observations: z.string().optional(),
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
  })

export type Product = z.infer<typeof ProductSchema>
export type Specification = z.infer<typeof SpecificationSchema>

export function isProductListed(product: { enabled?: boolean }): boolean {
  return product.enabled !== false
}
