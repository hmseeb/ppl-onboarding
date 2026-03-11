import { verifyAdminAuth, generateCookieValue, ADMIN_COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body as { password: string }

    if (!password || typeof password !== 'string') {
      return Response.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (!verifyAdminAuth(password)) {
      return Response.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    const cookieValue = generateCookieValue()

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${ADMIN_COOKIE_NAME}=${cookieValue}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
        },
      }
    )
  } catch {
    return Response.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    }
  )
}
