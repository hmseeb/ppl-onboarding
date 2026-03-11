'use client'

import { ProgressBar } from './ProgressBar'

interface OnboardingHeaderProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingHeader({ currentStep, totalSteps }: OnboardingHeaderProps) {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-2">
      <div className="text-center mb-6">
        <span className="font-heading text-lg tracking-[0.2em] uppercase text-foreground">
          BadAAAS
        </span>
        <div className="w-8 h-0.5 bg-primary mx-auto mt-2" />
      </div>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
    </div>
  )
}
