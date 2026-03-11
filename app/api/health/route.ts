import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()
    // Lightweight query — just verifies DB is reachable and keeps Supabase active
    await supabase.from('brokers').select('id').limit(1)
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return Response.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
