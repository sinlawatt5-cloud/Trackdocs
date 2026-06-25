import {
  BarChart3,
  Building2,
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
    <aside className="trackdocs-sidebar flex flex-col gap-6 p-4 lg:sticky lg:top-0 lg:h-[100dvh] lg:rounded-none lg:p-6 lg:pr-5">
      <div className="trackdocs-signal-panel trackdocs-entrance rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5 text-[var(--td-sidebar-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
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
        <div className="mt-5 rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.04)] px-4 py-3.5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.4)]">
            SIGNED IN AS
          </p>
          <p className="mt-1.5 text-sm font-bold text-white tracking-wide">{session.displayName}</p>
          <p className="mt-0.5 text-[0.8rem] text-[rgba(255,255,255,0.6)]">{roleLabels[session.role]}</p>
        </div>
      </div>

      <div className="px-2">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.6)]">MAIN</p>
      </div>

      <nav className="trackdocs-stagger-list flex gap-2 overflow-x-auto pb-1 lg:-mt-1 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-visible">
        {links.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group ' +
                  motion.sidebarItem +
                  ' trackdocs-sidebar-nav trackdocs-sidebar-nav-item relative min-w-max flex items-center gap-3.5 px-5 py-3 lg:min-w-0 lg:w-full',
                isActive
                  ? 'trackdocs-sidebar-nav-item--active text-[#111216] font-bold'
                  : 'trackdocs-sidebar-nav-item--inactive text-[rgba(255,255,255,0.6)] hover:text-white font-medium',
              )
            }
          >
            {({ isActive }) => (
              <>

                <span className={cn("relative z-10 flex items-center justify-center transition group-hover:translate-x-0.5", isActive ? "text-[#111216]" : "text-current")}>{item.icon}</span>
                <span className="relative z-10 text-[0.9rem] tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5 text-sm text-[var(--td-sidebar-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-2.5">
          <span className={cn(motion.status, 'trackdocs-status-dot h-2.5 w-2.5 rounded-full bg-[#D7EA49] shadow-[0_0_8px_rgba(215,234,73,0.3)]')} />
          <p className="font-bold text-white tracking-wide text-[0.9rem]">Workspace status</p>
        </div>
        <p className="mt-3 leading-relaxed text-[0.85rem] text-[rgba(255,255,255,0.6)]">
          Status changes are only allowed for operation. Customers can create records but cannot edit received state.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f4f1eb] px-4 py-2.5 text-[0.85rem] font-bold text-[#111216] transition-transform hover:scale-[0.98] hover:bg-white"
        >
          View status
        </button>
      </div>
    </aside>
  )
}
