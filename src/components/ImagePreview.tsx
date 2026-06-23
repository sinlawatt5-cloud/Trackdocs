import { ImageOff } from 'lucide-react'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface ImagePreviewProps {
  src?: string
  alt: string
  label?: string
  className?: string
}

export function ImagePreview({ src, alt, label, className }: ImagePreviewProps) {
  return (
    <div className={cn(motion.card, 'trackdocs-card-inner overflow-hidden rounded-[24px] bg-[rgba(255,255,255,0.94)]', className)}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex min-h-[220px] items-center justify-center px-6 py-10 text-center">
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(15,23,42,0.08)] bg-[rgba(249,247,241,0.96)] text-[var(--td-text-muted)]">
              <ImageOff className="h-5 w-5" />
            </div>
            <p className="trackdocs-text-body-strong">{label ?? 'No image uploaded yet'}</p>
            <p className="trackdocs-text-helper text-[var(--td-text-muted)]">{alt}</p>
          </div>
        </div>
      )}
    </div>
  )
}

