import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServiceClient()

  // Idempotent: only update if status is 'not_started'
  const { error } = await supabase
    .from('brokers')
    .update({ status: 'in_progress' })
    .eq('token', token)
    .eq('status', 'not_started')

  if (error) {
    console.error('[start] Error updating broker status:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
