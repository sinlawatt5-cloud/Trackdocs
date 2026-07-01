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
    { label: 'Create shipment', to: '/operation/create-shipment', icon: <FilePlus2 className="h-4 w-4" /> },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Create shipment', to: '/admin/create-shipment', icon: <FilePlus2 className="h-4 w-4" /> },
    { label: 'Customers', to: '/admin/customers', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Users', to: '/admin/users', icon: <Users2 className="h-4 w-4" /> },
    { label: 'Reports', to: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
  ],
}

export function Sidebar({ session }: SidebarProps) {
  const links = navigationByRole[session.role]

  return (
    <aside className="trackdocs-sidebar flex flex-col gap-8 p-4 lg:sticky lg:top-0 lg:h-[100dvh] lg:rounded-none lg:p-6 lg:pr-5">
      <div className="trackdocs-brand-header trackdocs-entrance overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] px-5 py-5 text-[var(--td-sidebar-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-[12px] sm:gap-[14px]">
          <div 
            className="trackdocs-brand-mark animate-fade-slide-up relative flex h-[38px] w-[38px] shrink-0 flex-none items-center justify-center text-[#172008] transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ animationDelay: '150ms', animationFillMode: 'both' }}
          >
            <svg
              viewBox="0 0 48 48"
              className="absolute inset-0 h-full w-full drop-shadow-[0_8px_16px_rgba(215,234,73,0.15)]"
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
          <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
            <h1 
              className="text-[clamp(16px,1.6vw,20px)] font-[600] uppercase tracking-wide italic whitespace-nowrap text-white leading-[1] text-ellipsis overflow-hidden"
              style={{ 
                fontFamily: '"Playfair Display", serif',
                textRendering: 'geometricPrecision'
              }}
            >
              {"TRACKDOCS".split("").map((char, index) => (
                <span
                  key={index}
                  className="inline-block animate-fade-slide-up"
                  style={{
                    animationDelay: `${190 + index * 40}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  {char}
                </span>
              ))}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-3">
        <p className="text-[10.5px] font-[800] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.45)]">MAIN</p>
      </div>

      <nav className="trackdocs-stagger-list flex gap-2 overflow-x-auto pb-1 lg:-mt-1 lg:flex-1 lg:flex-col lg:gap-[9px] lg:overflow-visible">
        {links.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group ' +
                  motion.sidebarItem +
                  ' trackdocs-sidebar-nav trackdocs-sidebar-nav-item relative min-w-max flex items-center gap-3 px-4 h-[46px] lg:min-w-0 lg:w-full transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isActive
                  ? 'trackdocs-sidebar-nav-item--active text-[#111216] font-[800]'
                  : 'trackdocs-sidebar-nav-item--inactive text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.9)] font-[700]',
              )
            }
          >
            {({ isActive }) => (
              <>

                <span className={cn("relative z-10 flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [&>svg]:w-[16px] [&>svg]:h-[16px]", isActive ? "text-[#111216]" : "text-current group-hover:translate-x-[1px]")}>{item.icon}</span>
                <span className="relative z-10 text-[14px] leading-none tracking-[0.015em] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[1px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 lg:px-2 flex justify-center">
        <a
          href="https://github.com/sinlawatt5-cloud/Trackdocs"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex h-[46px] w-fit items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 text-[14.5px] font-[800] text-[rgba(255,255,255,0.85)] hover:text-white transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <svg
            className="h-[20px] w-[20px] text-[#D7EA49] transition-colors shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span className="tracking-[0.01em]">GitHub</span>
        </a>
      </div>
    </aside>
  )
}
