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
    <div className="py-8 space-y-6">
      <h1 className="text-2xl font-bold">Our Guarantee</h1>

      <Card>
        <CardContent className="py-6 px-5 space-y-4">
          <p className="text-sm leading-relaxed">
            If you receive a referral with a disconnected number, fake information, or someone
            who clearly never requested funding — we replace it. No questions asked.
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
      <div className="flex items-center gap-3 min-h-[44px]">
        <Checkbox
          id="policy-accept"
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(checked === true)}
        />
        <Label htmlFor="policy-accept" className="text-sm cursor-pointer">
          I understand the referral replacement policy
        </Label>
      </div>

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
          disabled={!accepted}
          className="flex-1 min-h-[44px] text-base font-semibold"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
