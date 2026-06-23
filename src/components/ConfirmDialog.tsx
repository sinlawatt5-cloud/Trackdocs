import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { motion } from '../lib/motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  icon?: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading,
  icon,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={motion.button + ' trackdocs-text-ui rounded-full border border-[rgba(17,17,17,0.12)] bg-white px-4 py-2 trackdocs-text-body-strong hover:bg-[rgba(248,246,239,0.96)]'}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
            className={motion.button + ' trackdocs-button-primary rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60'}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      }
      >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(17,17,17,0.08)] bg-[rgba(247,245,238,0.95)]">
            {icon}
          </div>
        ) : null}
        <p className="trackdocs-text-body">{description}</p>
      </div>
    </Modal>
  )
}

