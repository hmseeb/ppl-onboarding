'use client'

import { useState } from 'react'
import { Broker } from '@/lib/types'
import { formatPhone } from '@/lib/utils/normalize'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Step7ConfirmProps {
  broker: Broker
  formData: Record<string, unknown>
  onComplete: () => Promise<void>
  onBack: () => void
}

function getDeliveryDisplay(method: string | null | undefined): string {
  switch (method) {
    case 'sms':
      return 'texts'
    case 'email':
      return 'email'
    case 'crm_webhook':
      return 'CRM'
    default:
      return 'texts'
  }
}

function getDeliveryLabel(method: string | null | undefined): string {
  switch (method) {
    case 'sms':
      return 'SMS'
    case 'email':
      return 'Email'
    case 'crm_webhook':
      return 'CRM Webhook'
    default:
      return 'SMS'
  }
}

export function Step7Confirm({ broker, formData, onComplete, onBack }: Step7ConfirmProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const firstName = (formData.first_name as string) ?? broker.first_name
  const lastName = (formData.last_name as string) ?? broker.last_name
  const company = (formData.company_name as string) ?? broker.company_name
  const email = (formData.email as string) ?? broker.email
  const phone = (formData.phone as string) ?? broker.phone
  const deliveryMethod = (formData.delivery_method as string) ?? broker.delivery_method

  const handleClick = async () => {
    setIsSubmitting(true)
    await onComplete()
    window.location.href = 'https://badaaas.com'
  }

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-2xl font-bold">
        You&apos;re All Set, {firstName}. Go Fund Some Deals.
      </h1>

      {/* Summary Card */}
      <Card>
        <CardContent className="py-6 px-5 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{firstName} {lastName}</p>
          </div>
          {company && (
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{company}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{email}</p>
          </div>
          {phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{formatPhone(phone)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Vertical(s)</p>
            <div className="flex gap-2 mt-1">
              {broker.primary_vertical && (
                <Badge variant="secondary">{broker.primary_vertical}</Badge>
              )}
              {broker.secondary_vertical && (
                <Badge variant="secondary">{broker.secondary_vertical}</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground">Delivery Method</p>
            <p className="font-medium">{getDeliveryLabel(deliveryMethod)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Batch Size</p>
            <p className="font-medium">{broker.batch_size} referrals</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Your {broker.batch_size} referrals are on the way. Watch your{' '}
        {getDeliveryDisplay(deliveryMethod)} — and remember, speed to lead wins.
      </p>

      {/* Primary CTA */}
      <Button
        onClick={handleClick}
        disabled={isSubmitting}
        className="w-full min-h-[44px] text-base font-semibold"
      >
        {isSubmitting ? 'Completing...' : 'Go to Dashboard'}
      </Button>

      {/* Secondary link */}
      <p className="text-sm text-muted-foreground text-center">
        Questions? Text Daniel at{' '}
        <a href="sms:+17024129233" className="text-primary underline">
          +1 (702) 412-9233
        </a>
      </p>

      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full min-h-[44px] text-muted-foreground"
      >
        Back
      </Button>
    </div>
  )
}
