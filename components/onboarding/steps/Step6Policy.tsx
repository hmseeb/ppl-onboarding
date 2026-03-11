'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Step6PolicyProps {
  onNext: () => void
  onBack: () => void
}

export function Step6Policy({ onNext, onBack }: Step6PolicyProps) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="py-10 space-y-6">
      <div className="space-y-2 animate-fadeSlideIn">
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-primary/70 font-semibold">Our commitment</p>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Our Guarantee</h1>
      </div>

      <Card className="glass border-t-2 border-t-primary shimmer-gold shadow-sm animate-fadeSlideIn delay-1">
        <CardContent className="py-6 px-5 space-y-4">
          <p className="text-sm leading-relaxed">
            If you receive a referral with a disconnected number, fake information, or someone
            who clearly never requested funding — we replace it. <span className="font-semibold text-foreground">No questions asked.</span>
          </p>
          <p className="text-sm leading-relaxed">
            Just flag it in your dashboard or text your rep.
          </p>
          <p className="text-sm leading-relaxed">
            We don&apos;t make money on bad leads. We make money when you close and keep coming
            back.
          </p>
        </CardContent>
      </Card>

      {/* Checkbox */}
      <div className="bg-secondary/60 rounded-xl p-4 flex items-center gap-3 min-h-[44px] animate-fadeSlideIn delay-2">
        <Checkbox
          id="policy-accept"
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(checked === true)}
        />
        <Label htmlFor="policy-accept" className="text-sm font-medium cursor-pointer">
          I understand the referral replacement policy
        </Label>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 animate-fadeSlideIn delay-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="flex-1 min-h-[44px] text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!accepted}
          className="flex-1 min-h-[44px] text-base font-semibold accent-glow"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
