'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Step5BestPracticesProps {
  onNext: () => void
  onBack: () => void
}

const practices = [
  {
    title: 'Speed matters.',
    body: 'When a referral hits your phone, call within minutes — not hours. The faster you reach out, the more likely they remember submitting the request and the warmer the conversation starts.',
  },
  {
    title: 'Lead with what you know.',
    body: "Say something like: 'Hey [Name], I'm reaching out about your funding request — I see you're looking for [amount] for [purpose]. Let's talk about getting that done.' You already have the details. Use them.",
  },
  {
    title: 'Follow up at least 5 times.',
    body: "If they don't pick up, text immediately. Call again in a few hours. Then next morning. Then next afternoon. Then day 3. Most funded deals come from follow-up 2-4, not the first attempt.",
  },
  {
    title: "Don't pitch — match and move.",
    body: 'They already have a funding need. Your job is to confirm the details, match them to the right product, and get docs moving. Keep it tight and efficient.',
  },
  {
    title: 'Track your results.',
    body: 'Let us know which referrals funded so we can optimize your lead quality over time. The more feedback we get, the better your referrals become.',
  },
]

export function Step5BestPractices({ onNext, onBack }: Step5BestPracticesProps) {
  return (
    <div className="py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Brokers Who Close Follow These Rules</h1>

      <div className="space-y-3">
        {practices.map((practice, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="py-4 px-4">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/30 text-primary font-display text-xl shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-base font-bold">{practice.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{practice.body}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
          className="flex-1 min-h-[44px] text-base font-semibold glow-red"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
