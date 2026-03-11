import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServerClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('*')
    .eq('token', token)
    .single()

  if (!broker) {
    redirect('/error')
  }

  if (broker.status === 'completed') {
    redirect(`/onboard/${token}/complete`)
  }

  return <OnboardingStepper broker={broker} token={token} />
}
