import { UploadCloud, X } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { cn } from '../lib/cn'
import { motion } from '../lib/motion'

interface ImageUploaderProps {
  label: string
  description: string
  imageUrl?: string
  previewUrl?: string
  error?: string
  onSelect: (file: File | null, previewUrl: string) => void
  onClear: () => void
  accept?: string
  optional?: boolean
  compact?: boolean
}

export function ImageUploader({
  label,
  description,
  imageUrl,
  previewUrl,
  error,
  onSelect,
  onClear,
  accept = 'image/*',
  optional,
  compact,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      return
    }

    const nextPreview = URL.createObjectURL(file)
    onSelect(file, nextPreview)
    event.target.value = ''
  }

  function handleClear() {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onClear()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="trackdocs-text-label">{label}</label>
          <p className="trackdocs-text-helper mt-1">
            {description}
            {optional ? ' (optional)' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={motion.button + ' trackdocs-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold'}
        >
          <UploadCloud className="h-4 w-4" />
          Choose file
        </button>
      </div>

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

      <div
        className={cn(
          motion.upload,
          'trackdocs-entrance trackdocs-signal-panel rounded-[24px] border border-dashed border-[rgba(15,23,42,0.14)] bg-[rgba(255,255,255,0.9)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]',
          compact && 'p-2',
        )}
      >
        {previewUrl || imageUrl ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(246,249,252,0.96)]">
              <img
                src={previewUrl || imageUrl}
                alt={label}
            className={cn('w-full object-cover transition duration-300 ease-out', compact ? 'h-40' : 'h-56')}
              />
            </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                <p className="truncate trackdocs-text-body-strong">
                  {previewUrl ? 'New image selected' : 'Existing image'}
                </p>
                <p className="truncate trackdocs-text-helper">{description}</p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className={motion.button + ' trackdocs-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold'}
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-[rgba(15,23,42,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,251,0.96))] px-6 py-12 text-center transition hover:border-[rgba(43,199,232,0.28)] hover:bg-[rgba(247,250,252,0.9)]"
        >
            <div className="trackdocs-brand-mark flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(43,199,232,0.18)] bg-[rgba(240,250,252,0.98)] text-[var(--td-accent-cyan)] shadow-[0_12px_28px_rgba(43,199,232,0.1)]">
              <UploadCloud className="h-5 w-5" />
            </div>
          <div>
              <p className="trackdocs-text-body-strong">{label}</p>
              <p className="trackdocs-text-helper mt-1">{description}</p>
          </div>
        </button>
      )}
      </div>

      {error ? <p className="trackdocs-text-helper font-medium text-rose-400">{error}</p> : null}
    </div>
  )
}
