'use client'

import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="space-y-1">
      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  )
}
