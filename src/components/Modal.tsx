import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="trackdocs-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,11,20,0.56)] px-4 py-6 backdrop-blur-[18px]">
      <div
        className={cn(
          motion.modal,
          'trackdocs-modal-surface w-full rounded-[32px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.98)] shadow-[0_32px_100px_rgba(15,23,42,0.22)]',
          size === 'sm' && 'max-w-md',
          size === 'md' && 'max-w-2xl',
          size === 'lg' && 'max-w-4xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(15,23,42,0.08)] px-5 py-4 sm:px-6">
          <div>
            <h3 className="trackdocs-text-section-title text-[1.35rem]">{title}</h3>
            {description ? <p className="trackdocs-text-body mt-1">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={motion.button + ' inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(15,23,42,0.1)] bg-white text-[var(--td-text-strong)] hover:border-[rgba(43,199,232,0.28)] hover:bg-[rgba(247,250,252,0.96)]'}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-[rgba(15,23,42,0.08)] px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  )
}
