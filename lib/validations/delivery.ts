import { z } from 'zod'

export const DeliveryPrefsSchema = z.object({
  delivery_method: z.enum(['sms', 'email', 'crm_webhook']),
  delivery_email: z.string().email().optional().or(z.literal('')),
  delivery_phone: z.string().optional().or(z.literal('')),
  crm_webhook_url: z.string().url().optional().or(z.literal('')),
  contact_hours: z.enum(['business_hours', 'anytime', 'custom']),
  weekend_pause: z.boolean(),
})

export type DeliveryPrefs = z.infer<typeof DeliveryPrefsSchema>
