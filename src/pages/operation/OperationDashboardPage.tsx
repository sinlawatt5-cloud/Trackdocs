import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, RefreshCw, SlidersHorizontal, LogOut, UserRound, ChevronRight, Filter, ActivitySquare, Search, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { ShipmentTable } from '../../components/ShipmentTable'
import { StatCard } from '../../components/StatCard'
import { SegmentedFilter } from '../../components/SegmentedFilter'
import { ReceiveDialog } from '../../components/ReceiveDialog'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../auth/useAuth'
import { listShipmentsForRole, receiveShipmentRecord } from '../../lib/firestore'
import { uploadShipmentImage } from '../../lib/r2Upload'
import type { Shipment, ShipmentStatus } from '../../types'

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy HH:mm')
}

type OperationFilter = 'all' | 'NOT_RECEIVED' | 'RECEIVED' | 'today' | 'date'

const FILTER_OPTIONS: Array<{ value: OperationFilter; label: string }> = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'NOT_RECEIVED', label: 'ยังไม่ได้รับ' },
  { value: 'RECEIVED', label: 'รับแล้ว' },
  { value: 'today', label: 'วันนี้' },
]

function toDateKey(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10)
  }
  return format(parsed, 'yyyy-MM-dd')
}

function shipmentDateKeys(shipment: Shipment) {
  return [shipment.sentDate, shipment.createdAt, shipment.updatedAt, shipment.receivedAt]
    .map((value) => toDateKey(value))
    .filter(Boolean)
}

function matchesOperationFilter(shipment: Shipment, filter: OperationFilter, selectedDate: string) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'NOT_RECEIVED' || filter === 'RECEIVED') {
    return shipment.status === filter
  }

  const dateKey = filter === 'today' ? format(new Date(), 'yyyy-MM-dd') : selectedDate
  if (!dateKey) {
    return true
  }

  return shipmentDateKeys(shipment).includes(dateKey)
}

export function OperationDashboardPage() {
  const { session, signOut } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<OperationFilter>('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [receiveTarget, setReceiveTarget] = useState<Shipment | null>(null)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const loadRequestId = useRef(0)

  async function loadShipments() {
    if (!session) {
      return
    }

    const requestId = ++loadRequestId.current
    setLoading(true)

    try {
      const shipmentList = await listShipmentsForRole({
        role: session.role,
        limitCount: 50,
      })

      if (requestId !== loadRequestId.current) {
        return
      }

      setShipments(shipmentList)
      setError('')
    } catch (err) {
      if (requestId !== loadRequestId.current) {
        return
      }

      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้')
    } finally {
      if (requestId === loadRequestId.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!session) {
      return
    }

    void loadShipments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const visibleShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const matchesFilter = matchesOperationFilter(shipment, filter, selectedDate)
      const matchesSearch = searchQuery
        ? shipment.trackingNo.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchesFilter && matchesSearch
    })
  }, [filter, selectedDate, searchQuery, shipments])

  const stats = useMemo(() => {
    const pending = shipments.filter((shipment) => shipment.status === 'NOT_RECEIVED').length
    const received = shipments.filter((shipment) => shipment.status === 'RECEIVED').length

    return [
      {
        label: 'ทั้งหมด',
        value: String(shipments.length),
        tone: 'cyan' as const,
        description: 'รายการทั้งหมด',
      },
      {
        label: 'ยังไม่ได้รับ',
        value: String(pending),
        tone: 'amber' as const,
        description: 'เอกสารรอรับ',
      },
      {
        label: 'รับแล้ว',
        value: String(received),
        tone: 'green' as const,
        description: 'รายการที่รับแล้ว',
      },
      {
        label: 'ล่าสุด',
        value: '1',
        tone: 'lime' as const,
        description: 'รายการล่าสุด',
        isLive: true,
      },
    ]
  }, [shipments])

  const currentFilterLabel =
    filter === 'date' && selectedDate
      ? `เธงเธฑเธเธ—เธตเน ${selectedDate}`
      : FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? 'เธ—เธฑเนเธเธซเธกเธ”'

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <AppShell title="Operation dashboard" subtitle="Monitor and receive document deliveries in one place.">
        <LoadingState />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Operation dashboard" subtitle="Monitor and receive document deliveries in one place.">
        <ErrorState message={error} onRetry={() => void loadShipments()} />
      </AppShell>
    )
  }

  async function handleConfirmReceive(payload: { note: string; file: File | null; previewUrl: string | null }) {
    if (!receiveTarget) {
      throw new Error('ไม่พบรายการเอกสารที่เลือก')
    }

    if (!session) {
      throw new Error('ไม่พบสถานะเข้าสู่ระบบ')
    }

    let receivedImage: { key: string; url: string } | null = null
    if (payload.file) {
      receivedImage = await uploadShipmentImage({
        file: payload.file,
        customerCode: receiveTarget.customerCode,
        trackingNo: receiveTarget.trackingNo,
        imageType: 'received',
      })
    }

    const updated = await receiveShipmentRecord({
      shipmentId: receiveTarget.shipmentId,
      operationReceiveNote: payload.note,
      receivedBy: session,
      receivedImage,
    })

    setShipments((current) => current.map((item) => (item.shipmentId === updated.shipmentId ? updated : item)))
    setReceiveOpen(false)
    setReceiveTarget(null)
  }

  return (
    <AppShell
      density="compact"
      title="ศูนย์รับเอกสาร"
      subtitle="ตรวจรับเอกสารจากทุกบริษัท กรองตามสถานะหรือวันที่ และจัดการงานล่าสุดได้จากจุดเดียว"
      actions={
        <>
          <div>
            <p className="trackdocs-text-body-strong text-[1.15rem]">Operations center</p>
            <p className="trackdocs-text-helper mt-1">
              เรียงงาน `NOT_RECEIVED` ขึ้นก่อน และคงหน้าต่างข้อมูลล่าสุด 50 รายการไว้เสมอ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="trackdocs-pill px-4 py-2 trackdocs-text-badge text-[var(--td-text-strong)]">
              {session.displayName}
            </div>
            <button
              type="button"
              onClick={() => void loadShipments()}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.1)] bg-white px-4 py-2 trackdocs-text-badge text-[var(--td-text-strong)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition hover:-translate-y-0.5 hover:bg-[rgba(247,250,225,0.9)]"
            >
              <RefreshCw className="h-4 w-4" />
              รีเฟรช
            </button>
          </div>
        </>
      }
    >
      <div className="trackdocs-page-entrance grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_368px]">
        <section className="space-y-4 lg:space-y-5">
          
          {/* Metrics Grid */}
          <div className="trackdocs-stagger-list grid grid-cols-2 items-start gap-3 md:gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* Mobile Recent Shipments unified Card */}
          <div className="trackdocs-card trackdocs-card-strong rounded-[22px] border border-[rgba(0,0,0,0.03)] bg-white/90 p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4 lg:hidden">
            {/* Mobile Recent Shipments Header */}
            <div className="flex items-center gap-3 border-b border-[rgba(15,23,42,0.06)] pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#eff8c9] text-[#8aa200] border border-[#e2f0b7]/50">
                <CalendarDays className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[17px] font-black tracking-tight text-[var(--td-text-strong)]">รายการล่าสุด</h2>
              </div>
            </div>

            {visibleShipments.length === 0 ? (
              <div className="text-center py-8 text-[13px] font-bold text-[var(--td-text-muted)]">
                ไม่พบรายการที่ตรงกับตัวกรองนี้
              </div>
            ) : (
              <div className="trackdocs-stagger-list divide-y divide-[rgba(15,23,42,0.06)] space-y-4">
                {visibleShipments.map((shipment) => {
                  const statusLabel = shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'
                  const canReceive = shipment.status === 'NOT_RECEIVED'
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

                      <div className="mt-3 flex items-center justify-end gap-2">
                        {canReceive && (
                          <button
                            type="button"
                            onClick={() => {
                              setReceiveTarget(shipment)
                              setReceiveOpen(true)
                            }}
                            className="flex h-[32px] items-center justify-center gap-1 rounded-full bg-[#D7EA49] px-4 text-[11px] font-black text-[#172008] shadow-[0_2px_8px_rgba(215,234,73,0.3)] active:scale-[0.98] transition-transform"
                          >
                            รับเอกสาร
                          </button>
                        )}
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

          {/* ค้นหาและกรองรายการ (Mobile Card) */}
          <div className="lg:hidden rounded-[22px] bg-white/90 p-4 sm:p-5 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-3.5 mt-2 trackdocs-card trackdocs-card-strong">
            <div className="flex rounded-full bg-[rgba(15,23,42,0.04)] p-1">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFilter(option.value)
                    if (option.value !== 'date') {
                      setSelectedDate('')
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[12px] border border-[rgba(0,0,0,0.05)] bg-white py-2.5 pl-8 pr-3 text-[12px] font-[600] text-[var(--td-text-strong)] placeholder:text-[var(--td-text-muted)] focus:border-[#BED52B] focus:outline-none focus:ring-1 focus:ring-[#BED52B] transition-all"
                />
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--td-text-muted)]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const nextDate = e.target.value
                    setSelectedDate(nextDate)
                    setFilter(nextDate ? 'date' : 'all')
                  }}
                  className="w-full rounded-[12px] border border-[rgba(0,0,0,0.05)] bg-white py-2.5 pl-8 pr-3 text-[12px] font-[600] text-[var(--td-text-strong)] focus:border-[#BED52B] focus:outline-none focus:ring-1 focus:ring-[#BED52B] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            {visibleShipments.length === 0 ? (
              <EmptyState
                title="ยังไม่มีรายการเอกสาร"
                description={
                  filter === 'all'
                    ? 'ยังไม่มีรายการจากทุกบริษัทในช่วง 50 รายการล่าสุด'
                    : 'ไม่พบรายการที่ตรงกับตัวกรองนี้ ลองเปลี่ยนสถานะ บริษัท หรือวันที่'
                }
              />
            ) : (
              <ShipmentTable
                shipments={visibleShipments}
                onReceive={(shipment) => {
                  setReceiveTarget(shipment)
                  setReceiveOpen(true)
                }}
              />
            )}
          </div>
        </section>

        <aside className="hidden lg:block trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-side-filter-module xl:sticky xl:top-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(15,23,42,0.08)] p-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.1)] bg-[rgba(255,255,255,0.96)] px-3 py-2 trackdocs-text-badge text-[var(--td-text-muted)]">
                <SlidersHorizontal className="h-4 w-4 text-[var(--td-primary)]" />
                Filter
              </div>
              <div>
                <p className="trackdocs-text-section-title text-[1.35rem]">ค้นหาและกรองรายการ</p>
                <p className="mt-1 trackdocs-text-body">
                  เลือกสถานะ วันที่ หรือดูภาพรวมของรายการจัดส่งล่าสุดได้จากมุมมองนี้
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilter('all')
                setSelectedDate('')
              }}
              className="trackdocs-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 trackdocs-text-badge"
            >
              รีเซ็ต
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFilter(option.value)
                    if (option.value !== 'date') {
                      setSelectedDate('')
                    }
                  }}
                  aria-pressed={filter === option.value}
                  className={[
                    'inline-flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition',
                    filter === option.value
                      ? 'border-[rgba(215,234,73,0.28)] bg-[rgba(215,234,73,0.92)] text-[var(--td-text-strong)] shadow-[0_14px_30px_rgba(215,234,73,0.22)]'
                      : 'border-[rgba(15,23,42,0.08)] bg-white text-[var(--td-text-muted)] hover:bg-[rgba(247,250,225,0.72)]',
                  ].join(' ')}
                >
                  <span className="trackdocs-text-body-strong text-[0.92rem]">{option.label}</span>
                  <span className="trackdocs-cursor-help trackdocs-text-caption text-[rgba(15,23,42,0.34)]">?</span>
                </button>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="trackdocs-text-label text-xs">เลือกวันที่</span>
              <div className="flex items-center gap-3 rounded-[16px] border border-[rgba(15,23,42,0.1)] bg-white px-3 py-2 shadow-[0_12px_24px_rgba(17,17,17,0.05)]">
                <CalendarDays className="h-4 w-4 text-[var(--td-text-muted)]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    const nextDate = event.target.value
                    setSelectedDate(nextDate)
                    setFilter(nextDate ? 'date' : 'all')
                  }}
                  className="w-full bg-transparent trackdocs-text-body text-[0.9rem] text-[var(--td-text-strong)] outline-none"
                />
              </div>
            </label>

            <div className="rounded-[20px] border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,251,0.96)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <p className="trackdocs-text-badge text-[var(--td-text-muted)]">Current filter</p>
              <p className="mt-1 trackdocs-text-body-strong text-[0.9rem]">{currentFilterLabel}</p>
              <p className="mt-1 trackdocs-text-body text-[0.8rem] leading-snug text-[var(--td-text-muted)]">
                แสดงข้อมูลรายการล่าสุด 50 รายการตามสถานะ {filter === 'date' && selectedDate ? 'และวันที่เลือก' : 'หรือช่วงเวลาที่กำหนด'}
              </p>
            </div>
          </div>
        </aside>
      </div>
      <ReceiveDialog
        open={receiveOpen}
        shipment={receiveTarget}
        onClose={() => {
          setReceiveOpen(false)
          setReceiveTarget(null)
        }}
        onConfirm={handleConfirmReceive}
      />
    </AppShell>
  )
}

function OperationShipmentCards({
  shipments,
  onReceive,
}: {
  shipments: Shipment[]
  onReceive: (shipment: Shipment) => void
}) {
  return (
    <div className="trackdocs-stagger-list space-y-3">
      {shipments.map((shipment) => {
        const canReceive = shipment.status === 'NOT_RECEIVED'

        return (
          <div key={shipment.shipmentId}>
            {/* MOBILE COMPACT VIEW (120px - 150px) */}
            <article className="lg:hidden relative flex flex-col rounded-[22px] border border-[rgba(255,255,255,0.8)] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#f0f4db] text-[#697d10] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <ActivitySquare className="h-5 w-5" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--td-text-muted)]">TRACKING NO</p>
                    <p className="text-[15px] font-black text-[var(--td-text-strong)]">{shipment.trackingNo}</p>
                  </div>
                  <div className="mx-2 h-8 w-[1px] border-l border-dashed border-[rgba(0,0,0,0.1)]" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--td-text-muted)]">ลูกค้า</p>
                    <p className="text-[13px] font-bold text-[var(--td-text-strong)]">{shipment.customerCode}</p>
                  </div>
                  <div className="mx-2 h-8 w-[1px] border-l border-dashed border-[rgba(0,0,0,0.1)]" />
                  <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${
                    shipment.status === 'RECEIVED'
                      ? 'border-[rgba(22,163,74,0.1)] bg-[#f0fdf4] text-[#166534]'
                      : 'border-[rgba(245,158,11,0.1)] bg-[#fffbeb] text-[#b45309]'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${shipment.status === 'RECEIVED' ? 'bg-[#16a34a]' : 'bg-[#f59e0b]'}`} />
                    {shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[12px] font-medium text-[var(--td-text-muted)] line-clamp-1">
                หมายเหตุ: {shipment.customerNote || '—'}
              </div>
              <div className="mt-3 flex gap-2">
                {canReceive && (
                  <button
                    type="button"
                    onClick={() => onReceive(shipment)}
                    className="flex-1 flex h-[38px] items-center justify-center gap-1 rounded-[14px] bg-[#D7EA49] text-[12px] font-black text-[#172008] shadow-[0_2px_8px_rgba(215,234,73,0.3)] active:scale-[0.98] transition-transform"
                  >
                    รับเอกสาร
                  </button>
                )}
                <Link
                  to={`/shipments/${shipment.shipmentId}`}
                  state={{ shipment }}
                  className="flex-1 flex h-[38px] items-center justify-center gap-1 rounded-[14px] bg-[#f8f9fa] text-[12px] font-bold text-[var(--td-text-strong)] active:bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.04)] transition-all"
                >
                  ดูรายละเอียด <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>

            {/* DESKTOP ORIGINAL VIEW */}
            <article className="hidden lg:flex min-h-[280px] flex-col p-5 sm:p-6 trackdocs-card trackdocs-card-strong trackdocs-card-module">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <span className="trackdocs-card-badge px-3 py-1.5 text-[var(--td-text-muted)]">
                    <span className="trackdocs-card-badge-dot" aria-hidden="true" />
                    {shipment.customerCode}
                  </span>
                  <div>
                    <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
                      tracking no
                    </p>
                    <h3 className="mt-2 trackdocs-text-section-title">
                      {shipment.trackingNo}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-[var(--td-text-muted)]">{shipment.customerName}</p>
                  </div>
                </div>
                <StatusBadge
                  status={shipment.status}
                  label={shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'}
                  tone={shipment.status === 'RECEIVED' ? 'green' : 'amber'}
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.72)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
                  หมายเหตุ
                </p>
                <p className="mt-3 trackdocs-text-body text-[var(--td-text-strong)]">
                  {shipment.customerNote || '—'}
                </p>
              </div>

              <div className="trackdocs-card-divider mt-6 pt-4" />

              <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {canReceive ? (
                  <button
                    type="button"
                    onClick={() => onReceive(shipment)}
                    className="inline-flex items-center justify-center gap-2 rounded-[20px] trackdocs-button-primary px-4 py-3 text-sm font-semibold shadow-[0_16px_34px_rgba(215,234,73,0.24)] transition hover:-translate-y-0.5"
                  >
                    รับแล้ว
                  </button>
                ) : null}
                <Link
                  to={`/shipments/${shipment.shipmentId}`}
                  state={{ shipment }}
                  className="trackdocs-module-action inline-flex justify-center"
                >
                  ดูรายละเอียด
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          </div>
        )
      })}
    </div>
  )
}

