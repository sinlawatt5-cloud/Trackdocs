import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'cyan' | 'amber' | 'slate'
}

const toneClasses: Record<NonNullable<ButtonProps['tone']>, string> = {
  cyan: 'trackdocs-button-primary',
  amber:
    'border border-[rgba(241,179,74,0.28)] bg-[rgba(255,248,233,0.96)] text-[#7c5610] shadow-[0_14px_28px_rgba(241,179,74,0.12)] hover:border-[rgba(241,179,74,0.42)] hover:bg-[rgba(255,244,216,0.98)]',
  slate:
    'trackdocs-button-secondary text-[var(--td-text-strong)] hover:border-[rgba(215,234,73,0.28)] hover:bg-[rgba(247,250,225,0.96)]',
}

export function Button({ className, tone = 'slate', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'trackdocs-text-ui ' +
          motion.button +
          ' inline-flex items-center justify-center gap-2 rounded-[22px] px-5 py-3 text-sm font-semibold tracking-[0.01em] active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
