'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Step3HowItWorksProps {
  onNext: () => void
  onBack: () => void
}

const steps = [
  'A business owner requests funding through our sites',
  'They go through a soft pull to verify their business and funding need',
  'Unqualified or fake requests get filtered out — you never see them',
  'Qualified referrals get sent to ONE broker — you',
  'You get their name, phone, email, funding amount, what it\'s for, and any notes from the qualification process',
]

export function Step3HowItWorks({ onNext, onBack }: Step3HowItWorksProps) {
  return (
    <div className="py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-primary/70 font-semibold">The process</p>
        <h1 className="text-3xl font-bold tracking-tight">Here&apos;s How This Works</h1>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4 pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-primary/20" />

        {steps.map((step, index) => (
          <div key={index} className="relative flex items-start gap-4">
            {/* Number badge */}
            <div className="absolute -left-8 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-display text-base font-bold shrink-0 z-10">
              {index + 1}
            </div>
            <Card className="flex-1 border-border shadow-sm">
              <CardContent className="py-3 px-4">
                <p className="text-sm">{step}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Callout box */}
      <Card className="border-primary/20 bg-primary/5 border-l-2 border-l-primary">
        <CardContent className="py-4 px-4">
          <p className="text-sm font-medium">
            Every referral is someone who actively requested funding. Your job is to reach
            them, build the relationship, and close the deal.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="flex-1 min-h-[44px]"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="flex-1 min-h-[44px] text-base font-semibold accent-glow"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
