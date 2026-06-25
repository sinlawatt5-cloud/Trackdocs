import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { ShipmentTable } from '../../components/ShipmentTable'
import { StatCard } from '../../components/StatCard'
import { useAuth } from '../../auth/useAuth'
import { listShipmentsForRole } from '../../lib/firestore'
import type { Shipment } from '../../types'

export function AdminDashboardPage() {
  const { session } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    if (!session) {
      return
    }

    setLoading(true)
    listShipmentsForRole({ role: session.role, limitCount: 50 })
      .then((shipmentList) => {
        if (!mounted) return
        setShipments(shipmentList)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [session])

  const stats = useMemo(() => {
    const pending = shipments.filter((shipment) => shipment.status === 'NOT_RECEIVED').length
    const received = shipments.filter((shipment) => shipment.status === 'RECEIVED').length

    return [
      {
        label: 'All shipments',
        value: String(shipments.length),
        tone: 'cyan' as const,
        description: 'Visible across every company',
      },
      {
        label: 'Pending',
        value: String(pending),
        tone: 'amber' as const,
        description: 'Needs operation acknowledgement',
      },
      {
        label: 'Received',
        value: String(received),
        tone: 'green' as const,
        description: 'Completed proof trail',
      },
    ]
  }, [shipments])

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <AppShell title="Admin dashboard" subtitle="Oversee customers, users, and shipment health at a glance.">
        <LoadingState />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Admin dashboard" subtitle="Oversee customers, users, and shipment health at a glance.">
        <ErrorState message={error} />
      </AppShell>
    )
  }

  return (
    <AppShell
      title="ศูนย์ควบคุมระบบ"
      subtitle="ดูภาพรวมลูกค้า ผู้ใช้งาน และรายงานล่าสุด พร้อมควบคุมสิทธิ์โดยไม่เปิดเผยข้อมูลเกินจำเป็น"
      density="compact"
      actions={
        <>
          <div>
            <p className="trackdocs-text-body-strong text-[1.15rem]">System control room</p>
            <p className="trackdocs-text-helper mt-1">
              ใช้ข้อมูลล่าสุด 50 รายการเพื่อให้หน้า admin อ่านง่ายและปลอดภัยกับ query
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/customers"
              className="trackdocs-button-secondary rounded-full px-4 py-2 trackdocs-text-badge"
            >
              Customers
            </Link>
            <Link
              to="/admin/users"
              className="trackdocs-button-secondary rounded-full px-4 py-2 trackdocs-text-badge"
            >
              Users
            </Link>
            <Link
              to="/admin/reports"
              className="trackdocs-button-primary rounded-full px-4 py-2 trackdocs-text-badge"
            >
              Reports
            </Link>
          </div>
        </>
      }
    >
      <div className="trackdocs-page-entrance space-y-4">
        <div className="trackdocs-stagger-list grid items-start gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="trackdocs-entrance">
          <h2 className="mb-4 text-lg font-semibold text-[var(--td-text-strong)]">Recent shipments</h2>
          <ShipmentTable shipments={shipments.slice(0, 5)} />
        </div>
      </div>
    </AppShell>
  )
}

