import { format } from 'date-fns'
import { ArrowUpRight, Building2, CalendarDays, CheckCircle2, Search, Send, TrendingUp } from 'lucide-react'
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

type StatusFilter = 'all' | ShipmentStatus

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
    <Card tone="glass" padding="md" className="trackdocs-card-module flex min-h-[390px] flex-col border-[rgba(15,23,42,0.08)] p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <span className="trackdocs-card-badge px-3 py-1.5 text-[var(--td-text-muted)]">
            <span className="trackdocs-card-badge-dot" aria-hidden="true" />
            CUSTOMER
          </span>
          <div>
            <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
              {shipment.customerCode}
            </p>
            <h3 className="trackdocs-text-section-title mt-2">
              {shipment.trackingNo}
            </h3>
            <p className="trackdocs-text-body mt-2">เอกสารของบริษัท {shipment.customerCode}</p>
          </div>
        </div>
        <StatusBadge status={shipment.status} label={statusLabel} />
      </div>

      <div className="mt-6 rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.72)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
        <p className="trackdocs-text-caption text-[var(--td-text-muted)]">customerNote</p>
        <p className="trackdocs-text-body mt-3 text-[var(--td-text-strong)]">
          {shipment.customerNote || 'ไม่มีหมายเหตุ'}
        </p>
      </div>

      <div className="trackdocs-card-divider mt-6 pt-4" />

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 trackdocs-text-body">
        <div>
          <p className="trackdocs-text-caption">createdAt</p>
          <p className="trackdocs-text-body-strong mt-1">{formatDateTime(shipment.createdAt)}</p>
        </div>
        <Link
          to={`/shipments/${shipment.shipmentId}`}
          state={{ shipment }}
          className="trackdocs-module-action"
        >
          ดูรายละเอียด
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  )
}

export function CustomerDashboardPage() {
  const { session } = useAuth()
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
      if (status !== 'all' && shipment.status !== status) {
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
        description: 'รายการล่าสุด 50 รายการของบริษัทคุณ',
      },
      {
        label: 'ยังไม่ได้รับ',
        value: String(pending),
        tone: 'amber' as const,
        description: 'เอกสารที่รอ Operation รับปลายทาง',
      },
      {
        label: 'รับแล้ว',
        value: String(received),
        tone: 'green' as const,
        description: 'รายการที่ปิดงานแล้ว',
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
          <section className="space-y-5 xl:space-y-6">
            <div className="trackdocs-stagger-list grid items-stretch gap-5 md:grid-cols-3">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} compact />
              ))}
            </div>

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

            {isEmpty ? (
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
            ) : (
              <>
                <div className="trackdocs-stagger-list space-y-4 md:hidden">
                  {filteredShipments.map((shipment) => (
                    <ShipmentListCard key={shipment.shipmentId} shipment={shipment} />
                  ))}
                </div>

                <Card tone="glass" padding="none" className="trackdocs-entrance trackdocs-latest-shipments-card hidden overflow-hidden rounded-[26px] md:block">
                  <div className="flex items-start justify-between gap-4 border-b border-[rgba(15,23,42,0.08)] px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(15,23,42,0.1)] bg-[rgba(255,255,255,0.78)] text-[var(--td-text-muted)]">
                        <CalendarDays className="h-5 w-5" />
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
                          <th className="px-5 py-4">tracking no</th>
                          <th className="px-5 py-4">วันที่ส่ง</th>
                          <th className="px-5 py-4">จำนวนซอง</th>
                          <th className="px-5 py-4">หมายเหตุลูกค้า</th>
                          <th className="px-5 py-4">สถานะ</th>
                          <th className="px-5 py-4">สร้างเมื่อ</th>
                          <th className="px-5 py-4 text-right">action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShipments.slice(0, 5).map((shipment) => (
                          <tr
                            key={shipment.shipmentId}
                            className="border-t border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.72)] align-middle transition hover:bg-[rgba(255,255,255,0.9)]"
                          >
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <p className="trackdocs-text-body-strong text-[1.18rem]">
                                  {shipment.trackingNo}
                                </p>
                                <p className="trackdocs-text-caption text-[var(--td-text-muted)]">{shipment.customerCode}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4 trackdocs-text-body">{formatDate(shipment.sentDate)}</td>
                            <td className="px-5 py-4 trackdocs-text-body-strong">
                              {shipment.envelopeCount}
                            </td>
                            <td className="max-w-[300px] px-5 py-4 trackdocs-text-body text-[var(--td-text-strong)]">
                              {shipment.customerNote || '-'}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge
                                status={shipment.status}
                                label={shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'}
                              />
                            </td>
                            <td className="px-5 py-4 trackdocs-text-body">
                              {formatDateTime(shipment.createdAt)}
                            </td>
                            <td className="px-5 py-4 text-right">
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
              </>
            )}
          </section>

          <aside className="trackdocs-stagger-list space-y-5 xl:sticky xl:top-8">
            <Card tone="glass" padding="md" className="trackdocs-side-filter-module trackdocs-side-module rounded-[26px] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eff8c9_0%,#d7ea49_100%)] text-[#8aa200] shadow-[0_14px_24px_rgba(215,234,73,0.14)]">
                  <Search className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="trackdocs-text-section-title">ค้นหาและกรองรายการ</p>
                  <p className="mt-1 trackdocs-text-body">ค้นหา trackingNo, กรองสถานะ และเลือกวันที่ส่งได้จากที่นี่</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={
                      option.value === status
                        ? 'trackdocs-button-primary w-full rounded-full px-4 py-3 text-sm font-semibold'
                        : 'trackdocs-pill trackdocs-pill-soft w-full justify-center rounded-full px-4 py-3 text-sm font-semibold text-[var(--td-text-muted)]'
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4">
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
                <div className="mt-5 rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.68)] p-4 trackdocs-text-body">
                  <p>พบรายการที่ตรงเงื่อนไข {filteredShipments.length} รายการ</p>
                  <Button
                    type="button"
                    tone="slate"
                    onClick={() => {
                      setQuery('')
                      setStatus('all')
                      setDate('')
                    }}
                    className="mt-3 w-full rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    ล้างตัวกรอง
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card tone="glass" padding="md" className="hidden trackdocs-side-module rounded-[26px] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(215,234,73,0.18)] text-[#8aa200]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="trackdocs-text-section-title text-[1.25rem]">สรุปวันนี้</p>
              </div>
              <div className="divide-y divide-[rgba(15,23,42,0.08)]">
                {todaySummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-4 trackdocs-text-body">
                    <span>{item.label}</span>
                    <span className="trackdocs-text-body-strong">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card tone="glass" padding="md" className="hidden trackdocs-side-module trackdocs-side-module-tall rounded-[26px] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(43,199,232,0.16)] text-[#1599b6]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="trackdocs-text-section-title text-[1.25rem]">กิจกรรมล่าสุด</p>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 border-b border-[rgba(15,23,42,0.07)] pb-4 last:border-b-0 last:pb-0">
                      <div
                        className={
                          activity.tone === 'green'
                            ? 'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(53,201,126,0.18)] text-[#1fa45f]'
                            : 'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(43,199,232,0.16)] text-[#1599b6]'
                        }
                      >
                        {activity.tone === 'green' ? <CheckCircle2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="trackdocs-text-body-strong">{activity.title}</p>
                        <p className="trackdocs-text-body">{activity.trackingNo}</p>
                        <p className="trackdocs-text-helper">{activity.date}</p>
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



