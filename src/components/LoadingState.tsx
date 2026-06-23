import { cn } from '../lib/cn'
import { Card } from './Card'
import { motion } from '../lib/motion'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading TrackDocs' }: LoadingStateProps) {
  return (
    <Card tone="glass" padding="lg" className="trackdocs-signal-panel trackdocs-card-module overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="trackdocs-proof-stamp inline-flex px-3 py-1 text-[var(--td-text-muted)]">
          <span className="trackdocs-proof-stamp-dot" aria-hidden="true" />
          LOADING
        </div>
        <div className="trackdocs-text-body flex items-center gap-3">
          <span className="trackdocs-loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>{label}</span>
        </div>
      </div>

      <div className="mt-6 grid min-h-[42vh] gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  motion.loading,
                  'trackdocs-skeleton rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]',
                )}
              >
                <div className="trackdocs-skeleton-line h-3 w-20" />
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div className="trackdocs-skeleton-block h-10 w-20" />
                  <div className="trackdocs-skeleton-avatar h-12 w-12" />
                </div>
                <div className="trackdocs-skeleton-line mt-4 h-3 w-24" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  motion.loading,
                  'trackdocs-skeleton rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]',
                )}
              >
                <div className="trackdocs-skeleton-line h-3 w-36" />
                <div className="mt-4 space-y-2">
                  <div className="trackdocs-skeleton-line h-3 w-full" />
                  <div className="trackdocs-skeleton-line h-3 w-4/5" />
                </div>
                <div className="trackdocs-card-divider mt-4 pt-4">
                  <div className="trackdocs-skeleton-line h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(motion.loading, 'trackdocs-skeleton rounded-[30px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_16px_34px_rgba(15,23,42,0.06)]')}>
          <div className="trackdocs-skeleton-line h-3 w-28" />
          <div className="trackdocs-skeleton-line mt-3 h-4 w-48" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="trackdocs-skeleton-block h-10 rounded-[20px]" />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
