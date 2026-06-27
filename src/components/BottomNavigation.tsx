import { LayoutDashboard, PlusCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useAuth } from '../auth/useAuth'

export function BottomNavigation() {
  const { session } = useAuth()
  const role = session?.role || 'admin'

  const navItems = [
    { label: 'Dashboard', to: `/${role}/dashboard`, icon: LayoutDashboard },
    { label: 'Create shipment', to: `/${role}/create-shipment`, icon: PlusCircle },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-center justify-around border-t border-[rgba(0,0,0,0.04)] bg-white/95 px-12 pb-[env(safe-area-inset-bottom,16px)] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.02)] backdrop-blur-xl lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center justify-center gap-[4px] transition-all duration-200 active:scale-95 py-1',
                isActive ? 'text-[#BED52B]' : 'text-[var(--td-text-muted)] hover:text-[var(--td-text-strong)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={cn('h-6 w-6 stroke-[2px] transition-transform duration-200', isActive && 'scale-[1.05] drop-shadow-sm')} />
                  {isActive && (
                    <span className="absolute -bottom-[2px] left-1/2 h-[2.5px] w-4 -translate-x-1/2 rounded-full bg-[#BED52B]" />
                  )}
                </div>
                <span className={cn('text-[10.5px] font-[700] tracking-wide transition-colors', isActive && 'font-[800]')}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
