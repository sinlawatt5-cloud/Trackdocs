import { format } from 'date-fns'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'
import type { Shipment } from '../types'
import { motion } from '../lib/motion'

interface ShipmentTableProps {
  shipments: Shipment[]
  onReceive?: (shipment: Shipment) => void
}

function formatDateLabel(value: string) {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return format(parsed, 'dd MMM yyyy')
}

export function ShipmentTable({ shipments, onReceive }: ShipmentTableProps) {
  return (
    <div className={motion.card + ' trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-card-module overflow-hidden rounded-[32px]'}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(15,23,42,0.08)] px-6 py-6">
        <div className="space-y-2">
          <div className="trackdocs-card-badge px-3 py-1.5 text-[var(--td-text-muted)]">
            <span className="trackdocs-card-badge-dot" />
            RECENT SHIPMENTS
          </div>
          <div>
            <p className="trackdocs-text-section-title">รายการจัดส่งล่าสุด</p>
            <p className="trackdocs-text-body mt-1">อัปเดตล่าสุดเพื่อให้ทีมตรวจสอบและติดตามสถานะได้ต่อเนื่อง</p>
          </div>
        </div>
        <div className="trackdocs-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 trackdocs-text-badge">
          {shipments.length} records
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="trackdocs-table min-w-full">
          <thead className="bg-[rgba(249,247,241,0.96)]">
            <tr>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Tracking</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Customer code</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Customer name</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Sent date</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Envelope count</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Customer note</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-left">Status</th>
              <th className="trackdocs-text-table-head px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="trackdocs-stagger-list divide-y divide-[rgba(17,17,17,0.08)]">
            {shipments.map((shipment) => (
              <tr key={shipment.shipmentId} className="transition hover:bg-[rgba(248,246,239,0.92)]">
                <td className="px-5 py-4 align-top">
                  <div>
                    <p className="trackdocs-text-body-strong">{shipment.trackingNo}</p>
                    <p className="trackdocs-text-caption mt-1 text-[var(--td-text-muted)]">Shipment ID</p>
                  </div>
                </td>
                <td className="px-5 py-4 trackdocs-text-body-strong whitespace-nowrap">{shipment.customerCode}</td>
                <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-strong)]">
                  <div className="min-w-[180px]">
                    <p className="trackdocs-text-body-strong">{shipment.customerName}</p>
                    <p className="trackdocs-text-caption mt-1 text-[var(--td-text-muted)]">รหัสลูกค้า {shipment.customerId}</p>
                  </div>
                </td>
                <td className="px-5 py-4 trackdocs-text-body whitespace-nowrap">{formatDateLabel(shipment.sentDate)}</td>
                <td className="px-5 py-4 trackdocs-text-body-strong whitespace-nowrap">{shipment.envelopeCount}</td>
                <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">
                  <div className="max-w-[320px] whitespace-pre-wrap break-words leading-6">
                    {shipment.customerNote || '—'}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    status={shipment.status}
                    label={shipment.status === 'RECEIVED' ? 'รับแล้ว' : 'ยังไม่ได้รับ'}
                    tone={shipment.status === 'RECEIVED' ? 'green' : 'amber'}
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {onReceive && shipment.status === 'NOT_RECEIVED' ? (
                      <button
                        type="button"
                        onClick={() => onReceive(shipment)}
                        className="inline-flex items-center gap-2 rounded-full trackdocs-button-primary px-4 py-2 trackdocs-text-badge shadow-[0_14px_28px_rgba(215,234,73,0.22)] transition hover:-translate-y-0.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        รับแล้ว
                      </button>
                    ) : null}
                    <Link
                      to={`/shipments/${shipment.shipmentId}`}
                      state={{ shipment }}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.1)] bg-white px-4 py-2 trackdocs-text-body-strong transition hover:bg-[rgba(247,250,225,0.9)]"
                    >
                      ดูรายละเอียด
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
