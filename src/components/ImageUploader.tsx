import { UploadCloud, X, FileImage } from 'lucide-react'
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
  variant?: 'default' | 'mobile'
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
  variant = 'default',
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

  if (variant === 'mobile') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {previewUrl || imageUrl ? (
            <>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] border border-[rgba(15,23,42,0.08)] bg-black/5">
                <img
                  src={previewUrl || imageUrl}
                  alt={label}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-[var(--td-text-strong)]">{label}</p>
                <p className="truncate text-[10px] text-[var(--td-text-muted)]">อัปโหลดแล้ว</p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(240,250,252,0.8)] text-[#2bc7e8]">
                <FileImage className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-[var(--td-text-strong)]">{label}</p>
                <p className="truncate text-[10px] text-[var(--td-text-muted)]">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="shrink-0 rounded-full bg-[#f8f9fa] px-3 py-1.5 text-[11px] font-bold text-[var(--td-text-strong)] transition active:scale-95"
              >
                เลือกไฟล์
              </button>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
        {error ? <p className="px-2 text-[10px] font-medium text-rose-500">{error}</p> : null}
      </div>
    )
  }

  // --- DEFAULT (DESKTOP) VARIANT ---
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
