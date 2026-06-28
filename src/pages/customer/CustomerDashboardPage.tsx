import { format } from 'date-fns'
import { ArrowUpRight, Building2, CalendarDays, CheckCircle2, Search, Send, TrendingUp, LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Input } from '../../components/Input'
import { LoadingState } from '../../components/LoadingState'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { getCustomerShipments } from '../../lib/firestore'
import type { Shipment, ShipmentStatus } from '../../types'

type StatusFilter = 'all' | ShipmentStatus | 'today'

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'NOT_RECEIVED', label: 'ยังไม่ได้รับ' },
  { value: 'RECEIVED', label: 'รับแล้ว' },
]

function formatDateTime(value: string) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy HH:mm')
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy')
}

function normalizeDate(value: string) {
  return value ? value.slice(0, 10) : ''
}

function ShipmentListCard({ shipment }: { shipment: Shipment }) {
  const statusLabel = shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'

  return (
    <Card tone="glass" padding="none" className="trackdocs-card-module flex flex-col rounded-[20px] border border-[rgba(15,23,42,0.05)] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-[800] tracking-tight text-[var(--td-text-strong)] truncate">
              {shipment.trackingNo}
            </h3>
            <span className="text-[10px] font-[700] text-[var(--td-text-muted)] bg-[rgba(15,23,42,0.04)] px-2 py-0.5 rounded-full uppercase">
              {shipment.customerCode}
            </span>
          </div>
          <p className="text-[11.5px] font-[600] text-[var(--td-text-muted)] mt-1.5 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateTime(shipment.createdAt)}
          </p>
        </div>
        <StatusBadge status={shipment.status} label={statusLabel} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {shipment.customerNote ? (
            <div className="rounded-[12px] bg-[rgba(15,23,42,0.03)] px-3 py-1.5 text-[11.5px] font-[600] text-[var(--td-text-muted)] truncate border border-[rgba(0,0,0,0.02)]">
              {shipment.customerNote}
            </div>
          ) : (
            <div className="rounded-[12px] bg-[rgba(15,23,42,0.015)] px-3 py-1.5 text-[11px] font-[500] text-[rgba(15,23,42,0.3)] truncate border border-[rgba(0,0,0,0.01)]">
              ไม่มีหมายเหตุ
            </div>
          )}
        </div>
        <Link
          to={`/shipments/${shipment.shipmentId}`}
          state={{ shipment }}
          className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-[800] text-[#0891b2] bg-[#f0fbfd] px-3.5 py-2 rounded-full transition-colors active:bg-[#e0f7fc]"
        >
          ดูรายละเอียด
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  )
}

export function CustomerDashboardPage() {
  const { session, signOut } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [date, setDate] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadShipments() {
      if (!session?.customerId) {
        setError('ไม่พบข้อมูลบริษัทในโปรไฟล์ผู้ใช้งาน')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const records = await getCustomerShipments(session.customerId, { limitCount: 50 })
        if (!mounted) {
          return
        }

        setShipments(records)
        setError('')
      } catch (err) {
        if (!mounted) {
          return
        }
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลรายการได้')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadShipments()

    return () => {
      mounted = false
    }
  }, [session?.customerId])

  const filteredShipments = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()
    const selectedDate = normalizeDate(date)

    return shipments.filter((shipment) => {
      if (status === 'today') {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const createdStr = shipment.createdAt ? shipment.createdAt.slice(0, 10) : ''
        if (createdStr !== todayStr) return false
      } else if (status !== 'all' && shipment.status !== status) {
        return false
      }

      if (trimmedQuery && !shipment.trackingNo.toLowerCase().includes(trimmedQuery)) {
        return false
      }

      if (selectedDate) {
        const candidateDates = [shipment.sentDate, shipment.createdAt, shipment.updatedAt]
          .filter(Boolean)
          .map((value) => value.slice(0, 10))

        if (!candidateDates.includes(selectedDate)) {
          return false
        }
      }

      return true
    })
  }, [date, query, shipments, status])

  const stats = useMemo(() => {

    const pending = shipments.filter((shipment) => shipment.status === 'NOT_RECEIVED').length
    const received = shipments.filter((shipment) => shipment.status === 'RECEIVED').length

    return [
      {
        label: 'ทั้งหมด',
        value: String(shipments.length),
        tone: 'cyan' as const,
        description: 'ทั้งหมด',
      },
      {
        label: 'ยังไม่ได้รับ',
        value: String(pending),
        tone: 'amber' as const,
        description: 'ยังไม่รับ',
      },
      {
        label: 'รับแล้ว',
        value: String(received),
        tone: 'green' as const,
        description: 'รับแล้ว',
      },
    ]
  }, [shipments])

  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const sentToday = shipments.filter((shipment) => normalizeDate(shipment.createdAt || shipment.sentDate) === today).length
    const pending = shipments.filter((shipment) => shipment.status === 'NOT_RECEIVED').length
    const received = shipments.filter((shipment) => shipment.status === 'RECEIVED').length

    return [
      { label: 'ส่งวันนี้', value: sentToday },
      { label: 'รอรับ', value: pending },
      { label: 'รับแล้ว', value: received },
    ]
  }, [shipments])

  const recentActivity = useMemo(() => {
    return shipments.slice(0, 3).map((shipment) => ({
      id: shipment.shipmentId,
      title: shipment.status === 'RECEIVED' ? 'รับเอกสารแล้ว' : 'ส่งเอกสารใหม่',
      trackingNo: shipment.trackingNo,
      date: formatDateTime(shipment.receivedAt || shipment.createdAt),
      tone: shipment.status === 'RECEIVED' ? 'green' : 'cyan',
    }))
  }, [shipments])

  if (!session) {
    return null
  }

  const hasFilters = Boolean(query || status !== 'all' || date)
  const isEmpty = filteredShipments.length === 0

  return (
    <AppShell
      density="compact"
      title="ภาพรวมการทำงาน"
      subtitle={`ติดตามสถานะงานจัดส่ง เอกสาร และการดำเนินงานของบริษัท ${session.customerCode ?? '-'} แบบเรียลไทม์`}
      actions={
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#bff4fb_0%,#67e8f9_38%,#22d3ee_72%,#0891b2_100%)] text-[#04212a] shadow-[0_16px_30px_rgba(34,211,238,0.22)]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="trackdocs-text-body-strong text-[1.3rem]">{session.displayName}</p>
              <p className="trackdocs-text-helper mt-1">Customer code: {session.customerCode ?? '-'}</p>
            </div>
          </div>

          <Link
            to="/customer/create-shipment"
            className="trackdocs-button-primary inline-flex items-center justify-center rounded-full px-7 py-3.5 trackdocs-text-ui"
          >
            แจ้งส่งเอกสารใหม่
          </Link>
        </>
      }
    >
      {loading ? (
        <LoadingState label="กำลังโหลดรายการของลูกค้า" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="trackdocs-page-entrance trackdocs-customer-dashboard-grid">
          <section className="trackdocs-stagger-list space-y-4 xl:space-y-4">
            {/* Mobile Customer Summary Strip */}
            <div className="flex items-center justify-between rounded-[24px] bg-white/90 p-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] lg:hidden trackdocs-card trackdocs-card-strong border border-[rgba(15,23,42,0.07)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#bff4fb_0%,#67e8f9_38%,#22d3ee_72%,#0891b2_100%)] text-[#04212a]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13.5px] font-[800] leading-tight text-[var(--td-text-strong)]">{session.displayName}</p>
                  <p className="text-[11px] font-[700] text-[var(--td-text-muted)] mt-0.5 uppercase tracking-wider">{session.customerCode ?? '-'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e11d48] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(225,29,72,0.3)] transition-transform active:scale-95 hover:bg-[#be123c]"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>

            <div className="trackdocs-stagger-list grid grid-cols-3 items-stretch gap-2 sm:gap-3 md:gap-4">
              {stats.map((stat) => (
                <StatCard 
                  key={stat.label} 
                  {...stat} 
                  compact 
                  hideDescription 
                  centerValue 
                  hideAllStamp 
                  mini
                />
              ))}
            </div>


            {/* Desktop Original Top Filter - hidden on all sizes now since we use the side filter for desktop, wait, the top filter is lg:block but let's hide it on mobile. Wait, earlier it was hidden entirely on mobile? It was hidden on mobile. */}
            <Card tone="glass" padding="md" className="hidden trackdocs-entrance trackdocs-filter-module trackdocs-stagger-list space-y-5 rounded-[26px] p-5 lg:p-6">

              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eff8c9_0%,#d7ea49_100%)] text-[#8aa200] shadow-[0_14px_24px_rgba(215,234,73,0.14)]">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="trackdocs-text-section-title">ค้นหาและกรองรายการ</p>
                    <p className="mt-1 trackdocs-text-body">
                      ค้นหา trackingNo, กรองสถานะ, และเลือกวันที่ส่งได้จากที่นี่
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={
                        option.value === status
                          ? 'trackdocs-button-primary rounded-full px-4 py-2.5 text-sm font-semibold'
                          : 'trackdocs-pill trackdocs-pill-soft rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--td-text-muted)]'
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
                <Input
                  id="customer-dashboard-search"
                  label="ค้นหา trackingNo"
                  placeholder="เช่น SMS-001"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />

                <Input
                  id="customer-dashboard-date"
                  type="date"
                  label="วันที่"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  icon={<CalendarDays className="h-4 w-4" />}
                />
              </div>

              {hasFilters ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.68)] px-4 py-3 trackdocs-text-body">
                  <span>พบรายการที่ตรงเงื่อนไข {filteredShipments.length} รายการ</span>
                  <Button
                    type="button"
                    tone="slate"
                    onClick={() => {
                      setQuery('')
                      setStatus('all')
                      setDate('')
                    }}
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    ล้างตัวกรอง
                  </Button>
                </div>
              ) : null}
            </Card>

            {/* Desktop Views (Table & Empty State) */}
            {isEmpty ? (
              <div className="hidden md:block">
                <EmptyState
                  title={hasFilters ? 'ไม่พบรายการที่ตรงเงื่อนไข' : 'ยังไม่มีรายการเอกสาร'}
                  description={
                    hasFilters
                      ? 'ลองปรับ trackingNo, สถานะ หรือวันที่ใหม่'
                      : 'เริ่มต้นด้วยการแจ้งส่งเอกสารรายการแรกของบริษัทคุณ'
                  }
                  actionLabel="แจ้งส่งเอกสารใหม่"
                  actionTo="/customer/create-shipment"
                />
              </div>
            ) : (
              <Card tone="glass" padding="none" className="trackdocs-entrance trackdocs-latest-shipments-card hidden overflow-hidden rounded-[24px] md:block">
                <div className="flex items-start justify-between gap-3 border-b border-[rgba(15,23,42,0.08)] px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(15,23,42,0.1)] bg-[rgba(255,255,255,0.78)] text-[var(--td-text-muted)]">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="trackdocs-text-section-title">รายการจัดส่งล่าสุด</p>
                      <p className="mt-1 trackdocs-text-body">อัปเดตล่าสุดเพื่อให้ติดตามและตรวจสอบเอกสารได้ต่อเนื่อง</p>
                    </div>
                  </div>
                  <Link
                    to="/customer/create-shipment"
                    className="trackdocs-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    ดูรายการทั้งหมด
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-[rgba(255,255,255,0.78)] text-left trackdocs-text-table-head text-[var(--td-text-muted)]">
                        <th className="px-4 py-3">tracking no</th>
                        <th className="px-4 py-3">วันที่ส่ง</th>
                        <th className="px-4 py-3">จำนวนซอง</th>
                        <th className="px-4 py-3">หมายเหตุลูกค้า</th>
                        <th className="px-4 py-3">สถานะ</th>
                        <th className="px-4 py-3">สร้างเมื่อ</th>
                        <th className="px-4 py-3 text-right">action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.slice(0, 5).map((shipment) => (
                        <tr
                          key={shipment.shipmentId}
                          className="border-t border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.72)] align-middle transition hover:bg-[rgba(255,255,255,0.9)]"
                        >
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="trackdocs-text-body-strong text-[1rem]">
                                {shipment.trackingNo}
                              </p>
                              <p className="trackdocs-text-caption text-[var(--td-text-muted)]">{shipment.customerCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 trackdocs-text-body">{formatDate(shipment.sentDate)}</td>
                          <td className="px-4 py-3 trackdocs-text-body-strong">
                            {shipment.envelopeCount}
                          </td>
                          <td className="max-w-[300px] px-4 py-3 trackdocs-text-body text-[var(--td-text-strong)]">
                            {shipment.customerNote || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={shipment.status}
                              label={shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'}
                            />
                          </td>
                          <td className="px-4 py-3 trackdocs-text-body">
                            {formatDateTime(shipment.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/shipments/${shipment.shipmentId}`}
                              state={{ shipment }}
                              className="trackdocs-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                            >
                              ดูรายละเอียด
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Mobile Recent Shipments unified Card */}
            <div className="trackdocs-card trackdocs-card-strong rounded-[24px] border border-[rgba(15,23,42,0.07)] bg-white/90 p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4 md:hidden">
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
                <div className="text-center py-8 text-[13px] font-bold text-[var(--td-text-muted)]">
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
                            className="inline-flex items-center gap-1 rounded-full bg-[rgba(43,199,232,0.05)] px-3 py-1.5 text-[11px] font-bold text-[#109ec2] transition hover:bg-[rgba(43,199,232,0.1)]"
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

            {/* Mobile Compact Filter */}
            <div className="xl:hidden rounded-[24px] bg-white/90 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-3.5 trackdocs-card trackdocs-card-strong border border-[rgba(15,23,42,0.07)] mt-2">
              <div className="flex rounded-full bg-[rgba(15,23,42,0.04)] p-1">
                {[
                  { value: 'all', label: 'ทั้งหมด' },
                  { value: 'NOT_RECEIVED', label: 'ยังไม่ได้รับ' },
                  { value: 'RECEIVED', label: 'รับแล้ว' },
                  { value: 'today', label: 'วันนี้' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value as any)}
                    className={
                      option.value === status
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
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-[12px] border border-[rgba(0,0,0,0.05)] bg-white py-2.5 pl-8 pr-3 text-[12px] font-[600] text-[var(--td-text-strong)] focus:border-[#BED52B] focus:outline-none focus:ring-1 focus:ring-[#BED52B] transition-all"
                  />
                </div>
              </div>
              {hasFilters && (
                <div className="flex items-center justify-between text-[11px] font-[600] text-[var(--td-text-muted)] px-1 pt-1">
                  <span>พบ {filteredShipments.length} รายการ</span>
                  <button type="button" onClick={() => { setQuery(''); setStatus('all'); setDate(''); }} className="text-[#0891b2] font-[800] hover:underline">
                    ล้างตัวกรอง
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden xl:block trackdocs-stagger-list space-y-4 xl:sticky xl:top-4 xl:mt-[12px]">
            <Card tone="glass" padding="md" className="trackdocs-side-filter-module trackdocs-side-module rounded-[20px] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eff8c9_0%,#d7ea49_100%)] text-[#8aa200] shadow-[0_14px_24px_rgba(215,234,73,0.14)]">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="trackdocs-text-section-title text-[1rem]">ค้นหาและกรองรายการ</p>
                  <p className="mt-0.5 trackdocs-text-body text-[0.8rem] leading-snug">ค้นหา trackingNo, กรองสถานะ และเลือกวันที่ส่งได้จากที่นี่</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 grid-cols-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={
                      option.value === status
                        ? 'trackdocs-button-primary w-full rounded-[16px] px-3 py-2 text-[0.85rem] font-semibold'
                        : 'trackdocs-pill trackdocs-pill-soft w-full justify-center rounded-[16px] px-3 py-2 text-[0.85rem] font-semibold text-[var(--td-text-muted)]'
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <Input
                  id="customer-dashboard-side-search"
                  label="ค้นหา trackingNo"
                  placeholder="เช่น SMS-001"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />

                <Input
                  id="customer-dashboard-side-date"
                  type="date"
                  label="วันที่"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  icon={<CalendarDays className="h-4 w-4" />}
                />
              </div>

              {hasFilters ? (
                <div className="mt-4 rounded-[16px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.68)] p-3 trackdocs-text-body text-[0.85rem]">
                  <p>พบรายการที่ตรงเงื่อนไข {filteredShipments.length} รายการ</p>
                  <Button
                    type="button"
                    tone="slate"
                    onClick={() => {
                      setQuery('')
                      setStatus('all')
                      setDate('')
                    }}
                    className="mt-2 w-full rounded-full px-3 py-1.5 text-[0.85rem] font-semibold"
                  >
                    ล้างตัวกรอง
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card tone="glass" padding="md" className="hidden trackdocs-side-module rounded-[20px] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(215,234,73,0.18)] text-[#8aa200]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="trackdocs-text-section-title text-[1.15rem]">สรุปวันนี้</p>
              </div>
              <div className="divide-y divide-[rgba(15,23,42,0.08)]">
                {todaySummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 trackdocs-text-body text-[0.9rem]">
                    <span>{item.label}</span>
                    <span className="trackdocs-text-body-strong">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card tone="glass" padding="md" className="hidden trackdocs-side-module trackdocs-side-module-tall rounded-[20px] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(43,199,232,0.16)] text-[#1599b6]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="trackdocs-text-section-title text-[1.15rem]">กิจกรรมล่าสุด</p>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 border-b border-[rgba(15,23,42,0.07)] pb-3 last:border-b-0 last:pb-0">
                      <div
                        className={
                          activity.tone === 'green'
                            ? 'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(53,201,126,0.18)] text-[#1fa45f]'
                            : 'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(43,199,232,0.16)] text-[#1599b6]'
                        }
                      >
                        {activity.tone === 'green' ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="trackdocs-text-body-strong text-[0.9rem]">{activity.title}</p>
                        <p className="trackdocs-text-body text-[0.85rem]">{activity.trackingNo}</p>
                        <p className="trackdocs-text-helper text-xs">{activity.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="trackdocs-text-body">ยังไม่มีกิจกรรมล่าสุด</p>
                )}
              </div>
              <Link
                to="/customer/create-shipment"
                className="trackdocs-button-secondary mt-6 inline-flex w-full items-center justify-center rounded-[18px] px-4 py-3 text-sm font-semibold"
              >
                ดูทั้งหมด
              </Link>
            </Card>
          </aside>
        </div>
      )}
    </AppShell>
  )
}



