import { Broker } from '@/lib/types'

/**
 * Notify GHL (GoHighLevel) that a broker has completed onboarding.
 * Called via waitUntil() in the completion endpoint — never throws.
 */
export async function notifyGHL(broker: Broker): Promise<void> {
  const webhookUrl = process.env.GHL_COMPLETION_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[ghl] GHL_COMPLETION_WEBHOOK_URL not configured — skipping notification')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ghl_contact_id: broker.ghl_contact_id,
        onboarding_status: 'completed',
        delivery_preferences: {
          delivery_methods: broker.delivery_methods,
          crm_webhook_url: broker.crm_webhook_url,
          contact_hours: broker.contact_hours,
          custom_hours_start: broker.custom_hours_start,
          custom_hours_end: broker.custom_hours_end,
          weekend_pause: broker.weekend_pause,
        },
        updated_fields: {
          first_name: broker.first_name,
          last_name: broker.last_name,
          email: broker.email,
          phone: broker.phone,
          company_name: broker.company_name,
        },
      }),
    })

    if (!response.ok) {
      console.error(`[ghl] Webhook failed with status ${response.status}`)
    }
  } catch (error) {
    console.error('[ghl] Webhook error:', error)
  }
}
