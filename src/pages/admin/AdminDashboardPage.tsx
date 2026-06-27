import { useEffect, useMemo, useState } from 'react'
import { LogOut, RefreshCw, UserRound, ChevronRight, Filter, CalendarDays, ActivitySquare } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { ShipmentTable } from '../../components/ShipmentTable'
import { StatCard } from '../../components/StatCard'
import { SegmentedFilter } from '../../components/SegmentedFilter'
import { useAuth } from '../../auth/useAuth'
import { listShipmentsForRole } from '../../lib/firestore'
import type { Shipment } from '../../types'

export function AdminDashboardPage() {
  const { session, signOut } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      { label: 'ทั้งหมด', value: String(shipments.length), tone: 'cyan' as const, description: 'รายการทั้งหมด' },
      { label: 'ยังไม่ได้รับ', value: String(pending), tone: 'amber' as const, description: 'เอกสารรอรับ' },
      { label: 'รับแล้ว', value: String(received), tone: 'green' as const, description: 'รายการที่รับแล้ว' },
      { label: 'ล่าสุด', value: '1', tone: 'lime' as const, description: 'รายการล่าสุด', isLive: true },
    ]
  }, [shipments])

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
        
        {/* Mobile Action Pills */}
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <button className="flex h-[38px] items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-3.5 text-[12px] font-bold text-[var(--td-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
            <UserRound className="h-4 w-4" /> Operation
          </button>
          <button onClick={fetchShipments} className="flex h-[38px] items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-3.5 text-[12px] font-bold text-[var(--td-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
            <RefreshCw className="h-4 w-4" /> รีเฟรช
          </button>
          <button onClick={signOut} className="flex h-[38px] items-center gap-1.5 rounded-full bg-[#e11d48] px-4 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(225,29,72,0.25)] transition-transform hover:bg-[#be123c] active:scale-[0.98]">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="trackdocs-stagger-list grid grid-cols-2 items-start gap-3 md:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Segmented Filter (Mobile) */}
        <div className="pt-2 lg:hidden">
          <SegmentedFilter
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'ทั้งหมด', value: 'all' },
              { label: 'ยังไม่ได้รับ', value: 'pending' },
              { label: 'รับแล้ว', value: 'received' },
              { label: 'วันนี้', value: 'today' },
            ]}
          />
        </div>

        <div className="trackdocs-entrance">
          <div className="mb-3 flex items-center justify-between lg:mb-4">
            <h2 className="text-[16px] font-bold text-[var(--td-text-strong)] lg:text-lg">รายการล่าสุด</h2>
            <button className="flex items-center gap-0.5 text-[12px] font-semibold text-[#869b18] hover:text-[#9bb71a] lg:hidden">
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Latest Shipment Card */}
          <div className="space-y-2 lg:hidden">
            {shipments.slice(0, 3).map((ship) => (
              <div key={ship.shipmentId} className="flex items-center gap-3 rounded-[18px] border border-[rgba(255,255,255,0.8)] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,1)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f4db] text-[#697d10] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <ActivitySquare className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-black text-[var(--td-text-strong)]">{ship.trackingNo}</p>
                    <div className="flex items-center gap-1.5 rounded-full border border-[rgba(22,163,74,0.1)] bg-[#f0fdf4] px-2 py-0.5 text-[9px] font-bold text-[#166534]">
                      <span className="h-1 w-1 rounded-full bg-[#16a34a]" /> {ship.status === 'RECEIVED' ? 'รับแล้ว' : 'รอรับ'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] font-medium text-[var(--td-text-muted)] line-clamp-1">{ship.customerName}</p>
                    <span className="text-[10px] text-[var(--td-text-muted)]">•</span>
                    <p className="text-[11px] font-medium text-[var(--td-text-muted)] line-clamp-1">{ship.customerNote || 'ไม่มีหมายเหตุ'}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#ccc]" />
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <ShipmentTable shipments={shipments.slice(0, 5)} />
          </div>
        </div>

        {/* Compact Filter Bar (Mobile) */}
        <div className="flex items-center gap-2 pt-2 lg:hidden">
          <button className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white text-[13px] font-bold text-[var(--td-text-strong)] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
            <Filter className="h-[18px] w-[18px]" /> ตัวกรอง
          </button>
          <button className="flex h-[44px] flex-1 items-center justify-between rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white px-4 text-[13px] font-bold text-[var(--td-text-strong)] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-[18px] w-[18px]" /> เลือกวันที่
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--td-text-muted)]" />
          </button>
        </div>

      </div>
    </AppShell>
  )
}


