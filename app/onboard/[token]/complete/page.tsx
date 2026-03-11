import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'

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
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_center,_#131316_0%,_#09090B_70%)] text-foreground flex items-center justify-center px-4">
      <Card className="max-w-lg w-full border-border/50 bg-card/80">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div>
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">You&apos;re Already Onboarded</h1>
          </div>
          <p className="text-muted-foreground">
            You&apos;ve already completed your onboarding. Your referrals are being delivered.
          </p>
          <a href="https://badaaas.com" className="block w-full">
            <Button className="w-full min-h-[44px] glow-red">Go to Dashboard</Button>
          </a>
          <p className="text-sm text-muted-foreground">
            Questions? Text Daniel at{' '}
            <a href="sms:+14049394848" className="text-primary underline">
              (404) 939-4848
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
