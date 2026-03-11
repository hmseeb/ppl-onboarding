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
    <div className="py-8 space-y-6">
      <h1 className="text-2xl font-bold">Here&apos;s How This Works</h1>

      {/* Timeline */}
      <div className="relative space-y-4 pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

        {steps.map((step, index) => (
          <div key={index} className="relative flex items-start gap-4">
            {/* Number badge */}
            <div className="absolute -left-8 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 z-10">
              {index + 1}
            </div>
            <Card className="flex-1">
              <CardContent className="py-3 px-4">
                <p className="text-sm">{step}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Callout box */}
      <Card className="border-primary/30 bg-primary/5">
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
          className="flex-1 min-h-[44px] text-base font-semibold"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
