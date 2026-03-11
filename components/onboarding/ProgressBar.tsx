'use client'

import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-baseline">
        <span className="font-display text-2xl text-primary">{currentStep}</span>
        <span className="text-xs text-muted-foreground ml-1">/ {totalSteps}</span>
      </div>
      <div className="flex-1">
        <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
      </div>
    </div>
  )
}
