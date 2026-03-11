'use client'

import { useState, useCallback, useEffect } from 'react'
import { Broker } from '@/lib/types'
import { OnboardingHeader } from './OnboardingHeader'
import { StepTransition } from './StepTransition'
import { Step1Welcome } from './steps/Step1Welcome'
import { Step2Delivery } from './steps/Step2Delivery'
import { Step3HowItWorks } from './steps/Step3HowItWorks'
import { Step4ROI } from './steps/Step4ROI'
import { Step5BestPractices } from './steps/Step5BestPractices'
import { Button } from '@/components/ui/button'

interface OnboardingStepperProps {
  broker: Broker
  token: string
}

export function OnboardingStepper({ broker, token }: OnboardingStepperProps) {
  const [currentStep, setCurrentStep] = useState(broker.current_step ?? 1)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  // Fire POST to /api/brokers/[token]/start on mount if status is 'not_started'
  useEffect(() => {
    if (broker.status !== 'not_started') return

    const controller = new AbortController()
    fetch(`/api/brokers/${token}/start`, {
      method: 'POST',
      signal: controller.signal,
    }).catch(() => {
      // Silently ignore abort errors
    })

    return () => controller.abort()
  }, [broker.status, token])

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      // Fire-and-forget step persistence
      fetch(`/api/brokers/${token}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      }).catch(() => {
        // Silently ignore errors — step persistence is non-blocking
      })
    },
    [token]
  )

  const handleNext = useCallback(
    (stepData?: Record<string, unknown>) => {
      if (stepData) {
        setFormData((prev) => ({ ...prev, ...stepData }))
      }
      if (currentStep < 7) {
        goToStep(currentStep + 1)
      }
    },
    [currentStep, goToStep]
  )

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const handleComplete = useCallback(async (): Promise<void> => {
    const response = await fetch(`/api/brokers/${token}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData }),
    })
    if (!response.ok) {
      console.error('Completion failed:', response.status)
    }
  }, [token, formData])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OnboardingHeader currentStep={currentStep} totalSteps={7} />
      <main className="max-w-lg mx-auto px-4 pb-24">
        <StepTransition stepKey={currentStep}>
          {currentStep === 1 && (
            <Step1Welcome broker={broker} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <Step2Delivery broker={broker} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <Step3HowItWorks onNext={() => handleNext()} onBack={handleBack} />
          )}
          {currentStep === 4 && (
            <Step4ROI broker={broker} onNext={() => handleNext()} onBack={handleBack} />
          )}
          {currentStep === 5 && (
            <Step5BestPractices onNext={() => handleNext()} onBack={handleBack} />
          )}
          {/* Steps 6-7: placeholder — will be added in Plan 04 */}
          {currentStep >= 6 && currentStep <= 7 && (
            <div className="py-12 text-center text-muted-foreground">
              Step {currentStep} — coming soon
              <div className="mt-4 flex gap-2 justify-center">
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
                {currentStep < 7 ? (
                  <Button onClick={() => handleNext()}>Next</Button>
                ) : (
                  <Button onClick={() => handleComplete()}>Complete</Button>
                )}
              </div>
            </div>
          )}
        </StepTransition>
      </main>
    </div>
  )
}
