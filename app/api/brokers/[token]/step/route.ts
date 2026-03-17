import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { step, step_data } = await request.json()

  // Validate step is a number between 1 and 7
  if (typeof step !== 'number' || step < 1 || step > 7) {
    return Response.json(
      { success: false, error: 'Step must be a number between 1 and 7' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const updatePayload: Record<string, unknown> = { current_step: step }
  if (step_data && typeof step_data === 'object') {
    updatePayload.step_data = step_data
  }

  const { error } = await supabase
    .from('brokers')
    .update(updatePayload)
    .eq('token', token)

  if (error) {
    console.error('[step] Error updating current_step:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
