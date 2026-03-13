'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Broker } from '@/lib/types'
import { toTitleCase, formatPhone } from '@/lib/utils/normalize'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const Step1Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional().or(z.literal('')),
  company_name: z.string().optional().or(z.literal('')),
})

type Step1Data = z.infer<typeof Step1Schema>

interface Step1WelcomeProps {
  broker: Broker
  onNext: (data: Record<string, unknown>) => void
}

export function Step1Welcome({ broker, onNext }: Step1WelcomeProps) {
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<Step1Data>({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      first_name: broker.first_name,
      last_name: broker.last_name,
      email: broker.email,
      phone: broker.phone ?? '',
      company_name: broker.company_name ?? '',
    },
  })

  const onSubmit = (data: Step1Data) => {
    onNext(data as Record<string, unknown>)
  }

  const displayValues = getValues()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="py-10 space-y-8">
      <div className="space-y-3 animate-fadeSlideIn">
        <p className="text-xs font-heading uppercase tracking-[0.2em] text-primary/70 font-semibold">Welcome aboard</p>
        <h1 className="text-3xl font-heading font-bold tracking-tight">
          {broker.first_name}, let&apos;s get you live.
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          You&apos;re locked in with <span className="text-primary font-bold">{broker.batch_size}</span> exclusive referrals. Let&apos;s get
          you set up so they start hitting your phone.
        </p>
      </div>

      <Card className="glass border-border shimmer-gold shadow-sm animate-fadeSlideIn delay-2">
        <CardContent className="pt-6 space-y-4">
          {!isEditing ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Name</p>
                    <p className="text-base font-medium">
                      {toTitleCase(displayValues.first_name)} {toTitleCase(displayValues.last_name)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Company</p>
                  <p className="text-base font-medium">
                    {displayValues.company_name || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Email</p>
                  <p className="text-base font-medium">{displayValues.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Phone</p>
                  <p className="text-base font-medium">
                    {formatPhone(displayValues.phone) || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Vertical(s)</p>
                  <div className="flex gap-2 mt-1">
                    {broker.primary_vertical && (
                      <Badge variant="secondary">{broker.primary_vertical}</Badge>
                    )}
                    {broker.secondary_vertical && (
                      <Badge variant="secondary">{broker.secondary_vertical}</Badge>
                    )}
                    {!broker.primary_vertical && !broker.secondary_vertical && (
                      <p className="text-base font-medium text-muted-foreground">Not specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Batch Size</p>
                  <p className="text-base font-medium">{broker.batch_size} referrals</p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                  {errors.first_name && (
                    <p className="text-xs text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                  {errors.last_name && (
                    <p className="text-xs text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="company_name">Company</Label>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  className="min-h-[44px] focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Done Editing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center animate-fadeSlideIn delay-3">
        Everything look right? Tap edit to make changes.
      </p>

      <div className="pt-2 animate-fadeSlideIn delay-4">
        <Button type="submit" className="w-full min-h-[44px] text-base font-semibold accent-glow glow-pulse">
          Looks Good — Let&apos;s Go
        </Button>
      </div>
    </form>
  )
}
