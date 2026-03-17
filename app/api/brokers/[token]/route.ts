import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: broker, error } = await supabase
    .from('brokers')
    .select(
      'first_name, last_name, email, phone, company_name, state, primary_vertical, secondary_vertical, batch_size, deal_amount, status, current_step, step_data, delivery_methods, crm_webhook_url, contact_hours, custom_hours_start, custom_hours_end, weekend_pause, timezone, created_at, completed_at'
    )
    .eq('token', token)
    .single()

  if (error || !broker) {
    return Response.json({ error: 'Broker not found' }, { status: 404 })
  }

  return Response.json(broker)
}
