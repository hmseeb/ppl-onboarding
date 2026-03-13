import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie, ADMIN_COOKIE_NAME } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company_name',
  'state',
  'primary_vertical',
  'secondary_vertical',
  'batch_size',
  'deal_amount',
  'delivery_methods',
  'delivery_email',
  'delivery_phone',
  'crm_webhook_url',
  'contact_hours',
  'custom_hours_start',
  'custom_hours_end',
  'weekend_pause',
  'timezone',
] as const

function verifyAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!sessionCookie || !verifySessionCookie(sessionCookie.value)) {
    return false
  }
  return true
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const supabase = createServiceClient()

  // Check broker exists first
  const { data: existing, error: findError } = await supabase
    .from('brokers')
    .select('id')
    .eq('id', id)
    .single()

  if (findError || !existing) {
    return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
  }

  const { error } = await supabase.from('brokers').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete broker:', error)
    return NextResponse.json({ error: 'Failed to delete broker' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Filter to only whitelisted fields
  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('brokers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update broker:', error)
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update broker' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
  }

  return NextResponse.json({ broker: data })
}
