import { Bell, ShieldCheck, UserCircle } from 'lucide-react'
import { motion } from '../lib/motion'
import { cn } from '../lib/cn'

export function MobileTopHeader() {
  return (
    <div className="trackdocs-entrance sticky top-2 z-50 flex h-[64px] items-center justify-between rounded-[24px] bg-gradient-to-b from-[#1d1e23] to-[#111216] px-4 shadow-lg sm:top-4 sm:h-[72px] sm:px-6 lg:hidden">
      <div className="flex items-center gap-[10px]">
        <div className="relative flex h-[32px] w-[32px] shrink-0 items-center justify-center text-[#172008]">
          <svg
            viewBox="0 0 48 48"
            className="absolute inset-0 h-full w-full drop-shadow-[0_2px_8px_rgba(215,234,73,0.15)]"
            aria-hidden="true"
          >
            <path
              d="M12 5H36C38.7614 5 41 7.23858 41 10V26.761C41 28.322 40.2707 29.7938 39.0292 30.7365L26.4228 40.3073C24.989 41.3962 22.9985 41.3973 21.5635 40.3099L8.95998 30.7589C7.72198 29.8202 7 28.3521 7 26.7986V10C7 7.23858 9.23858 5 12 5Z"
              fill="url(#mobile-brand-badge-fill)"
            />
            <path
              d="M12 5H36C38.7614 5 41 7.23858 41 10V26.761C41 28.322 40.2707 29.7938 39.0292 30.7365L26.4228 40.3073C24.989 41.3962 22.9985 41.3973 21.5635 40.3099L8.95998 30.7589C7.72198 29.8202 7 28.3521 7 26.7986V10C7 7.23858 9.23858 5 12 5Z"
              fill="none"
              stroke="rgba(23,32,8,0.08)"
              strokeWidth="1"
            />
            <defs>
              <linearGradient id="mobile-brand-badge-fill" x1="7" y1="5" x2="41" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E3F55B" />
                <stop offset="56%" stopColor="#D7EA49" />
                <stop offset="100%" stopColor="#BED52B" />
              </linearGradient>
            </defs>
          </svg>
          <ShieldCheck className="relative z-[1] h-[14px] w-[14px] stroke-[2.5]" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[14px] font-[900] leading-none tracking-[0.08em] text-white" style={{ transform: "translateY(1px)" }}>
            TRACKDOCS
          </p>
          <p className="mt-[4px] text-[7.5px] font-[700] leading-none tracking-[0.15em] text-[rgba(255,255,255,0.4)]">
            WORKSPACE OS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            motion.button,
            "relative flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:scale-[0.96]"
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-[9px] top-[9px] h-[6px] w-[6px] rounded-full bg-[#BED52B] ring-2 ring-[#111418]" />
        </button>
        <button
          type="button"
          className={cn(
            motion.button,
            "relative flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:scale-[0.96]"
          )}
        >
          <UserCircle className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  )
}
