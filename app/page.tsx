import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE_NAME, verifySessionCookie } from '@/lib/auth'

export default async function Home() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)

  if (session?.value && verifySessionCookie(session.value)) {
    redirect('/admin')
  }

  redirect('/admin/login')
}
