import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="onboarding-bg min-h-dvh text-foreground flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Glass card */}
        <div className="glass rounded-xl p-8 text-center space-y-6 animate-fadeSlideIn delay-1">
          {/* Red X icon with glow */}
          <div className="animate-fadeSlideIn delay-2">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 blur-xl opacity-40 bg-destructive rounded-full scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 border-2 border-destructive/30 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="animate-fadeSlideIn delay-3 text-3xl font-bold tracking-tight font-heading">
            This Link Isn&apos;t Valid
          </h1>

          {/* Description */}
          <p className="animate-fadeSlideIn delay-4 text-muted-foreground">
            This link isn&apos;t valid. Text Daniel at{' '}
            <a href="sms:+14049394848" className="text-primary underline hover:text-primary/80 transition-colors">
              (404) 939-4848
            </a>{' '}
            if you need help.
          </p>

          {/* Button */}
          <div className="animate-fadeSlideIn delay-5">
            <a href="https://badaaas.com" className="block">
              <Button
                variant="secondary"
                className="w-full min-h-[44px] rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
              >
                Go to BadAAAS
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
