import { Activity, Box, CircleCheckBig, Hourglass, RadioTower } from 'lucide-react'
import { cn } from '../lib/cn'
import type { DashboardStat } from '../types'

interface StatCardProps extends DashboardStat {
  trend?: string
  compact?: boolean
}

const badgeIconMap: Record<DashboardStat['tone'], typeof Activity> = {
  cyan: Activity,
  amber: Hourglass,
  green: CircleCheckBig,
  red: RadioTower,
  slate: RadioTower,
}

const toneMap: Record<DashboardStat['tone'], string> = {
  cyan: 'border-[rgba(43,199,232,0.16)]',
  amber: 'border-[rgba(241,179,74,0.18)]',
  green: 'border-[rgba(53,201,126,0.18)]',
  red: 'border-[rgba(231,153,153,0.18)]',
  slate: 'border-[rgba(15,23,42,0.08)]',
}

const iconMap: Record<DashboardStat['tone'], typeof Box> = {
  cyan: Box,
  amber: Hourglass,
  green: CircleCheckBig,
  red: RadioTower,
  slate: RadioTower,
}

const stampToneMap: Record<DashboardStat['tone'], string> = {
  cyan: 'border-[rgba(43,199,232,0.28)] bg-[rgba(236,251,255,0.96)] text-[#109ec2]',
  amber: 'border-[rgba(241,179,74,0.28)] bg-[rgba(255,248,236,0.96)] text-[#d88611]',
  green: 'border-[rgba(53,201,126,0.28)] bg-[rgba(240,255,246,0.96)] text-[#1fa45f]',
  red: 'border-[rgba(231,153,153,0.28)] bg-[rgba(255,240,240,0.96)] text-[#c93f3f]',
  slate: 'border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,251,0.94)] text-[var(--td-text-muted)]',
}

export function StatCard({ label, value, description, tone, trend, compact = false }: StatCardProps) {
  const BadgeIcon = badgeIconMap[tone]
  const Icon = iconMap[tone]

  return (
    <div
      className={cn(
        'trackdocs-card trackdocs-card-strong trackdocs-signal-panel flex flex-col self-stretch',
        compact ? 'min-h-[140px] rounded-[20px] p-4 lg:p-5' : 'min-h-[276px] rounded-[30px] p-7 sm:p-8',
        toneMap[tone],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="trackdocs-proof-stamp gap-2 px-3 py-1.5 text-[var(--td-text-muted)] rounded-full border border-[rgba(255,255,255,0.6)] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(248,245,239,0.7))] shadow-[inset_1px_1px_0_rgba(255,255,255,0.9),2px_2px_6px_rgba(0,0,0,0.03)]">
          <span
            className={cn(
              'inline-flex h-4 w-4 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,1),rgba(245,245,245,0.9))] shadow-[1px_1px_3px_rgba(0,0,0,0.05)]',
              tone === 'cyan' && 'text-[#148fb2]',
              tone === 'amber' && 'text-[#b46d05]',
              tone === 'green' && 'text-[#188854]',
              tone === 'red' && 'text-[#ba3a3a]',
              tone === 'slate' && 'text-[var(--td-text-muted)]',
            )}
            aria-hidden="true"
          >
            <BadgeIcon className="h-3 w-3" strokeWidth={2.6} />
          </span>
          {label}
        </span>
        <span className="trackdocs-text-badge rounded-full border border-[rgba(255,255,255,0.8)] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(248,245,239,0.8))] px-3 py-1 text-[var(--td-text-muted)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.9),1px_2px_4px_rgba(0,0,0,0.03)]">
          {trend ?? 'LIVE'}
        </span>
      </div>

      <div className={cn('grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-5', compact ? 'mt-3' : 'mt-8')}>
        <div className="min-w-0">
          <p className={cn('trackdocs-text-metric leading-none', compact ? 'text-[clamp(2.2rem,2.5vw,2.8rem)]' : 'text-[clamp(3.2rem,4.3vw,4.5rem)]')}>
            {value}
          </p>
          <p className={cn('trackdocs-text-body max-w-[18rem]', compact ? 'mt-2 text-[0.85rem]' : 'mt-4')}>{description}</p>
        </div>
        <div className={cn('flex items-center justify-center self-start rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]', compact ? '-mt-2 h-[4rem] w-[4rem]' : '-mt-1 h-[4.5rem] w-[4.5rem]', stampToneMap[tone])}>
          <div className={cn('flex items-center justify-center rounded-full border border-current/15 bg-white/72', compact ? 'h-11 w-11' : 'h-12 w-12')}>
            <Icon className={cn(compact ? 'h-5 w-5' : 'h-6 w-6')} strokeWidth={2.5} />
          </div>
        </div>
      </div>

    </div>
  )
}
