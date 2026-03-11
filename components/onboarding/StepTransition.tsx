'use client'

import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

interface StepTransitionProps {
  stepKey: number
  children: React.ReactNode
}

export function StepTransition({ stepKey, children }: StepTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  const variants = {
    initial: { opacity: 0, x: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: shouldReduceMotion ? 0 : -20 },
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
          duration: shouldReduceMotion ? 0 : 0.25,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
