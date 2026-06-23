import { RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { motion } from '../lib/motion'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Card tone="glass" padding="lg" className={motion.card + ' trackdocs-signal-panel trackdocs-card-module flex min-h-[360px] flex-col text-center'}>
      <div className="trackdocs-text-badge mx-auto inline-flex items-center rounded-full border border-[rgba(220,62,62,0.22)] bg-[rgba(255,243,244,0.96)] px-3 py-1 text-[#c94040]">
        <span className="trackdocs-proof-stamp-dot bg-[#c94040] shadow-[0_0_0_4px_rgba(201,64,64,0.14)]" aria-hidden="true" />
        ERROR
      </div>

      <div className={motion.status + ' mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(220,62,62,0.18)] bg-[rgba(255,243,244,0.94)] text-[#c94040] shadow-[0_18px_30px_rgba(220,62,62,0.08)]'}>
        <span className="h-5 w-5 rounded-full border border-current" aria-hidden="true" />
      </div>

      <h3 className="trackdocs-text-section-title mt-7 text-[1.75rem]">{title}</h3>
      <p className="trackdocs-text-body mx-auto mt-3 max-w-2xl">{message}</p>

      <div className="trackdocs-route-line mx-auto mt-8 w-full max-w-md" aria-hidden="true" />
      {onRetry ? (
        <Button type="button" tone="slate" onClick={onRetry} className="trackdocs-text-ui mt-auto inline-flex items-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </Card>
  )
}
