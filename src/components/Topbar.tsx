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
  /** When true the topbar is hidden on mobile (lg:block) — page provides its own hero card */
  hideOnMobile?: boolean
}

export function Topbar({ session, title, subtitle, onSignOut, compact = false, hideOnMobile = false }: TopbarProps) {
  return (
    <header className={motion.entrance + ' trackdocs-card trackdocs-card-strong rounded-[24px] sm:rounded-[34px] px-6 py-6 sm:px-8 sm:py-8' + (hideOnMobile ? ' hidden lg:block' : '')}>
      <div className="flex flex-col gap-4 lg:gap-6 xl:flex-row xl:items-end xl:justify-between">
        
        {/* Title & Subtitle */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="trackdocs-text-badge hidden items-center gap-2 text-[var(--td-text-muted)] xl:flex">
              <Menu className="h-4 w-4" />
              TrackDocs
            </div>
            <div className="trackdocs-proof-stamp inline-flex px-3.5 py-1.5 text-[var(--td-text-muted)]">
              <span className="trackdocs-proof-stamp-dot bg-gradient-to-r from-[var(--td-accent-cyan)] to-[#9cc8d8]" />
              Workspace overview
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[26px] font-black leading-tight tracking-tight text-[var(--td-text-strong)] lg:trackdocs-text-page-title lg:trackdocs-balance lg:max-w-4xl lg:text-[clamp(2.1rem,3.4vw,3.6rem)]">
              {title}
            </h1>
            {/* Mobile Actions (Date + Logout) */}
            <div className="flex items-center gap-2 lg:hidden mt-1">
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2.5 py-1.5 text-[10.5px] font-[700] text-[var(--td-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--td-text-muted)]" />
                {format(new Date(), 'd MMM yy')}
              </div>
              {session.role !== 'customer' && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e11d48] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(225,29,72,0.3)] transition-transform active:scale-95 hover:bg-[#be123c]"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              )}
            </div>
          </div>
          
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-relaxed text-[var(--td-text-muted)] lg:mt-0 lg:line-clamp-none lg:trackdocs-text-body lg:max-w-3xl lg:text-[1rem] sm:text-[1.02rem]">
              {subtitle}
            </p>
          ) : null}
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
