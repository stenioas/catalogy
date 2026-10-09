import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const phonePattern = /^\d{10,15}$/

export const SellerSchema = z.object({
  slug: z.string().regex(slugPattern),
  name: z.string(),
  phone: z.string().regex(phonePattern),
})

export type Seller = z.infer<typeof SellerSchema>
