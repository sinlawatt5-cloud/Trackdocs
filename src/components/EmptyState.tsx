import { Link } from 'react-router-dom'
import { Card } from './Card'
import { motion } from '../lib/motion'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({ title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <Card tone="glass" padding="lg" className={motion.card + ' trackdocs-signal-panel trackdocs-card-module flex min-h-[320px] flex-col rounded-[32px] text-center'}>
      <div className="trackdocs-text-badge mx-auto inline-flex items-center rounded-full border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.92)] px-3 py-1 text-[var(--td-text-muted)] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <span className="trackdocs-proof-stamp-dot" aria-hidden="true" />
        EMPTY STATE
      </div>

      <div className={motion.status + ' mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.92)] text-[var(--td-primary)] shadow-[0_18px_30px_rgba(15,23,42,0.08)]'}>
        <span className="h-5 w-5 rounded-full border border-current" aria-hidden="true" />
      </div>

      <h3 className="trackdocs-text-section-title mt-7 text-[1.75rem]">{title}</h3>
      <p className="trackdocs-text-body mx-auto mt-3 max-w-2xl">{description}</p>

      <div className="trackdocs-route-line mx-auto mt-8 w-full max-w-md" aria-hidden="true" />
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="trackdocs-button-primary mt-8 inline-flex items-center justify-center self-center rounded-[20px] px-6 py-3 text-sm font-semibold"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Card>
  )
}
