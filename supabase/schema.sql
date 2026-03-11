-- Brokers table for PPL Onboarding
-- Run this SQL in the Supabase SQL Editor to create the table.

CREATE TABLE brokers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token           uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  ghl_contact_id  text NOT NULL UNIQUE,

  -- Webhook-supplied data (GHL source of truth)
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  company_name    text,
  state           text,
  primary_vertical   text,
  secondary_vertical text,
  batch_size      integer NOT NULL,
  deal_amount     numeric NOT NULL,

  -- Broker-supplied during onboarding (populated in Phase 2)
  delivery_methods text[],
  delivery_email  text,
  delivery_phone  text,
  crm_webhook_url text,
  contact_hours   text,
  custom_hours_start text,
  custom_hours_end   text,
  weekend_pause   boolean DEFAULT false,

  -- Step persistence (populated in Phase 2)
  current_step    integer DEFAULT 1,
  step_data       jsonb,

  -- Status tracking
  status          text NOT NULL DEFAULT 'not_started',
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX brokers_status_idx ON brokers(status);
CREATE INDEX brokers_created_at_idx ON brokers(created_at DESC);
