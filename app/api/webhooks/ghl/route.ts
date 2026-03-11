import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { GHLWebhookSchema } from '@/lib/validations/webhook'
import { toTitleCase } from '@/lib/utils/normalize'

export async function POST(request: NextRequest) {
  // Read raw body first (preserves raw body for future HMAC verification)
  const raw = await request.text()
  let body: unknown

  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate with Zod (HOOK-02)
  const result = GHLWebhookSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const payload = result.data
  const supabase = createServiceClient()

  // Idempotent upsert using select-then-insert pattern (HOOK-05)
  // DO NOT use .upsert() with ignoreDuplicates: false — it overwrites the existing token
  const { data: existing } = await supabase
    .from('brokers')
    .select('token, first_name')
    .eq('ghl_contact_id', payload.ghl_contact_id)
    .single()

  if (existing) {
    // Duplicate webhook — return existing token URL without creating a second record
    const onboarding_url = `${process.env.NEXT_PUBLIC_BASE_URL}/onboard/${existing.token}`
    return Response.json({
      onboarding_url,
      broker_name: existing.first_name,
      status: 'exists',
    })
  }

  // New broker — insert fresh row with generated token
  const newToken = crypto.randomUUID()
  const { data: broker, error } = await supabase
    .from('brokers')
    .insert({
      token: newToken,
      ghl_contact_id: payload.ghl_contact_id,
      first_name: toTitleCase(payload.first_name),
      last_name: toTitleCase(payload.last_name),
      email: payload.email.toLowerCase(),
      phone: payload.phone ?? null,
      company_name: payload.company_name ?? null,
      state: payload.state ?? null,
      primary_vertical: payload.primary_vertical ?? null,
      secondary_vertical: payload.secondary_vertical ?? null,
      batch_size: payload.batch_size,
      deal_amount: payload.deal_amount,
      status: 'not_started',
    })
    .select('token, first_name')
    .single()

  if (error) {
    // Handle race condition: concurrent duplicate webhook
    // The DB UNIQUE constraint on ghl_contact_id prevents duplicates
    if (error.code === '23505') {
      // Unique violation — another request already inserted this broker
      const { data: raceExisting } = await supabase
        .from('brokers')
        .select('token, first_name')
        .eq('ghl_contact_id', payload.ghl_contact_id)
        .single()

      if (raceExisting) {
        const onboarding_url = `${process.env.NEXT_PUBLIC_BASE_URL}/onboard/${raceExisting.token}`
        return Response.json({
          onboarding_url,
          broker_name: raceExisting.first_name,
          status: 'exists',
        })
      }
    }

    console.error('Supabase insert error:', error)
    return Response.json({ error: 'Database error' }, { status: 500 })
  }

  // Return response (HOOK-04)
  const onboarding_url = `${process.env.NEXT_PUBLIC_BASE_URL}/onboard/${broker.token}`
  return Response.json({
    onboarding_url,
    broker_name: broker.first_name,
    status: 'created',
  })
}
