import { useEffect, useMemo, useState } from 'react'
import { LogOut, RefreshCw, UserRound, CalendarDays, Search, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge } from '../../components/StatusBadge'
import { AppShell } from '../../components/AppShell'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { ShipmentTable } from '../../components/ShipmentTable'
import { StatCard } from '../../components/StatCard'
import { useAuth } from '../../auth/useAuth'
import { listShipmentsForRole } from '../../lib/firestore'
import type { Shipment } from '../../types'
import { Link } from 'react-router-dom'

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy HH:mm')
}

export function AdminDashboardPage() {
  const { session, signOut } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchShipments = () => {
    if (!session) return
    setLoading(true)
    listShipmentsForRole({ role: session.role, limitCount: 50 })
      .then(setShipments)
      .catch((err) => setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchShipments()
  }, [session])

  const stats = useMemo(() => {
    const pending = shipments.filter((shipment) => shipment.status === 'NOT_RECEIVED').length
    const received = shipments.filter((shipment) => shipment.status === 'RECEIVED').length

    return [
      { label: 'ทั้งหมด', value: String(shipments.length), tone: 'cyan' as const, description: 'ทั้งหมด' },
      { label: 'ยังไม่รับ', value: String(pending), tone: 'amber' as const, description: 'ยังไม่รับ' },
      { label: 'รับแล้ว', value: String(received), tone: 'green' as const, description: 'รับแล้ว' },
    ]
  }, [shipments])

  const filteredShipments = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()
    return shipments.filter((shipment) => {
      if (filter === 'pending' && shipment.status !== 'NOT_RECEIVED') return false
      if (filter === 'received' && shipment.status !== 'RECEIVED') return false
      if (filter === 'today') {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const createdStr = shipment.createdAt ? shipment.createdAt.slice(0, 10) : ''
        if (createdStr !== todayStr) return false
      }
      if (trimmedQuery && !shipment.trackingNo.toLowerCase().includes(trimmedQuery)) return false
      if (date) {
        const createdStr = shipment.createdAt ? shipment.createdAt.slice(0, 10) : ''
        if (createdStr !== date) return false
      }
      return true
    })
  }, [shipments, filter, query, date])

  if (!session) return null
  if (loading) return <AppShell title="ศูนย์รับเอกสาร"><LoadingState /></AppShell>
  if (error) return <AppShell title="ศูนย์รับเอกสาร"><ErrorState message={error} /></AppShell>

  return (
    <AppShell
      title="ศูนย์รับเอกสาร"
      subtitle="ตรวจรับเอกสารจากทุกบริษัท ครบจบในที่เดียว"
      density="compact"
    >
      <div className="trackdocs-page-entrance space-y-5 lg:space-y-6">
        


        {/* Metrics Grid */}
        <div className="trackdocs-stagger-list grid grid-cols-3 items-stretch gap-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} mini />
          ))}
        </div>

        {/* Mobile Recent Shipments unified Card */}
        <div className="trackdocs-card trackdocs-card-strong rounded-[24px] border border-[rgba(15,23,42,0.07)] bg-white p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4 lg:hidden">
          {/* Mobile Recent Shipments Header */}
          <div className="flex items-center gap-3 border-b border-[rgba(15,23,42,0.06)] pb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#eff8c9] text-[#8aa200] border border-[#e2f0b7]/50">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[17px] font-black tracking-tight text-[var(--td-text-strong)]">รายการล่าสุด</h2>
            </div>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="text-center py-6 text-[12.5px] text-[var(--td-text-muted)] font-semibold">
              ไม่พบรายการที่ตรงกับตัวกรองนี้
            </div>
          ) : (
            <div className="trackdocs-stagger-list divide-y divide-[rgba(15,23,42,0.06)] space-y-4">
              {filteredShipments.map((shipment) => {
                const statusLabel = shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'
                return (
                  <div key={shipment.shipmentId} className="flex flex-col pt-4 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-[800] tracking-tight text-[var(--td-text-strong)] truncate">
                            {shipment.trackingNo}
                          </h3>
                          <span className="text-[9px] font-[700] text-[var(--td-text-muted)] bg-[rgba(15,23,42,0.04)] px-1.5 py-0.5 rounded-full uppercase">
                            {shipment.customerCode}
                          </span>
                        </div>
                        <p className="text-[11px] font-[600] text-[var(--td-text-muted)] mt-1.5 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDateTime(shipment.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={shipment.status} label={statusLabel} />
                    </div>
                    
                    {shipment.customerNote && (
                      <div className="mt-2.5 rounded-[12px] bg-[rgba(15,23,42,0.02)] px-3 py-2 text-[12px] text-[var(--td-text-muted)]">
                        หมายเหตุ: {shipment.customerNote}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-end">
                      <Link
                        to={`/shipments/${shipment.shipmentId}`}
                        state={{ shipment }}
                        className="inline-flex h-[32px] items-center gap-1 rounded-full bg-[rgba(43,199,232,0.05)] px-3 text-[11px] font-bold text-[#109ec2] transition hover:bg-[rgba(43,199,232,0.1)]"
                      >
                        ดูรายละเอียด <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <ShipmentTable shipments={filteredShipments.slice(0, 5)} />
        </div>

        {/* Mobile Compact Filter */}
        <div className="lg:hidden rounded-[24px] bg-white p-3.5 border border-[rgba(15,23,42,0.07)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-3.5 mt-2 trackdocs-card trackdocs-card-strong">
          <div className="flex rounded-full bg-[rgba(15,23,42,0.04)] p-1">
            {[
              { label: 'ทั้งหมด', value: 'all' },
              { label: 'ยังไม่ได้รับ', value: 'pending' },
              { label: 'รับแล้ว', value: 'received' },
              { label: 'วันนี้', value: 'today' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilter(option.value)
                  if (option.value !== 'date') {
                    setDate('')
                  }
                }}
                className={
                  option.value === filter
                    ? 'flex-1 rounded-full bg-[#d9f127] py-2 text-[12px] font-[800] text-[#171c01] shadow-[0_4px_12px_rgba(217,241,39,0.3)] transition-all'
                    : 'flex-1 rounded-full py-2 text-[12px] font-[600] text-[var(--td-text-muted)] transition-all hover:text-[var(--td-text-strong)]'
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--td-text-muted)]" />
              <input
                type="text"
                placeholder="ค้นหา Tracking No..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-[12px] border border-[rgba(0,0,0,0.05)] bg-white py-2.5 pl-8 pr-3 text-[12px] font-[600] text-[var(--td-text-strong)] placeholder:text-[var(--td-text-muted)] focus:border-[#BED52B] focus:outline-none focus:ring-1 focus:ring-[#BED52B] transition-all"
              />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--td-text-muted)]" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  const nextDate = e.target.value
                  setDate(nextDate)
                  setFilter(nextDate ? 'date' : 'all')
                }}
                className="w-full rounded-[12px] border border-[rgba(0,0,0,0.05)] bg-white py-2.5 pl-8 pr-3 text-[12px] font-[600] text-[var(--td-text-strong)] focus:border-[#BED52B] focus:outline-none focus:ring-1 focus:ring-[#BED52B] transition-all"
              />
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}


