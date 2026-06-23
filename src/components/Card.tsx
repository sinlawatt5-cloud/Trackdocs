import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'surface' | 'glass' | 'dark' | 'shell'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const toneClasses: Record<NonNullable<CardProps['tone']>, string> = {
  surface: 'trackdocs-card trackdocs-signal-panel',
  glass:
    'trackdocs-card trackdocs-signal-panel border-[var(--td-card-border)] bg-[var(--td-card-bg)] text-[var(--td-text-strong)] shadow-[var(--td-card-shadow)] backdrop-blur-2xl',
  dark:
    'trackdocs-card border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(18,20,25,0.94),rgba(11,12,16,0.96))] text-white shadow-[0_30px_100px_rgba(15,23,42,0.24)] backdrop-blur-2xl',
  shell: 'trackdocs-card trackdocs-card-strong trackdocs-signal-panel',
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  tone = 'surface',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        motion.card,
        'trackdocs-entrance rounded-[var(--td-card-radius)]',
        toneClasses[tone],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
