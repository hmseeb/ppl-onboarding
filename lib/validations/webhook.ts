import { z } from 'zod'

/**
 * Zod schema for GHL "Deal Won" webhook payload validation.
 *
 * IMPORTANT: Field names must be verified against an actual GHL test trigger
 * before this schema is locked. See STATE.md blocker — field names listed here
 * are based on the project specification, not a verified GHL payload.
 */
export const GHLWebhookSchema = z.object({
  ghl_contact_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  primary_vertical: z.string().optional().nullable(),
  secondary_vertical: z.string().optional().nullable(),
  // z.coerce handles GHL sending numbers as strings
  batch_size: z.coerce.number().int().positive(),
  deal_amount: z.coerce.number().positive(),
})

export type GHLWebhookPayload = z.infer<typeof GHLWebhookSchema>
