'use client'

import { ProgressBar } from './ProgressBar'

interface OnboardingHeaderProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingHeader({ currentStep, totalSteps }: OnboardingHeaderProps) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="text-center mb-4">
        <span className="text-xl font-bold text-foreground tracking-tight">BadAAAS</span>
      </div>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
    </div>
  )
}
