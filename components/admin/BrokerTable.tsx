'use client'

import type { Broker, BrokerStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: BrokerStatus }) {
  switch (status) {
    case 'not_started':
      return <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">Not Started</Badge>
    case 'in_progress':
      return (
        <Badge variant="outline" className="text-amber-400 border-amber-400/50">
          In Progress
        </Badge>
      )
    case 'completed':
      return <Badge variant="default">Completed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function BrokerTable({ brokers }: { brokers: Broker[] }) {
  if (brokers.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-card py-16">
        <p className="text-muted-foreground">
          No brokers yet. Waiting for the first GHL webhook.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground">Name</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground">Company</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground">Received</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground">Completed</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground">Delivery</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-heading text-muted-foreground w-10">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brokers.map((broker) => (
            <TableRow key={broker.id}>
              <TableCell className="text-sm font-medium text-foreground">
                {broker.first_name} {broker.last_name}
              </TableCell>
              <TableCell className="text-sm">{broker.company_name || '\u2014'}</TableCell>
              <TableCell className="text-sm">
                <StatusBadge status={broker.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(broker.created_at)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(broker.completed_at)}</TableCell>
              <TableCell className="text-sm">
                {broker.delivery_method ? (
                  <span className="rounded bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium uppercase">
                    {broker.delivery_method}
                  </span>
                ) : (
                  '\u2014'
                )}
              </TableCell>
              <TableCell className="text-sm">
                <CopyLinkButton token={broker.token} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
