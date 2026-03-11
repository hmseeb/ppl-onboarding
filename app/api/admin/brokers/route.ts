import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie, ADMIN_COOKIE_NAME } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Verify admin auth
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!sessionCookie || !verifySessionCookie(sessionCookie.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10', 10)))
  const search = searchParams.get('search')?.trim() || ''

  const supabase = createServiceClient()
  const searchFilter = search ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%` : ''

  // Get total count
  let countQuery = supabase.from('brokers').select('*', { count: 'exact', head: true })
  if (searchFilter) countQuery = countQuery.or(searchFilter)
  const { count, error: countError } = await countQuery

  if (countError) {
    console.error('Failed to fetch broker count:', countError)
    return NextResponse.json({ error: 'Failed to fetch broker count' }, { status: 500 })
  }

  // Fetch page of brokers
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dataQuery = supabase.from('brokers').select('*').order('created_at', { ascending: false })
  if (searchFilter) dataQuery = dataQuery.or(searchFilter)
  const { data: brokers, error } = await dataQuery.range(from, to)

  if (error) {
    console.error('Failed to fetch brokers:', error)
    return NextResponse.json({ error: 'Failed to fetch brokers' }, { status: 500 })
  }

  return NextResponse.json({
    brokers: brokers ?? [],
    total: count ?? 0,
    page,
    pageSize,
  })
}
