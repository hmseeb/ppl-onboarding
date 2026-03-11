'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeliveryPrefsSchema, type DeliveryPrefs } from '@/lib/validations/delivery'
import { Broker } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Step2DeliveryProps {
  broker: Broker
  onNext: (data: Record<string, unknown>) => void
  onBack: () => void
}

const deliveryMethods = [
  { value: 'sms' as const, label: 'SMS' },
  { value: 'email' as const, label: 'Email' },
  { value: 'crm_webhook' as const, label: 'CRM Webhook' },
]

const contactHoursOptions = [
  { value: 'business_hours' as const, label: 'Business hours only' },
  { value: 'anytime' as const, label: 'Anytime' },
  { value: 'custom' as const, label: 'Custom time window' },
]

export function Step2Delivery({ broker, onNext, onBack }: Step2DeliveryProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeliveryPrefs>({
    resolver: zodResolver(DeliveryPrefsSchema),
    defaultValues: {
      delivery_method: (broker.delivery_method as DeliveryPrefs['delivery_method']) ?? 'sms',
      delivery_email: broker.delivery_email ?? broker.email ?? '',
      delivery_phone: broker.delivery_phone ?? broker.phone ?? '',
      crm_webhook_url: broker.crm_webhook_url ?? '',
      contact_hours: (broker.contact_hours as DeliveryPrefs['contact_hours']) ?? 'business_hours',
      weekend_pause: broker.weekend_pause ?? false,
    },
  })

  const selectedMethod = watch('delivery_method')
  const weekendPause = watch('weekend_pause')

  const onSubmit = (data: DeliveryPrefs) => {
    onNext(data as unknown as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          How do you want to receive referrals, {broker.first_name}?
        </h1>
      </div>

      {/* Delivery Method - Radio Buttons */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-3">
          <Label className="text-sm font-heading uppercase tracking-wider">Delivery Method</Label>
          <div className="space-y-2">
            {deliveryMethods.map((method) => (
              <label
                key={method.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                  selectedMethod === method.value
                    ? 'border-primary bg-primary/10 glow-red-sm'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <input
                  type="radio"
                  value={method.value}
                  checked={selectedMethod === method.value}
                  onChange={() => setValue('delivery_method', method.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.value
                      ? 'border-primary'
                      : 'border-muted-foreground/50'
                  }`}
                >
                  {selectedMethod === method.value && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="font-medium">{method.label}</span>
              </label>
            ))}
          </div>

          {/* Conditional fields based on selected delivery method */}
          {selectedMethod === 'sms' && (
            <div className="space-y-1 pt-2">
              <Label htmlFor="delivery_phone">Phone Number</Label>
              <Input
                id="delivery_phone"
                type="tel"
                {...register('delivery_phone')}
                className="min-h-[44px]"
                placeholder="(555) 555-5555"
              />
              {errors.delivery_phone && (
                <p className="text-xs text-destructive">{errors.delivery_phone.message}</p>
              )}
            </div>
          )}

          {selectedMethod === 'email' && (
            <div className="space-y-1 pt-2">
              <Label htmlFor="delivery_email">Email Address</Label>
              <Input
                id="delivery_email"
                type="email"
                {...register('delivery_email')}
                className="min-h-[44px]"
                placeholder="you@company.com"
              />
              {errors.delivery_email && (
                <p className="text-xs text-destructive">{errors.delivery_email.message}</p>
              )}
            </div>
          )}

          {selectedMethod === 'crm_webhook' && (
            <div className="space-y-1 pt-2">
              <Label htmlFor="crm_webhook_url">Webhook URL</Label>
              <Input
                id="crm_webhook_url"
                type="url"
                {...register('crm_webhook_url')}
                className="min-h-[44px]"
                placeholder="https://your-crm.com/webhook"
              />
              {errors.crm_webhook_url && (
                <p className="text-xs text-destructive">{errors.crm_webhook_url.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Hours */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-3">
          <Label htmlFor="contact_hours" className="text-sm font-heading uppercase tracking-wider">
            Best hours to receive referrals
          </Label>
          <select
            id="contact_hours"
            {...register('contact_hours')}
            className="w-full min-h-[44px] rounded-lg border border-border/50 bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {contactHoursOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Weekend Pause Toggle */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <label className="flex items-center justify-between cursor-pointer min-h-[44px]">
            <span className="font-heading font-semibold">Pause referrals on weekends?</span>
            <button
              type="button"
              role="switch"
              aria-checked={weekendPause}
              onClick={() => setValue('weekend_pause', !weekendPause)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                weekendPause ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  weekendPause ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
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
        <Button type="submit" className="flex-1 min-h-[44px] text-base font-semibold glow-red">
          Next
        </Button>
      </div>
    </form>
  )
}
