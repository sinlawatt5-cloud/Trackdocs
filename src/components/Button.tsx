import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'cyan' | 'amber' | 'slate' | 'lime'
}

const toneClasses: Record<NonNullable<ButtonProps['tone']>, string> = {
  cyan: 'trackdocs-button-primary',
  amber:
    'border border-[rgba(241,179,74,0.28)] bg-[rgba(255,248,233,0.96)] text-[#7c5610] shadow-[0_14px_28px_rgba(241,179,74,0.12)] hover:border-[rgba(241,179,74,0.42)] hover:bg-[rgba(255,244,216,0.98)]',
  slate:
    'trackdocs-button-secondary text-[var(--td-text-strong)] hover:border-[rgba(215,234,73,0.28)] hover:bg-[rgba(247,250,225,0.96)]',
  lime:
    'bg-[#d9f127] text-[#171c01] font-[800] shadow-[0_8px_20px_rgba(217,241,39,0.3)] hover:bg-[#ccdf22] active:bg-[#c0d320] border-transparent',
}

export function Button({ className, tone = 'slate', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
          'trackdocs-text-button ' +
          motion.button +
          ' inline-flex items-center justify-center gap-2 rounded-[22px] px-5 py-3 active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
