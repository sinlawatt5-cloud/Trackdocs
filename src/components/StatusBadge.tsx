import { cn } from '../lib/cn'
import { motion } from '../lib/motion'
import type { ShipmentStatus } from '../types'

interface StatusBadgeProps {
  status?: ShipmentStatus
  label?: string
  tone?: 'cyan' | 'amber' | 'green' | 'red' | 'slate'
}

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  cyan: 'border-[rgba(215,234,73,0.32)] bg-[rgba(247,250,225,0.98)] text-[#69740d]',
  amber: 'border-[rgba(241,179,74,0.3)] bg-[rgba(255,247,231,0.98)] text-[#8b5c00]',
  green: 'border-[rgba(53,201,126,0.3)] bg-[rgba(232,251,241,0.98)] text-[#0f6f46]',
  red: 'border-[rgba(231,153,153,0.38)] bg-[rgba(255,242,242,0.98)] text-[#8c3131]',
  slate: 'border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.96)] text-[var(--td-text-muted)]',
}

export function StatusBadge({ status, label, tone = 'slate' }: StatusBadgeProps) {
  const resolvedLabel = label ?? (status === 'RECEIVED' ? 'RECEIVED' : 'PENDING')
  const resolvedTone =
    status === 'RECEIVED' ? 'green' : status === 'NOT_RECEIVED' ? 'amber' : tone

  return (
    <span
      className={cn(
        motion.status,
        'trackdocs-proof-stamp px-3 py-1.5',
        toneClasses[resolvedTone],
      )}
    >
      <span className="trackdocs-proof-stamp-dot trackdocs-status-dot" aria-hidden="true" />
      {resolvedLabel}
    </span>
  )
}
