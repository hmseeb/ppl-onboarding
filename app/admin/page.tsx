import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookie, ADMIN_COOKIE_NAME } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { BrokerTable } from '@/components/admin/BrokerTable'
import type { Broker } from '@/lib/types'

export default async function AdminPage() {
  // Defense-in-depth: verify cookie server-side even if proxy.ts is bypassed (CVE-2025-29927)
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)

  if (!sessionCookie || !verifySessionCookie(sessionCookie.value)) {
    redirect('/admin/login')
  }

  // Fetch all brokers sorted by most recent first
  const supabase = createServiceClient()
  const { data: brokers, error } = await supabase
    .from('brokers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch brokers:', error)
  }

  const brokerList = (brokers ?? []) as Broker[]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Broker Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              <span className="font-display text-2xl text-primary">{brokerList.length}</span>{' '}
              broker{brokerList.length !== 1 ? 's' : ''}
            </p>
          </div>
          <LogoutButton />
        </div>
        <BrokerTable brokers={brokerList} />
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
        className="rounded-lg border border-border/50 bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 hover:border-primary/30"
      >
        Logout
      </button>
    </form>
  )
}
