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
        <span className="font-heading text-sm tracking-[0.3em] uppercase text-primary font-semibold drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]">
          BadAAAS
        </span>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="w-10 h-px bg-primary/20" />
          <div className="w-0.5 h-3 bg-primary accent-glow-sm rounded-full" />
          <div className="w-10 h-px bg-primary/20" />
        </div>
      </div>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
    </div>
  )
}
