import {
  BarChart3,
  Building2,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
  Users2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'
import { roleLabels } from '../lib/roles'
import type { Role, SessionUser } from '../types'

interface SidebarProps {
  session: SessionUser
}

const navigationByRole: Record<Role, { label: string; to: string; icon: ReactNode }[]> = {
  customer: [
    { label: 'Dashboard', to: '/customer/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Create shipment', to: '/customer/create-shipment', icon: <FilePlus2 className="h-4 w-4" /> },
  ],
  operation: [
    { label: 'Dashboard', to: '/operation/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Shipments', to: '/operation/dashboard', icon: <ClipboardList className="h-4 w-4" /> },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Customers', to: '/admin/customers', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Users', to: '/admin/users', icon: <Users2 className="h-4 w-4" /> },
    { label: 'Reports', to: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
  ],
}

export function Sidebar({ session }: SidebarProps) {
  const links = navigationByRole[session.role]

  return (
    <aside className="trackdocs-sidebar flex flex-col gap-5 p-4 lg:sticky lg:top-0 lg:h-[100dvh] lg:rounded-none lg:p-5">
      <div className="trackdocs-signal-panel trackdocs-entrance rounded-[30px] border border-[var(--td-sidebar-border)] bg-[rgba(255,255,255,0.04)] p-5 text-[var(--td-sidebar-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <div className="trackdocs-brand-mark relative flex h-[46px] w-[46px] items-center justify-center text-[#172008]">
            <svg
              viewBox="0 0 48 48"
              className="absolute inset-0 h-full w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.14)]"
              aria-hidden="true"
            >
              <path
                d="M12 5H36C38.7614 5 41 7.23858 41 10V26.761C41 28.322 40.2707 29.7938 39.0292 30.7365L26.4228 40.3073C24.989 41.3962 22.9985 41.3973 21.5635 40.3099L8.95998 30.7589C7.72198 29.8202 7 28.3521 7 26.7986V10C7 7.23858 9.23858 5 12 5Z"
                fill="url(#sidebar-brand-badge-fill)"
              />
              <path
                d="M12 5H36C38.7614 5 41 7.23858 41 10V26.761C41 28.322 40.2707 29.7938 39.0292 30.7365L26.4228 40.3073C24.989 41.3962 22.9985 41.3973 21.5635 40.3099L8.95998 30.7589C7.72198 29.8202 7 28.3521 7 26.7986V10C7 7.23858 9.23858 5 12 5Z"
                fill="none"
                stroke="rgba(23,32,8,0.1)"
                strokeWidth="0.9"
              />
              <defs>
                <linearGradient id="sidebar-brand-badge-fill" x1="7" y1="5" x2="41" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E3F55B" />
                  <stop offset="56%" stopColor="#D7EA49" />
                  <stop offset="100%" stopColor="#BED52B" />
                </linearGradient>
              </defs>
            </svg>
            <ShieldCheck className="relative z-[1] h-[18px] w-[18px] stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="trackdocs-brand-title text-[1.45rem] uppercase tracking-[0.08em] text-[var(--td-sidebar-text)]">
              TRACKDOCS
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] px-4 py-3.5">
          <p className="trackdocs-sidebar-label">
            Signed in as
          </p>
          <p className="mt-2 trackdocs-sidebar-nav text-white">{session.displayName}</p>
          <p className="mt-1 trackdocs-sidebar-body text-[var(--td-sidebar-muted)]">{roleLabels[session.role]}</p>
        </div>
      </div>

      <div className="px-1">
        <p className="trackdocs-sidebar-label mb-3">Main</p>
      </div>

      <nav className="trackdocs-stagger-list flex gap-2 overflow-x-auto pb-1 lg:-mt-1 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:overflow-x-hidden">
        {links.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group ' +
                  motion.sidebarItem +
                  ' trackdocs-sidebar-nav relative min-w-max flex items-center gap-3 rounded-[22px] border px-4 py-3.5 lg:min-w-0 before:absolute before:inset-y-3 before:left-2 before:w-1 before:rounded-full before:bg-[var(--td-primary)] before:content-[\'\'] before:opacity-0 before:transition-opacity before:duration-300',
                isActive
                  ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] before:opacity-100'
                  : 'border-transparent bg-transparent text-[var(--td-sidebar-muted)] hover:border-[rgba(255,255,255,0.08)] hover:bg-white/6 hover:text-white hover:before:opacity-40',
              )
            }
          >
            <span className="text-current transition group-hover:translate-x-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-4 text-sm text-[var(--td-sidebar-muted)]">
        <div className="flex items-center gap-2">
          <span className={cn(motion.status, 'trackdocs-status-dot h-2.5 w-2.5 rounded-full bg-[var(--td-primary)] shadow-[0_0_0_4px_rgba(215,234,73,0.1)]')} />
          <p className="trackdocs-sidebar-nav text-white">Workspace status</p>
        </div>
        <p className="trackdocs-sidebar-body mt-2 leading-6">
          Status changes are only allowed for operation. Customers can create records but cannot edit received state.
        </p>
        <button
          type="button"
          className="trackdocs-button-secondary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold"
        >
          View status
        </button>
      </div>
    </aside>
  )
}
