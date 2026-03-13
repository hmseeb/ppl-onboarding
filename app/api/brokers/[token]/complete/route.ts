import { waitUntil } from '@vercel/functions'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyGHL } from '@/lib/ghl'
import { Broker } from '@/lib/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { formData } = await request.json()

  const supabase = createServiceClient()

  const { data: broker, error } = await supabase
    .from('brokers')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.company_name,
      delivery_methods: formData.delivery_methods,
      delivery_email: formData.delivery_email,
      delivery_phone: formData.delivery_phone,
      crm_webhook_url: formData.crm_webhook_url,
      contact_hours: formData.contact_hours,
      custom_hours_start: formData.custom_hours_start || null,
      custom_hours_end: formData.custom_hours_end || null,
      weekend_pause: formData.weekend_pause,
      timezone: formData.timezone,
    })
    .eq('token', token)
    .select()
    .single()

  if (error || !broker) {
    console.error('[complete] Error completing broker:', error)
    return Response.json(
      { success: false, error: error?.message ?? 'Broker not found' },
      { status: 500 }
    )
  }

  // Fire GHL webhook in background (only if URL is configured)
  if (process.env.GHL_COMPLETION_WEBHOOK_URL) {
    waitUntil(notifyGHL(broker as Broker))
  }

  return Response.json({ success: true })
}
