import { CalendarDays, Hash, User2, PhoneCall, MessageSquare, ImageIcon, CheckCircle2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { resolveImageUrl } from '../lib/r2Upload'
import type { Shipment } from '../types'

// ─── shadow token matching the reference ──────────────────────────────────────
const cardShadow = 'shadow-[6px_7px_0_rgba(15,23,42,0.13),0_10px_24px_rgba(15,23,42,0.07)]'
const cardBase =
  `bg-white rounded-[26px] border border-[rgba(15,23,42,0.07)] ${cardShadow} p-5`

// ─── helper: safe date format ─────────────────────────────────────────────────
function safeFmt(value: string | null | undefined, pattern: string, fallback = '—') {
  if (!value) return fallback
  try {
    return format(new Date(value), pattern)
  } catch {
    return fallback
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

/** Tiny all-caps section badge pill */
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(247,248,250,0.96)] px-3 py-1.5 text-[10.5px] font-[800] uppercase tracking-[0.1em] text-[var(--td-text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[rgba(15,23,42,0.28)]" />
      {children}
    </div>
  )
}

/** Info cell used inside the grid */
function InfoCell({
  icon: Icon,
  label,
  value,
  iconColorClass = 'text-[var(--td-text-muted)]',
  className = '',
}: {
  icon: React.ElementType
  label: string
  value: string
  iconColorClass?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 py-3.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--td-text-muted)]">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`} />
        {label}
      </div>
      <p className="truncate text-[14.5px] font-[700] leading-snug text-[var(--td-text-strong)]">
        {value || '—'}
      </p>
    </div>
  )
}

/** Proof image frame */
function ProofFrame({
  src,
  label,
  onTap,
}: {
  src: string
  label: string
  onTap?: () => void
}) {
  const inner = (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(241,245,249,0.7)] p-2 shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-transform duration-200 active:scale-[0.97]">
        <div className="relative overflow-hidden rounded-[12px] bg-[rgba(247,249,252,1)] aspect-[4/3] flex items-center justify-center">
          {src ? (
            <img
              src={src}
              alt={label}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="h-7 w-7 text-[rgba(15,23,42,0.18)]" />
          )}
          {/* Inset Shadow Overlay */}
          <div className="absolute inset-0 rounded-[12px] shadow-[inset_0_4px_12px_rgba(15,23,42,0.12),inset_0_1px_3px_rgba(15,23,42,0.08)] pointer-events-none" />
          {/* Inner Border */}
          <div className="absolute inset-0 rounded-[12px] border border-[rgba(15,23,42,0.1)] pointer-events-none" />
        </div>
      </div>
      <p className="text-center text-[12px] font-[800] tracking-wide text-[var(--td-text-strong)] opacity-80">{label}</p>
    </div>
  )

  if (src && onTap) {
    return (
      <button type="button" onClick={onTap} className="block text-left w-full">
        {inner}
      </button>
    )
  }
  return <div>{inner}</div>
}

/** Single timeline row */
function TimelineRow({
  event,
  datetime,
  by,
  isLast = false,
}: {
  event: string
  datetime: string
  by: string
  isLast?: boolean
}) {
  return (
    <div className="flex gap-3">
      {/* dot + line */}
      <div className="flex flex-col items-center">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d9f127] shadow-[0_2px_6px_rgba(217,241,39,0.45)]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#171c01] stroke-[2.5px]" />
        </div>
        {!isLast && (
          <div className="mt-1 w-[1.5px] flex-1 bg-[rgba(217,241,39,0.4)] rounded-full" />
        )}
      </div>
      {/* text */}
      <div className={`flex flex-col pb-${isLast ? '0' : '5'}`}>
        <p className="text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--td-text-muted)]">
          {event}
        </p>
        <p className="mt-1 text-[14.5px] font-[700] text-[var(--td-text-strong)]">{datetime}</p>
        <p className="mt-0.5 text-[12.5px] font-[600] text-[var(--td-text-muted)]">{by}</p>
      </div>
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

interface MobileShipmentDetailProps {
  shipment: Shipment
  onPreviewImage?: (payload: { src: string; alt: string; label: string }) => void
  onBack?: () => void
}

export function MobileShipmentDetail({ shipment, onPreviewImage, onBack }: MobileShipmentDetailProps) {
  const navigate = useNavigate()
  const envelopeUrl = resolveImageUrl(shipment.envelopeImageUrl)
  const receiptUrl  = resolveImageUrl(shipment.receiptImageUrl)

  const isReceived = shipment.status === 'RECEIVED'

  return (
    <div className="lg:hidden flex flex-col gap-4 pb-20">

      {/* ── Card 1: Page Hero ──────────────────────────────────────────────── */}
      <div className={cardBase + ' flex flex-col gap-2'} style={{ animation: 'trackdocs-fade-stat 580ms var(--ease-premium) both', animationDelay: '0ms' }}>
        <SectionBadge>Workspace overview</SectionBadge>
        <div className="flex items-start justify-between gap-3 mt-1">
          <h1 className="text-[24px] font-[900] leading-tight tracking-tight text-[var(--td-text-strong)] uppercase">
            Shipment Detail
          </h1>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'instant' })
              if (onBack) {
                onBack()
              } else {
                setTimeout(() => navigate(-1), 10)
              }
            }}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#d7fc45] border border-[rgba(0,0,0,0.12)] px-3 py-1.5 text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--td-text-strong)] mt-0.5 transition-transform active:scale-95 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
        <p className="text-[13px] font-[500] leading-relaxed text-[var(--td-text-muted)]">
          Review the proof trail, customer note, uploaded images, and handoff status.
        </p>
      </div>

      {/* ── Card 2: Shipment Summary ──────────────────────────────────────── */}
      <div className={cardBase + ' flex flex-col gap-3'} style={{ animation: 'trackdocs-fade-stat 580ms var(--ease-premium) both', animationDelay: '200ms' }}>
        {/* top row: badge + status chip */}
        <div className="flex items-center justify-between gap-2">
          <SectionBadge>Shipment detail</SectionBadge>
          {/* status chip */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-[800] uppercase tracking-[0.08em] ${
              isReceived
                ? 'border-[rgba(53,201,126,0.3)] bg-[rgba(232,251,241,0.98)] text-[#0f6f46]'
                : 'border-[rgba(241,179,74,0.3)] bg-[rgba(255,247,231,0.98)] text-[#8b5c00]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isReceived ? 'bg-[#22c55e]' : 'bg-[#f59e0b] animate-pulse'
              }`}
            />
            {isReceived ? 'Received' : 'Pending'}
          </div>
        </div>

        {/* tracking no */}
        <div>
          <p className="text-[27px] font-[900] leading-none tracking-tight text-[var(--td-text-strong)]">
            {shipment.trackingNo}
          </p>
        </div>

        {/* info grid */}
        <div className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.12)] bg-[rgba(248,250,251,0.7)]">
          {/* row 1: 3 cols */}
          <div className="grid grid-cols-3 divide-x divide-[rgba(15,23,42,0.08)]">
            <InfoCell icon={Hash} iconColorClass="text-blue-500" label="ลูกค้า" value={shipment.customerCode} className="px-3" />
            <InfoCell icon={User2} iconColorClass="text-violet-500" label="ผู้ส่ง" value={shipment.senderName} className="px-3" />
            <InfoCell icon={PhoneCall} iconColorClass="text-emerald-500" label="เบอร์โทร" value={shipment.senderPhone || '—'} className="px-3" />
          </div>
          {/* divider */}
          <div className="h-px bg-[rgba(15,23,42,0.08)]" />
          {/* row 2: 2 cols */}
          <div className="grid grid-cols-2 divide-x divide-[rgba(15,23,42,0.08)]">
            <InfoCell
              icon={CalendarDays}
              iconColorClass="text-orange-500"
              label="วันที่ส่ง"
              value={safeFmt(shipment.sentDate, 'dd MMM yyyy')}
              className="px-3"
            />
            <InfoCell
              icon={MessageSquare}
              iconColorClass="text-amber-500"
              label="หมายเหตุ"
              value={shipment.customerNote || '—'}
              className="px-3"
            />
          </div>
        </div>
      </div>

      {/* ── Card 3: Uploaded Photo ────────────────────────────────────────── */}
      <div className={cardBase + ' flex flex-col gap-4'} style={{ animation: 'trackdocs-fade-stat 580ms var(--ease-premium) both', animationDelay: '400ms' }}>
        {/* header */}
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-violet-500" />
          <span className="text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--td-text-muted)]">
            Uploaded photo
          </span>
        </div>

        {/* 2-col image grid */}
        <div className="grid grid-cols-2 gap-3">
          <ProofFrame
            src={envelopeUrl}
            label="Envelope photo"
            onTap={
              envelopeUrl && onPreviewImage
                ? () => onPreviewImage({ src: envelopeUrl, alt: 'Envelope photo', label: 'Envelope photo' })
                : undefined
            }
          />
          <ProofFrame
            src={receiptUrl}
            label="Receipt photo"
            onTap={
              receiptUrl && onPreviewImage
                ? () => onPreviewImage({ src: receiptUrl, alt: 'Receipt photo', label: 'Receipt photo' })
                : undefined
            }
          />
        </div>
      </div>

      {/* ── Card 4: Timeline ──────────────────────────────────────────────── */}
      <div className={cardBase + ' flex flex-col gap-4'} style={{ animation: 'trackdocs-fade-stat 580ms var(--ease-premium) both', animationDelay: '600ms' }}>
        <TimelineRow
          event="Created"
          datetime={safeFmt(shipment.createdAt, 'dd MMM yyyy HH:mm')}
          by={`By ${shipment.createdByName || '—'}`}
        />
        <TimelineRow
          event="Received"
          datetime={
            shipment.receivedAt
              ? safeFmt(shipment.receivedAt, 'dd MMM yyyy HH:mm')
              : 'Pending'
          }
          by={shipment.receivedByName ? `By ${shipment.receivedByName}` : 'Waiting for operation'}
          isLast
        />
      </div>

    </div>
  )
}
