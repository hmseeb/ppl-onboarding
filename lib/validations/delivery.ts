import { z } from 'zod'

export const deliveryMethodOptions = ['sms', 'email', 'crm_webhook'] as const
export type DeliveryMethod = (typeof deliveryMethodOptions)[number]

export const DeliveryPrefsSchema = z
  .object({
    delivery_methods: z.array(z.enum(deliveryMethodOptions)).min(1, 'Select at least one delivery method'),
    crm_webhook_url: z.url().optional().or(z.literal('')),
    contact_hours: z.enum(['business_hours', 'anytime', 'custom']),
    custom_hours_start: z.string().optional().or(z.literal('')),
    custom_hours_end: z.string().optional().or(z.literal('')),
    weekend_pause: z.boolean(),
    timezone: z.string().min(1, 'Select a timezone'),
    primary_vertical: z.string().optional().or(z.literal('')),
    secondary_vertical: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.contact_hours === 'custom') {
        return !!data.custom_hours_start && !!data.custom_hours_end
      }
      return true
    },
    { message: 'Pick a start and end time', path: ['custom_hours_start'] }
  )

export type DeliveryPrefs = z.infer<typeof DeliveryPrefsSchema>
