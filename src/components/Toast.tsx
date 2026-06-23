import { Toaster } from 'sonner'
import { motion } from '../lib/motion'

export function Toast() {
  return (
    <Toaster
      theme="light"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        className:
          motion.toast +
          ' ' +
          'border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.96)] text-[var(--td-text-strong)] shadow-[0_20px_60px_rgba(17,17,17,0.12)] backdrop-blur-xl',
      }}
    />
  )
}
