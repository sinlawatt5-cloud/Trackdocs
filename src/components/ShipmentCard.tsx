import { ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'
import type { Shipment } from '../types'
import { motion } from '../lib/motion'

interface ShipmentCardProps {
  shipment: Shipment
}

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  return (
    <article className={motion.card + ' trackdocs-card trackdocs-card-strong trackdocs-signal-panel trackdocs-card-module flex min-h-[390px] flex-col p-6 sm:p-7'}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="trackdocs-proof-stamp px-3 py-1.5 text-[var(--td-text-muted)]">
            <span className="trackdocs-proof-stamp-dot" aria-hidden="true" />
            {shipment.customerCode}
          </span>
          <div>
            <p className="trackdocs-text-caption">tracking no</p>
            <h3 className="trackdocs-text-section-title mt-2 sm:text-[2.2rem]">
              {shipment.trackingNo}
            </h3>
            <p className="trackdocs-text-body mt-2">{shipment.customerName}</p>
          </div>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="trackdocs-route-line mt-5" aria-hidden="true" />

      <div className="mt-5 rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.74)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
        <p className="trackdocs-text-caption">Customer note</p>
        <p className="trackdocs-text-body-strong mt-3 line-clamp-4">
          {shipment.customerNote || 'ไม่มีหมายเหตุ'}
        </p>
      </div>

      <div className="trackdocs-card-divider mt-6 pt-4" />

      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="trackdocs-text-helper">
          Updated {format(new Date(shipment.updatedAt), 'dd MMM HH:mm')}
        </div>
        <Link to={`/shipments/${shipment.shipmentId}`} state={{ shipment }} className="trackdocs-module-action">
          ดูรายละเอียด
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
