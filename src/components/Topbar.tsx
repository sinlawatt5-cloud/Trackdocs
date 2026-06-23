import { CalendarDays, LogOut, Menu, Sparkles, UserRound } from 'lucide-react'
import { format } from 'date-fns'
import { roleLabels } from '../lib/roles'
import type { SessionUser } from '../types'
import { motion } from '../lib/motion'

interface TopbarProps {
  session: SessionUser
  title: string
  subtitle?: string
  onSignOut: () => void
}

export function Topbar({ session, title, subtitle, onSignOut }: TopbarProps) {
  return (
    <header className={motion.card + ' trackdocs-card trackdocs-card-strong trackdocs-entrance rounded-[34px] px-6 py-6 sm:px-8 sm:py-8'}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-5">
          <div className="trackdocs-text-badge flex items-center gap-2 text-[var(--td-text-muted)] xl:hidden">
            <Menu className="h-4 w-4" />
            TrackDocs
          </div>
          <div className="trackdocs-proof-stamp inline-flex px-4 py-2 text-[var(--td-text-muted)]">
            <span className="trackdocs-proof-stamp-dot" />
            Workspace overview
          </div>
          <h1 className="trackdocs-text-page-title trackdocs-balance max-w-4xl text-[clamp(2.1rem,3.4vw,3.6rem)]">
            {title}
          </h1>
          {subtitle ? <p className="trackdocs-text-body max-w-3xl text-[1rem] sm:text-[1.02rem]">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="trackdocs-pill trackdocs-pill-soft gap-2 px-4 py-2.5 text-[var(--td-text-muted)]">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(), 'EEEE, dd MMM yyyy')}
          </div>
          <div className="trackdocs-pill gap-2 px-4 py-2.5 text-[var(--td-text-strong)]">
            <UserRound className="h-4 w-4" />
            {roleLabels[session.role]}
          </div>
          <div className="trackdocs-pill trackdocs-pill-soft gap-2 px-4 py-2.5 text-[var(--td-text-strong)]">
            <Sparkles className="h-4 w-4 text-[var(--td-accent-cyan)]" />
            {session.displayName}
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="trackdocs-button-secondary inline-flex items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
