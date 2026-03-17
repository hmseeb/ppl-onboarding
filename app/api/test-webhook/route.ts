import { NextRequest, NextResponse } from 'next/server'

const TEST_PAYLOAD = {
  lead_id: 'test_00000000-0000-0000-0000-000000000000',
  first_name: 'Test',
  last_name: 'Lead',
  email: 'test.lead@example.com',
  phone: '+15551234567',
  business_name: 'Test Business LLC',
  vertical: 'MCA',
  credit_score: 720,
  funding_amount: 50000,
  funding_purpose: 'expansion',
  state: 'FL',
  ai_call_notes: 'This is a test webhook payload for field mapping',
  ai_call_status: 'completed',
  ghl_contact_id: 'ghl_test_webhook',
  assigned_at: '', // filled at runtime
  order_id: 'test_00000000-0000-0000-0000-000000000001',
  broker_id: 'test_00000000-0000-0000-0000-000000000002',
}

export async function POST(req: NextRequest) {
  try {
    const { webhook_url } = await req.json()

    if (!webhook_url || typeof webhook_url !== 'string') {
      return NextResponse.json({ error: 'webhook_url is required' }, { status: 400 })
    }

    // basic URL validation
    try {
      new URL(webhook_url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const payload = {
      ...TEST_PAYLOAD,
      assigned_at: new Date().toISOString(),
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Read response body for error context
    let responseBody = ''
    try {
      responseBody = await response.text()
    } catch {
      // ignore read errors
    }

    if (!response.ok) {
      // Try to extract a meaningful error message from the response
      let errorMessage = `${response.status} ${response.statusText}`
      try {
        const json = JSON.parse(responseBody)
        if (json.message) errorMessage = json.message
        else if (json.error) errorMessage = json.error
      } catch {
        if (responseBody.length > 0 && responseBody.length < 200) {
          errorMessage = responseBody
        }
      }
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      })
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isTimeout = message.includes('abort')
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out (10s)' : message },
      { status: isTimeout ? 504 : 502 }
    )
  }
}
