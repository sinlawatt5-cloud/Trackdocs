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
  compact?: boolean
}

export function Topbar({ session, title, subtitle, onSignOut, compact = false }: TopbarProps) {
  return (
    <header className={motion.entrance + ' lg:trackdocs-card lg:trackdocs-card-strong lg:rounded-[34px] lg:px-8 lg:py-8'}>
      <div className="flex flex-col gap-4 lg:gap-6 xl:flex-row xl:items-end xl:justify-between">
        
        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1.5 lg:gap-5">
          <div className="trackdocs-text-badge hidden items-center gap-2 text-[var(--td-text-muted)] xl:flex">
            <Menu className="h-4 w-4" />
            TrackDocs
          </div>
          
          <h1 className="text-[32px] font-black leading-tight tracking-tight text-[var(--td-text-strong)] lg:trackdocs-text-page-title lg:trackdocs-balance lg:max-w-4xl lg:text-[clamp(2.1rem,3.4vw,3.6rem)]">
            {title}
          </h1>
          
          <div className="mt-1 flex items-center justify-between lg:mt-0 lg:justify-start">
            {subtitle ? (
              <p className="text-[12px] font-medium leading-relaxed text-[var(--td-text-muted)] lg:trackdocs-text-body lg:max-w-3xl lg:text-[1rem] sm:text-[1.02rem]">
                {subtitle}
              </p>
            ) : null}
            {/* Mobile Date Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-[rgba(255,255,255,0.7)] px-2.5 py-1 text-[11px] font-medium text-[var(--td-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:hidden">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--td-text-muted)]" />
              {format(new Date(), 'E, dd MMM yyyy')}
            </div>
          </div>
        </div>

        {/* Action Pills - Desktop only (Mobile will have its own action row below) */}
        <div className="hidden flex-wrap items-center gap-3 lg:flex xl:justify-end">
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
            className={
              compact
                ? 'inline-flex items-center gap-2 rounded-full bg-[#e11d48] text-white px-3.5 py-2 text-[0.85rem] font-bold shadow-[0_4px_14px_rgba(225,29,72,0.3)] transition-transform hover:scale-105 hover:bg-[#be123c]'
                : 'inline-flex items-center gap-2 rounded-full bg-[#e11d48] text-white px-4 py-2.5 text-sm font-bold shadow-[0_4px_14px_rgba(225,29,72,0.3)] transition-transform hover:scale-105 hover:bg-[#be123c]'
            }
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
