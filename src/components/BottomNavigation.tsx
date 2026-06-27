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
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-center justify-around border-t border-[rgba(0,0,0,0.04)] bg-white/95 px-8 pb-[env(safe-area-inset-bottom,12px)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.02)] backdrop-blur-xl lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center justify-center gap-[2px] transition-all duration-300 active:scale-95 py-1 min-w-[72px]',
                isActive ? 'text-[#BED52B]' : 'text-[var(--td-text-muted)] hover:text-[var(--td-text-strong)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex flex-col items-center">
                  <Icon className={cn('h-6 w-6 stroke-[2px] transition-all duration-300', isActive ? 'scale-[1.1] drop-shadow-sm' : 'scale-100 opacity-80')} />
                  {isActive && (
                    <span className="absolute -bottom-[3px] left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#BED52B]" />
                  )}
                </div>
                <span className={cn('text-[10px] font-[700] tracking-wide transition-all duration-300 mt-1', isActive ? 'font-[800] text-[#BED52B]' : 'opacity-90')}>
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
