import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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
    <div className="onboarding-bg min-h-dvh text-foreground flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Glass card */}
        <div className="glass rounded-xl p-8 text-center space-y-6 animate-fadeSlideIn delay-1">
          {/* Green check icon with glow */}
          <div className="animate-fadeSlideIn delay-2">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 blur-xl opacity-40 bg-emerald-500 rounded-full scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/30 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="animate-fadeSlideIn delay-3 text-3xl font-bold tracking-tight font-heading">
            You&apos;re Already Onboarded
          </h1>

          {/* Description */}
          <p className="animate-fadeSlideIn delay-4 text-muted-foreground">
            You&apos;ve already completed your onboarding. Your referrals are being delivered.
          </p>

          {/* Dashboard button */}
          <div className="animate-fadeSlideIn delay-5">
            <a href="https://badaaas.com" className="block w-full">
              <Button className="w-full min-h-[44px] rounded-lg accent-glow glow-pulse">
                Go to Dashboard
              </Button>
            </a>
          </div>

          {/* Help text */}
          <p className="animate-fadeSlideIn delay-6 text-sm text-muted-foreground">
            Questions? Text Daniel at{' '}
            <a href="sms:+14049394848" className="text-primary underline hover:text-primary/80 transition-colors">
              (404) 939-4848
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
