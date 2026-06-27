import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface SegmentedFilterProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}

export function SegmentedFilter({ options, value, onChange }: SegmentedFilterProps) {
  return (
    <div className={cn(motion.entrance, "flex items-center gap-1 rounded-[16px] bg-white p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]")}>
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 rounded-[12px] px-2 py-2 text-center text-[12px] font-bold transition-all duration-200 active:scale-95",
              isActive ? "text-[#2e3b0b] shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "text-[var(--td-text-muted)] hover:text-[var(--td-text-strong)]"
            )}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-[12px] bg-[#D7EA49]" />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
