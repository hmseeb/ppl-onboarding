'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.status === 401) {
        setError('Invalid password')
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        setError('Something went wrong')
        setIsLoading(false)
        return
      }

      // Full navigation to trigger proxy.ts cookie check
      window.location.href = '/admin'
    } catch {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="onboarding-bg min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Glass card */}
        <div className="glass rounded-xl p-8 space-y-6 animate-fadeSlideIn delay-1">
          {/* Lock icon with purple gradient glow */}
          <div className="animate-fadeSlideIn delay-2 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-50 bg-primary rounded-full scale-150" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="animate-fadeSlideIn delay-3 text-xl font-heading tracking-wide text-center text-foreground">
            Admin Login
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fadeSlideIn delay-4">
            <div className="flex flex-col gap-2">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="h-12 bg-input border-border/50 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoading || !password}
              size="lg"
              className={`w-full h-12 text-base font-semibold rounded-lg ${!(isLoading || !password) ? 'accent-glow' : ''}`}
            >
              {isLoading ? 'Checking...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
