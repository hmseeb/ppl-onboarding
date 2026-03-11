'use client'

import { useState } from 'react'
import type { Broker, BrokerStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'
import { ChevronDown, ChevronLeft, ChevronRight, Phone, Mail, Globe, Clock, Pause, Loader2 } from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(time: string | null): string {
  if (!time) return ''
  // Already human-readable (e.g. "9:00 AM") — return as-is
  if (time.includes('AM') || time.includes('PM')) return time
  // Legacy 24h format (e.g. "09:00") — convert
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${ampm}`
}

function StatusBadge({ status }: { status: BrokerStatus }) {
  switch (status) {
    case 'not_started':
      return <Badge variant="secondary" className="bg-muted text-muted-foreground text-[11px]">Not Started</Badge>
    case 'in_progress':
      return (
        <Badge variant="secondary" className="text-blue-600 border-0 text-[11px]">
          In Progress
        </Badge>
      )
    case 'completed':
      return <Badge variant="default" className="text-[11px]">Completed</Badge>
    default:
      return <Badge variant="secondary" className="text-[11px]">{status}</Badge>
  }
}

function DeliveryBadges({ methods }: { methods: string[] | null }) {
  if (!methods?.length) return <span className="text-muted-foreground text-xs">{'\u2014'}</span>
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((method) => (
        <span
          key={method}
          className="rounded bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        >
          {method === 'crm_webhook' ? 'CRM' : method}
        </span>
      ))}
    </div>
  )
}

function ContactHoursDisplay({ broker }: { broker: Broker }) {
  if (!broker.contact_hours) return <span className="text-muted-foreground">{'\u2014'}</span>
  if (broker.contact_hours === 'custom' && broker.custom_hours_start && broker.custom_hours_end) {
    return <span>{formatTime(broker.custom_hours_start)} – {formatTime(broker.custom_hours_end)}</span>
  }
  if (broker.contact_hours === 'business_hours') return <span>Business hours</span>
  if (broker.contact_hours === 'anytime') return <span>Anytime</span>
  return <span className="capitalize">{broker.contact_hours}</span>
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-heading shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right">{value || '\u2014'}</span>
    </div>
  )
}

function BrokerCard({ broker }: { broker: Broker }) {
  const [expanded, setExpanded] = useState(false)
  const pricePerLead = broker.batch_size > 0 ? (broker.deal_amount / broker.batch_size).toFixed(0) : '\u2014'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      {/* Summary row — always visible */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">
              {broker.first_name} {broker.last_name}
            </span>
            <StatusBadge status={broker.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {broker.company_name || 'No company'} · {broker.batch_size} referrals · {formatDate(broker.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <CopyLinkButton token={broker.token} />
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-border/60 px-4 py-3 bg-muted/20 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {/* Left — broker info */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-heading mb-1 mt-1">Broker Info</p>
              <DetailRow label="Email" value={broker.email} />
              <DetailRow label="Phone" value={broker.phone} />
              <DetailRow label="State" value={broker.state} />
              <DetailRow
                label="Verticals"
                value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {broker.primary_vertical && <Badge variant="secondary" className="text-[10px]">{broker.primary_vertical}</Badge>}
                    {broker.secondary_vertical && <Badge variant="secondary" className="text-[10px]">{broker.secondary_vertical}</Badge>}
                    {!broker.primary_vertical && !broker.secondary_vertical && '\u2014'}
                  </div>
                }
              />
            </div>

            {/* Right — deal + delivery */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-heading mb-1 mt-1">Deal &amp; Delivery</p>
              <DetailRow
                label="Batch"
                value={
                  <span>
                    <span className="text-primary font-display italic">{broker.batch_size}</span> referrals · ${Number(broker.deal_amount).toLocaleString()} (${pricePerLead}/lead)
                  </span>
                }
              />
              <DetailRow label="Delivery" value={<DeliveryBadges methods={broker.delivery_methods} />} />
              {broker.delivery_email && (
                <DetailRow label="" value={<span className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3 text-muted-foreground" />{broker.delivery_email}</span>} />
              )}
              {broker.delivery_phone && (
                <DetailRow label="" value={<span className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3 text-muted-foreground" />{broker.delivery_phone}</span>} />
              )}
              {broker.crm_webhook_url && (
                <DetailRow label="" value={<span className="flex items-center gap-1.5 text-xs"><Globe className="h-3 w-3 text-muted-foreground" /><span className="truncate max-w-[200px]">{broker.crm_webhook_url}</span></span>} />
              )}
            </div>
          </div>

          {/* Preferences footer */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <ContactHoursDisplay broker={broker} />
            </span>
            {broker.weekend_pause && (
              <span className="flex items-center gap-1.5 text-primary">
                <Pause className="h-3.5 w-3.5" />
                Weekends paused
              </span>
            )}
            <span>Received: {formatDate(broker.created_at)}</span>
            <span>Completed: {formatDate(broker.completed_at)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface BrokerTableProps {
  initialBrokers: Broker[]
  initialTotal: number
  pageSize: number
}

export function BrokerTable({ initialBrokers, initialTotal, pageSize }: BrokerTableProps) {
  const [brokers, setBrokers] = useState<Broker[]>(initialBrokers)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function fetchPage(page: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/brokers?page=${page}&pageSize=${pageSize}`)
      if (!res.ok) throw new Error('Failed to fetch brokers')
      const data = await res.json()
      setBrokers(data.brokers)
      setTotal(data.total)
      setCurrentPage(data.page)
    } catch (err) {
      console.error('Error fetching brokers:', err)
    } finally {
      setLoading(false)
    }
  }

  if (total === 0 && !loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
        <p className="text-muted-foreground">
          No brokers yet. Waiting for the first GHL webhook.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Broker cards */}
      <div className="space-y-2 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {brokers.map((broker) => (
          <BrokerCard key={broker.id} broker={broker} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <button
            onClick={() => fetchPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>

          <button
            onClick={() => fetchPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
