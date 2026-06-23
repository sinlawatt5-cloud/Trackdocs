import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { Select } from '../../components/Select'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../auth/useAuth'
import { exportShipmentsCsv, listCustomers, listShipmentsForRole } from '../../lib/firestore'
import type { Customer, Shipment, ShipmentStatus } from '../../types'

type ReportFilters = {
  status: 'all' | ShipmentStatus
  customerCode: string
  date: string
}

const emptyFilters: ReportFilters = {
  status: 'all',
  customerCode: 'all',
  date: '',
}

export function AdminReportsPage() {
  const { session } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const loadData = async () => {
    if (!session) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const [shipmentList, customerList] = await Promise.all([
        listShipmentsForRole({ role: session.role, limitCount: 50 }),
        listCustomers(),
      ])
      setShipments(shipmentList)
      setCustomers(customerList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [session])

  const customerOptions = useMemo(
    () => [...customers].sort((left, right) => left.companyName.localeCompare(right.companyName)),
    [customers],
  )

  const filteredShipments = useMemo(
    () =>
      shipments.filter((shipment) => {
        if (filters.status !== 'all' && shipment.status !== filters.status) {
          return false
        }

        if (filters.customerCode !== 'all' && shipment.customerCode !== filters.customerCode) {
          return false
        }

        if (filters.date) {
          const targetDate = filters.date.slice(0, 10)
          const candidateDates = [shipment.sentDate, shipment.createdAt, shipment.updatedAt, shipment.receivedAt]
            .filter(Boolean)
            .map((value) => value.slice(0, 10))

          if (!candidateDates.includes(targetDate)) {
            return false
          }
        }

        return true
      }),
    [filters.customerCode, filters.date, filters.status, shipments],
  )

  const stats = useMemo(() => {
    const pending = filteredShipments.filter((shipment) => shipment.status === 'NOT_RECEIVED').length
    const received = filteredShipments.filter((shipment) => shipment.status === 'RECEIVED').length

    return [
      {
        label: 'Filtered',
        value: String(filteredShipments.length),
        tone: 'cyan' as const,
        description: 'Shipment records matching current filters',
      },
      {
        label: 'NOT_RECEIVED',
        value: String(pending),
        tone: 'amber' as const,
        description: 'Documents still waiting for operation',
      },
      {
        label: 'RECEIVED',
        value: String(received),
        tone: 'green' as const,
        description: 'Documents already confirmed',
      },
    ]
  }, [filteredShipments])

  async function handleExport() {
    setExporting(true)
    try {
      const csv = await exportShipmentsCsv(filters)
      downloadCsv(csv, `trackdocs-reports-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success('ดาวน์โหลด CSV เรียบร้อยแล้ว')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ไม่สามารถ export CSV ได้')
    } finally {
      setExporting(false)
    }
  }

  const pageActions = (
    <>
      <div>
        <p className="trackdocs-text-body-strong">Reports</p>
        <p className="trackdocs-text-helper mt-1">
          Filter by company, status, and date before exporting the current result set.
        </p>
      </div>
      <Button tone="cyan" onClick={() => void handleExport()} disabled={exporting || loading}>
        {exporting ? 'Exporting...' : 'Export CSV'}
      </Button>
    </>
  )

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <AppShell title="Reports" subtitle="Understand proof flow and export filtered records." actions={pageActions}>
        <LoadingState />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Reports" subtitle="Understand proof flow and export filtered records." actions={pageActions}>
        <ErrorState message={error} />
      </AppShell>
    )
  }

  return (
    <AppShell title="Reports" subtitle="Understand proof flow and export filtered records." actions={pageActions}>
      <div className="trackdocs-page-entrance space-y-6">
        <div className="trackdocs-stagger-list grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="trackdocs-entrance trackdocs-stagger-list trackdocs-card trackdocs-card-strong trackdocs-card-module p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as ReportFilters['status'],
                }))
              }
            >
              <option value="all">All statuses</option>
              <option value="NOT_RECEIVED">NOT_RECEIVED</option>
              <option value="RECEIVED">RECEIVED</option>
            </Select>
            <Select
              label="Customer"
              value={filters.customerCode}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  customerCode: event.target.value,
                }))
              }
            >
              <option value="all">All companies</option>
              {customerOptions.map((customer) => (
                <option key={customer.customerId} value={customer.companyCode}>
                  {customer.companyCode} - {customer.companyName}
                </option>
              ))}
            </Select>
            <label className="block">
              <span className="trackdocs-text-body-strong">Date</span>
              <input
                type="date"
                value={filters.date}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className="trackdocs-input mt-2 h-12 w-full px-4 text-sm"
              />
            </label>
            <div className="flex items-end">
              <Button
                tone="slate"
                className="h-12 w-full"
                onClick={() => setFilters(emptyFilters)}
                disabled={exporting}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="trackdocs-stagger-list grid gap-4 lg:hidden">
          {filteredShipments.map((shipment) => (
            <article key={shipment.shipmentId} className="trackdocs-card trackdocs-card-strong trackdocs-card-module flex min-h-[320px] flex-col p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="trackdocs-card-badge px-3 py-1.5 text-[var(--td-text-muted)]">
                    <span className="trackdocs-card-badge-dot" aria-hidden="true" />
                    REPORT ITEM
                  </span>
                  <div>
                    <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
                      {shipment.trackingNo}
                    </p>
                    <p className="mt-2 trackdocs-text-page-title">
                      {shipment.customerName}
                    </p>
                    <p className="mt-1 trackdocs-text-body text-[var(--td-text-muted)]">{shipment.customerCode}</p>
                  </div>
                </div>
                <StatusBadge status={shipment.status} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 trackdocs-text-body text-[var(--td-text-muted)]">
                <div>
                  <p className="trackdocs-text-badge">Sent</p>
                  <p className="mt-1 font-semibold text-[var(--td-text-strong)]">{formatDate(shipment.sentDate)}</p>
                </div>
                <div>
                  <p className="trackdocs-text-badge">Envelope</p>
                  <p className="mt-1 font-semibold text-[var(--td-text-strong)]">{shipment.envelopeCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="trackdocs-text-badge">Sender</p>
                  <p className="mt-1 font-semibold text-[var(--td-text-strong)]">{shipment.senderName}</p>
                </div>
                <div className="col-span-2">
                  <p className="trackdocs-text-badge">Created</p>
                  <p className="mt-1 font-semibold text-[var(--td-text-strong)]">{formatDateTime(shipment.createdAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-card-module hidden overflow-hidden lg:block">
          <table className="min-w-full divide-y divide-[rgba(17,17,17,0.08)]">
            <thead className="bg-[rgba(249,247,241,0.96)]">
              <tr>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Tracking
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Customer
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Sender
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Sent date
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Envelope
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Status
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Created
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Received by
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(17,17,17,0.08)]">
              {filteredShipments.map((shipment) => (
                <tr key={shipment.shipmentId} className="transition hover:bg-[rgba(248,246,239,0.92)]">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--td-text-strong)]">{shipment.trackingNo}</p>
                    <p className="trackdocs-text-helper mt-1">{shipment.customerCode}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-[var(--td-text-strong)]">{shipment.customerName}</p>
                    <p className="trackdocs-text-helper mt-1">{shipment.customerCode}</p>
                  </td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{shipment.senderName}</td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{formatDate(shipment.sentDate)}</td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{shipment.envelopeCount}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{formatDateTime(shipment.createdAt)}</td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">
                    {shipment.receivedByName || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredShipments.length === 0 ? (
          <div className="trackdocs-card trackdocs-card-strong p-8 text-center">
            <p className="trackdocs-text-section-title">No matching records</p>
            <p className="mt-2 trackdocs-text-body text-[var(--td-text-muted)]">
              ลองเปลี่ยนตัวกรอง customer, status หรือวันที่ แล้วลองใหม่อีกครั้ง
            </p>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

function formatDate(value: string) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}


