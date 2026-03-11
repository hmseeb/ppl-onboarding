'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeliveryPrefsSchema, type DeliveryPrefs, type DeliveryMethod } from '@/lib/validations/delivery'
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

const deliveryMethods: { value: DeliveryMethod; label: string; description: string }[] = [
  { value: 'sms', label: 'SMS', description: 'Get referrals texted to your phone' },
  { value: 'email', label: 'Email', description: 'Get referrals delivered to your inbox' },
  { value: 'crm_webhook', label: 'CRM Webhook', description: 'Push referrals directly into your CRM' },
]

const contactHoursOptions = [
  { value: 'business_hours' as const, label: 'Business hours only (9 AM – 5 PM)' },
  { value: 'anytime' as const, label: 'Anytime' },
  { value: 'custom' as const, label: 'Custom time window' },
]

const timeSlots = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM',
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
  '10:00 PM',
]

const selectClass = 'w-full min-h-[44px] rounded-lg border border-border/50 bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

export function Step2Delivery({ broker, onNext, onBack }: Step2DeliveryProps) {
  const defaultMethods: DeliveryMethod[] = broker.delivery_methods?.length
    ? (broker.delivery_methods as DeliveryMethod[])
    : ['sms']

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeliveryPrefs>({
    resolver: zodResolver(DeliveryPrefsSchema),
    defaultValues: {
      delivery_methods: defaultMethods,
      delivery_email: broker.delivery_email ?? broker.email ?? '',
      delivery_phone: broker.delivery_phone ?? broker.phone ?? '',
      crm_webhook_url: broker.crm_webhook_url ?? '',
      contact_hours: (broker.contact_hours as DeliveryPrefs['contact_hours']) ?? 'business_hours',
      custom_hours_start: broker.custom_hours_start ?? '',
      custom_hours_end: broker.custom_hours_end ?? '',
      weekend_pause: broker.weekend_pause ?? false,
    },
  })

  const selectedMethods = watch('delivery_methods')
  const contactHours = watch('contact_hours')
  const weekendPause = watch('weekend_pause')

  const toggleMethod = (method: DeliveryMethod) => {
    const current = selectedMethods ?? []
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    setValue('delivery_methods', updated as [DeliveryMethod, ...DeliveryMethod[]], { shouldValidate: true })
  }

  const onSubmit = (data: DeliveryPrefs) => {
    onNext(data as unknown as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="py-10 space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-primary/70">Delivery setup</p>
        <h1 className="text-3xl font-bold tracking-tight">
          How do you want to receive referrals, {broker.first_name}?
        </h1>
        <p className="text-sm text-muted-foreground">Select all that apply — we&apos;ll blast every channel you pick.</p>
      </div>

      {/* Delivery Methods - Checkboxes (multi-select) */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-3">
          <Label className="text-sm font-heading uppercase tracking-wider">Delivery Methods</Label>
          <div className="space-y-2">
            {deliveryMethods.map((method) => {
              const isSelected = selectedMethods?.includes(method.value)
              return (
                <label
                  key={method.value}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors min-h-[56px] ${
                    isSelected
                      ? 'border-primary bg-primary/10 glow-gold-sm'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMethod(method.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">{method.label}</span>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.delivery_methods && (
            <p className="text-xs text-destructive">{errors.delivery_methods.message}</p>
          )}

          {/* Conditional fields — shown for each selected method */}
          {selectedMethods?.includes('sms') && (
            <div className="space-y-1 pt-2">
              <Label htmlFor="delivery_phone">Phone Number for SMS</Label>
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

          {selectedMethods?.includes('email') && (
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

          {selectedMethods?.includes('crm_webhook') && (
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
            className={selectClass}
          >
            {contactHoursOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom time window selects */}
          {contactHours === 'custom' && (
            <div className="flex gap-3 pt-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="custom_hours_start">From</Label>
                <select
                  id="custom_hours_start"
                  {...register('custom_hours_start')}
                  className={selectClass}
                >
                  <option value="">Select start time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="custom_hours_end">To</Label>
                <select
                  id="custom_hours_end"
                  {...register('custom_hours_end')}
                  className={selectClass}
                >
                  <option value="">Select end time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {errors.custom_hours_start && (
            <p className="text-xs text-destructive">{errors.custom_hours_start.message}</p>
          )}
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
        <Button type="submit" className="flex-1 min-h-[44px] text-base font-semibold glow-gold">
          Next
        </Button>
      </div>
    </form>
  )
}
