'use client'

import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

interface StepTransitionProps {
  stepKey: number
  children: React.ReactNode
}

export function StepTransition({ stepKey, children }: StepTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  const variants = {
    initial: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : 30,
      y: shouldReduceMotion ? 0 : 8,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : -30,
      y: shouldReduceMotion ? 0 : -4,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: shouldReduceMotion ? 0 : 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
