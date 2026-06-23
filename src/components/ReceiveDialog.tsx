import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth'
import { validateImageFile } from '../lib/r2Upload'
import type { Shipment } from '../types'
import { ImageUploader } from './ImageUploader'
import { Modal } from './Modal'
import { Textarea } from './Textarea'
import { motion } from '../lib/motion'

interface ReceiveDialogProps {
  open: boolean
  shipment: Shipment | null
  onClose: () => void
  onConfirm: (payload: { note: string; file: File | null; previewUrl: string | null }) => Promise<void>
}

export function ReceiveDialog({ open, shipment, onClose, onConfirm }: ReceiveDialogProps) {
  const { session } = useAuth()
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setNote(shipment?.operationReceiveNote ?? '')
    setFile(null)
    setPreviewUrl(null)
    setError('')
    setLoading(false)
  }, [open, shipment])

  const hasImage = useMemo(() => Boolean(file || previewUrl || shipment?.receivedImageUrl), [file, previewUrl, shipment])

  async function handleConfirm() {
    if (!shipment) {
      return
    }

    setLoading(true)
    try {
      const normalizedFile = file
      const normalizedPreview = previewUrl

      if (normalizedFile) {
        const validationError = validateImageFile(normalizedFile)
        if (validationError) {
          throw new Error(validationError)
        }
      }

      await onConfirm({ note: note.trim(), file: normalizedFile, previewUrl: normalizedPreview })
      toast.success('ยืนยันรับเอกสารแล้ว')
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ไม่สามารถรับเอกสารได้'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={shipment ? 'ยืนยันรับเอกสาร' : 'ยืนยันรับเอกสาร'}
      description="Operation/Admin สามารถเพิ่มหมายเหตุหรืออัปโหลดรูปตอนรับได้แบบไม่บังคับ"
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white px-4 py-2 trackdocs-text-body-strong transition hover:bg-[rgba(247,250,225,0.96)]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !shipment}
            aria-busy={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full trackdocs-button-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="trackdocs-loading-dots scale-75" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            ยืนยันรับเอกสาร
          </button>
        </div>
      }
    >
      <div className={motion.card + ' trackdocs-entrance mb-6 rounded-[22px] border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,251,0.96)] p-4'}>
        <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
          รายการที่กำลังรับ
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SummaryChip label="Tracking No." value={shipment?.trackingNo || '—'} />
          <SummaryChip label="Customer Code" value={shipment?.customerCode || '—'} />
          <SummaryChip label="Customer Name" value={shipment?.customerName || '—'} />
        </div>
      </div>

      <div className="trackdocs-stagger-list grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Textarea
            label="หมายเหตุการรับเอกสาร"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={6}
            placeholder="พิมพ์หมายเหตุได้ถ้าต้องการ"
            hint="ไม่บังคับ กรอกได้เฉพาะเมื่อ Operation/Admin ต้องการทิ้งบันทึกการรับเอกสาร"
          />

          {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}

          <div className="rounded-[22px] border border-[rgba(215,234,73,0.14)] bg-[rgba(247,250,225,0.94)] p-4 trackdocs-text-body text-[var(--td-text-muted)]">
            <p className="font-semibold text-[var(--td-text-strong)]">เงื่อนไข</p>
            <ul className="mt-3 space-y-2 leading-6">
              <li>- รูปตอนรับไม่บังคับ</li>
              <li>- ข้อมูลฝั่งลูกค้าและรูปเดิมจะไม่ถูกแก้</li>
              <li>- สถานะจะเปลี่ยนเป็น RECEIVED จาก Operation/Admin เท่านั้น</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className={motion.entrance + ' rounded-[22px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.94)] p-4'}>
            <div className="mb-3 flex items-center gap-2 trackdocs-text-body-strong">
              <Camera className="h-4 w-4 text-[var(--td-primary)]" />
              รูปตอนรับ
            </div>
            <ImageUploader
              label="รูปตอนรับ"
              description="อัปโหลดรูปตอนรับได้ แต่ไม่บังคับ"
              previewUrl={previewUrl ?? shipment?.receivedImageUrl ?? undefined}
              onSelect={(selectedFile, nextPreview) => {
                setFile(selectedFile)
                setPreviewUrl(nextPreview)
                setError('')
              }}
              onClear={() => {
                setFile(null)
                setPreviewUrl(null)
              }}
              optional
              compact
            />
          </div>

          <div className={motion.entrance + ' rounded-[22px] border border-[rgba(215,234,73,0.16)] bg-[rgba(247,250,225,0.94)] p-4 trackdocs-text-body text-[var(--td-text-muted)]'}>
            <p className="font-semibold text-[var(--td-text-strong)]">ผู้ใช้งานปัจจุบัน</p>
            <p className="mt-2">
              {session?.displayName || 'Unknown'}
              {hasImage ? ' พร้อมรูปที่เลือกแล้ว' : ''}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white px-4 py-3">
      <p className="trackdocs-text-badge text-[var(--td-text-muted)]">{label}</p>
      <p className="mt-2 trackdocs-text-body-strong">{value}</p>
    </div>
  )
}

