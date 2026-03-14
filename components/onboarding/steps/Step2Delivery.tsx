'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeliveryPrefsSchema, type DeliveryPrefs, type DeliveryMethod } from '@/lib/validations/delivery'
import { Broker } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const VERTICALS = [
  'MCA',
  'Equipment',
  'SBA',
  'Real Estate',
  'Business Line of Credit',
  'Invoice Factoring',
] as const

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

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
]

const US_TZ_VALUES = US_TIMEZONES.map((tz) => tz.value)

/** Map device timezone to the closest US timezone. Defaults to Eastern if no match. */
function resolveUSTimezone(detected: string): string {
  if (US_TZ_VALUES.includes(detected)) return detected
  // Map common IANA aliases to US zones by UTC offset
  const offsetHours = new Date().getTimezoneOffset() / -60
  if (offsetHours <= -10) return 'Pacific/Honolulu'
  if (offsetHours <= -9) return 'America/Anchorage'
  if (offsetHours <= -8) return 'America/Los_Angeles'
  if (offsetHours <= -7) return 'America/Denver'
  if (offsetHours <= -6) return 'America/Chicago'
  return 'America/New_York'
}

const selectClass = 'w-full min-h-[44px] rounded-xl border border-border bg-[rgba(220,38,38,0.04)] backdrop-blur-sm px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50'

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
      timezone: broker.timezone ?? '',
      primary_vertical: broker.primary_vertical ?? '',
      secondary_vertical: broker.secondary_vertical ?? '',
    },
  })

  // Auto-detect timezone on the client (not server) so Intl returns the user's actual timezone
  useEffect(() => {
    if (!broker.timezone) {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      setValue('timezone', resolveUSTimezone(detected))
    }
  }, [broker.timezone, setValue])

  const selectedMethods = watch('delivery_methods')
  const contactHours = watch('contact_hours')
  const weekendPause = watch('weekend_pause')
  const webhookUrl = watch('crm_webhook_url')

  const [testState, setTestState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const isValidUrl = useCallback((url: string | undefined) => {
    if (!url) return false
    try { new URL(url); return true } catch { return false }
  }, [])

  const sendTestWebhook = async () => {
    if (!isValidUrl(webhookUrl)) return
    setTestState('loading')
    setTestMessage('')
    try {
      const res = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestState('success')
        setTestMessage(`Delivered (${data.status} ${data.statusText})`)
      } else {
        setTestState('error')
        setTestMessage(data.error || `Failed (${data.status} ${data.statusText})`)
      }
    } catch {
      setTestState('error')
      setTestMessage('Network error — could not reach server')
    }
    setTimeout(() => setTestState('idle'), 5000)
  }

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
      <div className="space-y-3 animate-fadeSlideIn">
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-primary/70 font-semibold">Delivery setup</p>
        <h1 className="text-3xl font-heading font-bold tracking-tight">
          How do you want to receive referrals, {broker.first_name}?
        </h1>
        <p className="text-sm text-muted-foreground">Select all that apply — we&apos;ll blast every channel you pick.</p>
      </div>

      {/* Delivery Methods - Checkboxes (multi-select) */}
      <Card className="glass border-border shadow-sm animate-fadeSlideIn delay-1">
        <CardContent className="pt-6 space-y-3">
          <Label className="text-sm font-heading uppercase tracking-wider">Delivery Methods</Label>
          <div className="space-y-2">
            {deliveryMethods.map((method) => {
              const isSelected = selectedMethods?.includes(method.value)
              return (
                <label
                  key={method.value}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors min-h-[56px] ${
                    isSelected
                      ? 'border-primary bg-primary/5 accent-glow-sm'
                      : 'border-border hover:border-primary/30'
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
                        : 'border-muted-foreground/40'
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
                className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
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
                className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
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
                className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                placeholder="https://your-crm.com/webhook"
              />
              {errors.crm_webhook_url && (
                <p className="text-xs text-destructive">{errors.crm_webhook_url.message}</p>
              )}

              {/* Test Webhook Button */}
              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!isValidUrl(webhookUrl) || testState === 'loading'}
                  onClick={sendTestWebhook}
                  className="gap-2"
                >
                  {testState === 'loading' ? (
                    <>
                      <svg className="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Send Test Payload
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Send a sample lead to verify your webhook mapping
                </p>
                {testState === 'success' && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {testMessage}
                  </p>
                )}
                {testState === 'error' && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {testMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verticals */}
      <Card className="glass border-border shadow-sm animate-fadeSlideIn delay-2">
        <CardContent className="pt-6 space-y-3">
          <Label className="text-sm font-heading uppercase tracking-wider">What verticals do you work?</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="primary_vertical" className="text-xs text-muted-foreground">Primary</Label>
              <select
                id="primary_vertical"
                {...register('primary_vertical')}
                className={selectClass}
              >
                <option value="">Select</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="secondary_vertical" className="text-xs text-muted-foreground">Secondary</Label>
              <select
                id="secondary_vertical"
                {...register('secondary_vertical')}
                className={selectClass}
              >
                <option value="">None</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Hours */}
      <Card className="glass border-border shadow-sm animate-fadeSlideIn delay-2">
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

      {/* Timezone */}
      <Card className="glass border-border shadow-sm animate-fadeSlideIn delay-3">
        <CardContent className="pt-6 space-y-3">
          <Label htmlFor="timezone" className="text-sm font-heading uppercase tracking-wider">
            Your timezone
          </Label>
          <select
            id="timezone"
            {...register('timezone')}
            className={selectClass}
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-xs text-destructive">{errors.timezone.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Weekend Pause Toggle */}
      <Card className="glass border-border shadow-sm animate-fadeSlideIn delay-4">
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
      <div className="flex gap-3 animate-fadeSlideIn delay-5">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="flex-1 min-h-[44px] text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          Back
        </Button>
        <Button type="submit" className="flex-1 min-h-[44px] text-base font-semibold accent-glow">
          Next
        </Button>
      </div>
    </form>
  )
}
