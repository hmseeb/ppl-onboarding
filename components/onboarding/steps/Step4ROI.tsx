'use client'

import { Broker } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Step4ROIProps {
  broker: Broker
  onNext: () => void
  onBack: () => void
}

function calculateROI(dealAmount: number, batchSize: number) {
  if (!dealAmount || !batchSize || batchSize === 0) return null
  const pricePerReferral = dealAmount / batchSize
  const closedAt5Pct = Math.max(Math.floor(batchSize * 0.05), 1)
  const closedAt10Pct = Math.floor(batchSize * 0.10)
  const closedAt15Pct = Math.floor(batchSize * 0.15)
  return { pricePerReferral, closedAt5Pct, closedAt10Pct, closedAt15Pct }
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function Step4ROI({ broker, onNext, onBack }: Step4ROIProps) {
  const roi = calculateROI(broker.deal_amount, broker.batch_size)

  return (
    <div className="py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-primary/70 font-semibold">Your ROI</p>
        <h1 className="text-3xl font-bold tracking-tight">Let&apos;s Set You Up for Success</h1>
      </div>

      {/* Section: How Referrals Work */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold flex items-center">
          <span className="w-0.5 h-4 bg-primary rounded-full inline-block mr-2.5" />
          How Referrals Work
        </h2>
        <p className="text-sm text-muted-foreground">
          Every referral is a real business owner who submitted a funding request and went
          through a soft pull. They&apos;ve been verified as someone with a real business and a
          real funding need. Some will have spoken with our team, some won&apos;t have — but all
          of them requested capital.
        </p>
      </div>

      {/* Section: Your Close Rate */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold flex items-center">
          <span className="w-0.5 h-4 bg-primary rounded-full inline-block mr-2.5" />
          Your Close Rate
        </h2>
        <p className="text-sm text-muted-foreground">
          Brokers on our network close between 5% and 15% depending on skill, speed, and
          follow-up.{roi ? (<>
            {' '}That means if you buy {formatNumber(broker.batch_size)} referrals, you should expect
            to fund <span className="text-primary font-bold">{roi.closedAt5Pct}-{Math.max(roi.closedAt15Pct, 1)}</span> deals. At ${formatNumber(Math.round(roi.pricePerReferral))} per
            referral, that&apos;s a cost of ${formatNumber(Math.round(broker.deal_amount / Math.max(roi.closedAt15Pct, 1)))}-${formatNumber(Math.round(broker.deal_amount / roi.closedAt5Pct))} per
            funded deal — and if your average commission is <span className="font-display text-xl text-primary italic">$3,000-$5,000</span>+, the math works fast.
          </>) : null}
        </p>
      </div>

      {/* ROI Visual */}
      {roi ? (
        <Card className="border-primary/20 accent-glow shimmer-gold shadow-sm">
          <CardContent className="py-6 px-5 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-heading">Your Investment</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="font-display text-5xl text-primary italic">
                  {formatNumber(broker.batch_size)}
                </span>
                <span className="text-sm text-muted-foreground">referrals</span>
                <span className="text-lg text-muted-foreground">x</span>
                <span className="font-display text-5xl text-primary italic">
                  ${formatNumber(Math.round(roi.pricePerReferral))}
                </span>
                <span className="text-lg text-muted-foreground">=</span>
                <span className="font-display text-5xl text-primary italic">
                  ${formatNumber(broker.deal_amount)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                At 5% close rate = <span className="text-primary font-bold">{roi.closedAt5Pct}</span> funded deal{roi.closedAt5Pct !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Average commission = <span className="font-display text-xl text-primary italic">$3,000-$5,000</span>
              </p>
            </div>

            <Separator />

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">ROI on your first batch</p>
              <p className="font-display text-6xl text-primary italic">
                {((roi.closedAt5Pct * 3000) / broker.deal_amount).toFixed(1)}x -{' '}
                {((Math.max(roi.closedAt15Pct, 1) * 5000) / broker.deal_amount).toFixed(1)}x
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              Contact Daniel for your personalized ROI breakdown.
            </p>
            <a href="sms:+14049394848" className="text-primary underline text-sm">
              (404) 939-4848
            </a>
          </CardContent>
        </Card>
      )}

      {/* Section: Not Every Referral Will Pick Up */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold flex items-center">
          <span className="w-0.5 h-4 bg-primary rounded-full inline-block mr-2.5" />
          Not Every Referral Will Pick Up
        </h2>
        <p className="text-sm text-muted-foreground">
          These are business owners, not people sitting by the phone waiting for your call.
          Some will answer on the first dial. Some will take 3-5 follow-ups. Some won&apos;t
          convert at all. That&apos;s the game. The brokers who win on this network are the ones
          who work every single referral with a real follow-up sequence — not the ones who call
          once and move on.
        </p>
      </div>

      {/* Section: This Is a Numbers Game */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold flex items-center">
          <span className="w-0.5 h-4 bg-primary rounded-full inline-block mr-2.5" />
          This Is a Numbers Game
        </h2>
        <p className="text-sm text-muted-foreground">
          Don&apos;t judge the network off 2 or 3 referrals. Give it a real sample — work all{' '}
          <span className="font-display text-xl text-primary italic">{broker.batch_size}</span> properly, and then evaluate. Every experienced broker knows that
          closing is about volume and consistency.
        </p>
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
          className="flex-1 min-h-[44px] text-base font-semibold accent-glow"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
