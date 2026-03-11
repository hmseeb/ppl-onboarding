import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookie, ADMIN_COOKIE_NAME } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { BrokerTable } from '@/components/admin/BrokerTable'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Broker } from '@/lib/types'

const PAGE_SIZE = 10

export default async function AdminPage() {
  // Defense-in-depth: verify cookie server-side even if proxy.ts is bypassed (CVE-2025-29927)
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)

  if (!sessionCookie || !verifySessionCookie(sessionCookie.value)) {
    redirect('/admin/login')
  }

  const supabase = createServiceClient()

  // Fetch total count
  const { count, error: countError } = await supabase
    .from('brokers')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Failed to fetch broker count:', countError)
  }

  const total = count ?? 0

  // Fetch first page of brokers
  const { data: brokers, error } = await supabase
    .from('brokers')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (error) {
    console.error('Failed to fetch brokers:', error)
  }

  const brokerList = (brokers ?? []) as Broker[]

  return (
    <div className="min-h-screen onboarding-bg">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="animate-fadeSlideIn delay-1 text-xs font-heading uppercase tracking-[0.25em] text-primary/70 font-semibold mb-1.5">
              ADMIN
            </p>
            <h1 className="animate-fadeSlideIn delay-2 text-4xl font-bold tracking-tight text-foreground font-heading">
              Broker Dashboard
            </h1>
            <p className="animate-fadeSlideIn delay-3 mt-1.5 text-muted-foreground">
              <span className="font-display text-2xl text-primary italic">{total}</span>{' '}
              broker{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="animate-fadeSlideIn delay-2 flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <div className="animate-fadeSlideIn delay-4">
          <BrokerTable initialBrokers={brokerList} initialTotal={total} pageSize={PAGE_SIZE} />
        </div>
      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server'
        const cookieStore = await cookies()
        cookieStore.delete(ADMIN_COOKIE_NAME)
        redirect('/admin/login')
      }}
    >
      <button
        type="submit"
        className="glass glass-hover rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 shadow-sm"
      >
        Logout
      </button>
    </form>
  )
}
