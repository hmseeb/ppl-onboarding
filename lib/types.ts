export type BrokerStatus = 'not_started' | 'in_progress' | 'completed'

export interface Broker {
  id: string
  token: string
  ghl_contact_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company_name: string | null
  state: string | null
  primary_vertical: string | null
  secondary_vertical: string | null
  batch_size: number
  deal_amount: number
  delivery_methods: string[] | null
  delivery_email: string | null
  delivery_phone: string | null
  crm_webhook_url: string | null
  contact_hours: string | null
  custom_hours_start: string | null
  custom_hours_end: string | null
  weekend_pause: boolean
  current_step: number
  step_data: Record<string, unknown> | null
  status: BrokerStatus
  created_at: string
  completed_at: string | null
}
