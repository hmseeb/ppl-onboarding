'use client'

import { Broker } from '@/lib/types'
import { formatPhone } from '@/lib/utils/normalize'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Step7ConfirmProps {
  broker: Broker
  formData: Record<string, unknown>
}

const methodDisplayMap: Record<string, string> = {
  sms: 'texts',
  email: 'email',
  crm_webhook: 'CRM',
}

const methodLabelMap: Record<string, string> = {
  sms: 'SMS',
  email: 'Email',
  crm_webhook: 'CRM Webhook',
}

function getDeliveryDisplay(methods: string[] | string | null | undefined): string {
  const arr = normalizeMethodsArray(methods)
  if (arr.length === 0) return 'texts'
  return arr.map((m) => methodDisplayMap[m] ?? m).join(' + ')
}

function getDeliveryLabels(methods: string[] | string | null | undefined): string[] {
  const arr = normalizeMethodsArray(methods)
  if (arr.length === 0) return ['SMS']
  return arr.map((m) => methodLabelMap[m] ?? m)
}

function normalizeMethodsArray(methods: string[] | string | null | undefined): string[] {
  if (!methods) return []
  if (Array.isArray(methods)) return methods
  return [methods]
}

export function Step7Confirm({ broker, formData }: Step7ConfirmProps) {
  const firstName = (formData.first_name as string) ?? broker.first_name
  const lastName = (formData.last_name as string) ?? broker.last_name
  const company = (formData.company_name as string) ?? broker.company_name
  const email = (formData.email as string) ?? broker.email
  const phone = (formData.phone as string) ?? broker.phone
  const deliveryMethods = (formData.delivery_methods as string[]) ?? broker.delivery_methods

  return (
    <div className="py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        You&apos;re All Set, <span className="text-primary">{firstName}</span>. Go Fund Some Deals.
      </h1>

      {/* Summary Card */}
      <Card className="border-border/50">
        <CardContent className="py-6 px-5 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Name</p>
            <p className="text-base font-medium">{firstName} {lastName}</p>
          </div>
          {company && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Company</p>
              <p className="text-base font-medium">{company}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Email</p>
            <p className="text-base font-medium">{email}</p>
          </div>
          {phone && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Phone</p>
              <p className="text-base font-medium">{formatPhone(phone)}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Vertical(s)</p>
            <div className="flex gap-2 mt-1">
              {broker.primary_vertical && (
                <Badge variant="secondary">{broker.primary_vertical}</Badge>
              )}
              {broker.secondary_vertical && (
                <Badge variant="secondary">{broker.secondary_vertical}</Badge>
              )}
            </div>
          </div>

          <Separator className="my-1" />

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Delivery Methods</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {getDeliveryLabels(deliveryMethods).map((label) => (
                <Badge key={label} variant="secondary">{label}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Batch Size</p>
            <p className="font-medium">
              <span className="font-display text-2xl text-primary">{broker.batch_size}</span>{' '}
              referrals
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Your <span className="font-display text-2xl text-primary">{broker.batch_size}</span> referrals are on the way. Watch your{' '}
            <span className="font-bold text-foreground">{getDeliveryDisplay(deliveryMethods)}</span> — and remember, speed to lead wins.
          </p>
        </CardContent>
      </Card>

      {/* Dashboard link — no API call, just a redirect */}
      <a href="https://badaaas.com" className="block">
        <Button className="w-full min-h-[44px] text-lg font-bold glow-red-lg">
          Go to Dashboard
        </Button>
      </a>

      {/* Contact */}
      <p className="text-sm text-muted-foreground text-center">
        Questions? Text Daniel at{' '}
        <a href="sms:+14049394848" className="text-primary hover:text-primary/80 underline">
          (404) 939-4848
        </a>
      </p>
    </div>
  )
}
