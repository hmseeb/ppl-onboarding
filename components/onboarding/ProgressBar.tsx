'use client'

import { Fragment } from 'react'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center w-full">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep
        return (
          <Fragment key={step}>
            <div
              className={`rounded-full transition-all duration-500 ${
                isCurrent
                  ? 'w-2.5 h-2.5 bg-primary accent-glow-sm'
                  : isCompleted
                    ? 'w-2 h-2 bg-primary/80'
                    : 'w-1.5 h-1.5 bg-[rgba(220,38,38,0.15)]'
              }`}
            />
            {step < totalSteps && (
              <div className="flex-1 mx-1.5">
                <div
                  className={`h-px transition-all duration-500 ${
                    isCompleted ? 'bg-primary/50' : 'bg-border/40'
                  }`}
                />
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
