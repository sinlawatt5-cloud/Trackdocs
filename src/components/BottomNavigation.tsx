import { LayoutDashboard, FilePlus2, Building2, Users2, BarChart3 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useAuth } from '../auth/useAuth'

export function BottomNavigation() {
  const { session } = useAuth()
  const role = session?.role || 'admin'

  const navItems = role === 'admin'
    ? [
        { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Create shipment', to: '/admin/create-shipment', icon: FilePlus2 },
        { label: 'Customers', to: '/admin/customers', icon: Building2 },
        { label: 'Users', to: '/admin/users', icon: Users2 },
        { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
      ]
    : [
        { label: 'Dashboard', to: `/${role}/dashboard`, icon: LayoutDashboard },
        { label: 'Create shipment', to: `/${role}/create-shipment`, icon: FilePlus2 },
      ]

  const getThaiLabel = (label: string) => {
    switch (label) {
      case 'Dashboard': return 'หน้าหลัก'
      case 'Create shipment': return 'สร้างรายการ'
      case 'Customers': return 'ลูกค้า'
      case 'Users': return 'ผู้ใช้งาน'
      case 'Reports': return 'รายงาน'
      default: return label
    }
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-center justify-around rounded-t-[24px] border-t border-slate-300 bg-white/95 pb-[env(safe-area-inset-bottom,12px)] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden",
      role === 'admin' ? 'px-2' : 'px-8'
    )}>
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.label}
            to={item.to}
            className="group flex flex-col items-center justify-center transition-all duration-300 active:scale-95 py-1 min-w-[64px]"
          >
            {({ isActive }) => (
              <>
                <div className="relative flex flex-col items-center justify-center h-7 w-7">
                  <Icon
                    className={cn(
                      'h-5.5 w-5.5 transition-all duration-300',
                      isActive
                        ? 'stroke-[#171c01] stroke-[2.2px] fill-[#d9f127] scale-110 drop-shadow-[0_2px_6px_rgba(217,241,39,0.3)]'
                        : 'stroke-slate-400 stroke-[1.8px] fill-transparent opacity-80'
                    )}
                  />
                </div>
                <span className={cn('text-[9px] font-[800] tracking-tight transition-all duration-300 mt-1', isActive ? 'text-[#171c01] font-[900]' : 'text-slate-400')}>
                  {getThaiLabel(item.label)}
                </span>
                {isActive && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#d9f127] shadow-[0_1px_4px_rgba(217,241,39,0.6)]" />
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
