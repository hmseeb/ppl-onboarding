'use client'

import { useState, useRef, useEffect } from 'react'
import type { Broker, BrokerStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'
import { ChevronDown, ChevronLeft, ChevronRight, Phone, Mail, Globe, Clock, Pause, Loader2, Search, X, Trash2, Pencil, Save, XCircle } from 'lucide-react'

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
        <Badge variant="secondary" className="bg-primary/10 text-red-400 border border-primary/20 text-[11px]">
          In Progress
        </Badge>
      )
    case 'completed':
      return <Badge variant="default" className="bg-primary text-primary-foreground text-[11px]">Completed</Badge>
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
          className="rounded-md bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
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

function EditableDetailRow({
  label,
  fieldName,
  value,
  editData,
  onChange,
  type = 'text',
}: {
  label: string
  fieldName: string
  value: string | number | null
  editData: Record<string, string | number | null>
  onChange: (field: string, val: string | number | null) => void
  type?: 'text' | 'number'
}) {
  const editValue = fieldName in editData ? editData[fieldName] : value
  return (
    <div className="flex justify-between items-center gap-4 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-heading shrink-0">{label}</span>
      <input
        type={type}
        value={editValue ?? ''}
        onChange={(e) => {
          const v = type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value
          onChange(fieldName, v)
        }}
        className="glass rounded-lg px-2 py-1 text-sm text-foreground text-right w-full max-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  )
}

interface BrokerCardProps {
  broker: Broker
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Broker>) => void
}

function BrokerCard({ broker, onDelete, onUpdate }: BrokerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Record<string, string | number | null>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const pricePerLead = broker.batch_size > 0 ? (broker.deal_amount / broker.batch_size).toFixed(0) : '\u2014'

  function handleEditChange(field: string, value: string | number | null) {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  function handleEditCancel() {
    setEditMode(false)
    setEditData({})
  }

  async function handleEditSave() {
    // Only send changed fields
    const changes: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(editData)) {
      const original = broker[key as keyof Broker]
      if (val !== original) {
        changes[key] = val
      }
    }

    if (Object.keys(changes).length === 0) {
      handleEditCancel()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/brokers/${broker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) throw new Error('Failed to update broker')
      const data = await res.json()
      onUpdate(broker.id, data.broker)
      setEditMode(false)
      setEditData({})
    } catch (err) {
      console.error('Error updating broker:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${broker.first_name} ${broker.last_name}? This cannot be undone.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/brokers/${broker.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete broker')
      onDelete(broker.id)
    } catch (err) {
      console.error('Error deleting broker:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="glass glass-hover rounded-xl overflow-hidden transition-all duration-200">
      {/* Summary row — always visible */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary/[0.04] transition-colors cursor-pointer"
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
        <div className="border-t border-primary/10 px-4 py-3 space-y-4" style={{ background: 'rgba(220, 38, 38, 0.04)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {/* Left — broker info */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary/50 font-heading mb-1 mt-1">Broker Info</p>
              {editMode ? (
                <>
                  <EditableDetailRow label="First Name" fieldName="first_name" value={broker.first_name} editData={editData} onChange={handleEditChange} />
                  <EditableDetailRow label="Last Name" fieldName="last_name" value={broker.last_name} editData={editData} onChange={handleEditChange} />
                  <EditableDetailRow label="Email" fieldName="email" value={broker.email} editData={editData} onChange={handleEditChange} />
                  <EditableDetailRow label="Phone" fieldName="phone" value={broker.phone} editData={editData} onChange={handleEditChange} />
                  <EditableDetailRow label="Company" fieldName="company_name" value={broker.company_name} editData={editData} onChange={handleEditChange} />
                  <EditableDetailRow label="State" fieldName="state" value={broker.state} editData={editData} onChange={handleEditChange} />
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Right — deal + delivery */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary/50 font-heading mb-1 mt-1">Deal &amp; Delivery</p>
              {editMode ? (
                <>
                  <EditableDetailRow label="Batch Size" fieldName="batch_size" value={broker.batch_size} editData={editData} onChange={handleEditChange} type="number" />
                  <EditableDetailRow label="Deal Amount" fieldName="deal_amount" value={broker.deal_amount} editData={editData} onChange={handleEditChange} type="number" />
                </>
              ) : (
                <>
                  <DetailRow
                    label="Batch"
                    value={
                      <span>
                        <span className="text-primary font-bold">{broker.batch_size}</span> referrals · ${Number(broker.deal_amount).toLocaleString()} (${pricePerLead}/lead)
                      </span>
                    }
                  />
                </>
              )}
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-primary/10 text-xs text-muted-foreground">
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

            {/* Spacer to push action buttons right */}
            <div className="flex-1" />

            {/* Edit / Delete action buttons */}
            {editMode ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
              </div>
            )}
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
  const [search, setSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function fetchBrokers(page: number, query: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (query) params.set('search', query)
      const res = await fetch(`/api/admin/brokers?${params}`)
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

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchBrokers(1, value)
    }, 300)
  }

  function clearSearch() {
    setSearch('')
    fetchBrokers(1, '')
  }

  function handleDelete(id: string) {
    setBrokers((prev) => prev.filter((b) => b.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }

  function handleUpdate(id: string, data: Partial<Broker>) {
    setBrokers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    )
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  if (initialTotal === 0 && !search) {
    return (
      <div className="flex items-center justify-center glass rounded-xl border border-dashed border-primary/20 py-16">
        <p className="text-muted-foreground">
          No brokers yet. Waiting for the first GHL webhook.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, email, or company..."
          className="w-full glass rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Broker cards */}
      <div className="space-y-2 relative min-h-[100px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!loading && brokers.length === 0 && search && (
          <div className="flex items-center justify-center glass rounded-xl border border-dashed border-primary/20 py-12">
            <p className="text-muted-foreground text-sm">
              No brokers match &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
        {brokers.map((broker) => (
          <BrokerCard
            key={broker.id}
            broker={broker}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
          <button
            onClick={() => fetchBrokers(currentPage - 1, search)}
            disabled={currentPage <= 1 || loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>

          <button
            onClick={() => fetchBrokers(currentPage + 1, search)}
            disabled={currentPage >= totalPages || loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
