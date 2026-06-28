import { CalendarDays, Hash, MapPin, PhoneCall, User2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { ImagePreview } from './ImagePreview'
import { StatusBadge } from './StatusBadge'
import type { Shipment } from '../types'
import { motion } from '../lib/motion'
import { resolveImageUrl } from '../lib/r2Upload'

interface ShipmentDetailPanelProps {
  shipment: Shipment
  onPreviewImage?: (payload: { src: string; alt: string; label: string }) => void
}

export function ShipmentDetailPanel({ shipment, onPreviewImage }: ShipmentDetailPanelProps) {
  return (
    <div className="trackdocs-stagger-list space-y-6">
      <div className={motion.card + ' trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-signal-panel trackdocs-card-module p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="trackdocs-proof-stamp px-3 py-1.5 text-[var(--td-text-muted)]">
              <span className="trackdocs-proof-stamp-dot" />
              SHIPMENT DETAIL
            </div>
            <h1 className="trackdocs-text-page-title mt-2">
              {shipment.trackingNo}
            </h1>
            <p className="trackdocs-text-body mt-2">{shipment.customerName}</p>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem icon={<Hash className="h-4 w-4" />} label="Customer code" value={shipment.customerCode} />
          <DetailItem icon={<User2 className="h-4 w-4" />} label="Sender" value={shipment.senderName} />
          <DetailItem icon={<PhoneCall className="h-4 w-4" />} label="Phone" value={shipment.senderPhone} />
          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Sent date"
            value={format(new Date(shipment.sentDate), 'dd MMM yyyy')}
          />
        </div>

        <div className="mt-6 rounded-[26px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,245,238,0.96))] p-5">
          <div className="trackdocs-text-body-strong flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--td-primary)]" />
            Customer note
          </div>
          <p className="trackdocs-text-body mt-3">{shipment.customerNote}</p>
        </div>
      </div>

      <div className="trackdocs-stagger-list grid gap-6 lg:grid-cols-3">
        <PreviewTile
          src={resolveImageUrl(shipment.envelopeImageUrl)}
          alt="Envelope image"
          label="Envelope image"
          className="lg:col-span-1"
          onPreview={onPreviewImage}
        />
        <PreviewTile
          src={resolveImageUrl(shipment.receiptImageUrl)}
          alt="Receipt image"
          label="Receipt image"
          className="lg:col-span-1"
          onPreview={onPreviewImage}
        />
        {shipment.receivedImageUrl ? (
          <PreviewTile
            src={resolveImageUrl(shipment.receivedImageUrl)}
            alt="Received image"
            label="Received image"
            className="lg:col-span-1"
            onPreview={onPreviewImage}
          />
        ) : null}
      </div>

      <div className="trackdocs-stagger-list grid gap-6 xl:grid-cols-3">
        <InfoPanel
          title="Created"
          value={format(new Date(shipment.createdAt), 'dd MMM yyyy HH:mm')}
          description={`By ${shipment.createdByName}`}
        />
        <InfoPanel
          title="Received"
          value={shipment.receivedAt ? format(new Date(shipment.receivedAt), 'dd MMM yyyy HH:mm') : 'Pending'}
          description={shipment.receivedByName || 'Waiting for operation'}
        />
        <InfoPanel
          title="Operation note"
          value={shipment.operationReceiveNote || 'No operation note yet'}
          description="Receive comments and proof"
        />
      </div>
    </div>
  )
}

function PreviewTile({
  src,
  alt,
  label,
  className,
  onPreview,
}: {
  src?: string
  alt: string
  label: string
  className?: string
  onPreview?: (payload: { src: string; alt: string; label: string }) => void
}) {
  if (src && onPreview) {
    return (
      <button
        type="button"
        onClick={() => onPreview({ src, alt, label })}
        className="trackdocs-cursor-zoom-in group block text-left transition hover:-translate-y-0.5"
      >
        <ImagePreview src={src} alt={alt} label={label} className={className} />
      </button>
    )
  }

  return <ImagePreview src={src} alt={alt} label={label} className={className} />
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className={motion.entrance + ' trackdocs-card-inner rounded-[22px] p-4'}>
      <div className="trackdocs-text-table-head flex items-center gap-2">
        {icon}
        {label}
      </div>
      <p className="trackdocs-text-body-strong mt-3">{value}</p>
    </div>
  )
}

function InfoPanel({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className={motion.card + ' trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-signal-panel trackdocs-card-module flex min-h-[220px] flex-col justify-between p-5'}>
      <p className="trackdocs-text-table-head">{title}</p>
      <p className="trackdocs-text-section-title mt-3 text-[1.25rem]">{value}</p>
      <p className="trackdocs-text-body mt-2">{description}</p>
    </div>
  )
}
