import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function CompletePage({
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

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <h1 className="text-2xl font-bold">You&apos;re Already Onboarded</h1>
          <p className="text-muted-foreground">
            You&apos;ve already completed your onboarding. Your referrals are being delivered.
          </p>
          <a href="https://badaaas.com" className="block w-full">
            <Button className="w-full min-h-[44px]">Go to Dashboard</Button>
          </a>
          <p className="text-sm text-muted-foreground">
            Questions? Text Daniel at{' '}
            <a href="sms:+17024129233" className="text-primary underline">
              +1 (702) 412-9233
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
