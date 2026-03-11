'use client'

import { ProgressBar } from './ProgressBar'

interface OnboardingHeaderProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingHeader({ currentStep, totalSteps }: OnboardingHeaderProps) {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-4">
      <div className="text-center mb-6">
        <span className="font-heading text-sm tracking-[0.3em] uppercase text-primary/80">
          BadAAAS
        </span>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/40" />
          <div className="w-1 h-1 rotate-45 bg-primary/60" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary/40" />
        </div>
      </div>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
    </div>
  )
}
