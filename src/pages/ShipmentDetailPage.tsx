import { useEffect, useState } from 'react'
import { ArrowLeft, Image as ImageIcon, RotateCcw, ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { Modal } from '../components/Modal'
import { ReceiveDialog } from '../components/ReceiveDialog'
import { ShipmentDetailPanel } from '../components/ShipmentDetailPanel'
import { useAuth } from '../auth/useAuth'
import { getShipmentById, receiveShipmentRecord } from '../lib/firestore'
import { uploadShipmentImage } from '../lib/r2Upload'
import { roleHomePath } from '../lib/roles'
import type { Shipment } from '../types'

type ImagePreviewState = {
  src: string
  alt: string
  label: string
} | null

const dashboardCopy: Record<'customer' | 'operation' | 'admin', string> = {
  customer: 'ลูกค้า',
  operation: 'Operation',
  admin: 'Admin',
}

export function ShipmentDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [shipment, setShipment] = useState<Shipment | null>((location.state as { shipment?: Shipment } | null)?.shipment ?? null)
  const [loading, setLoading] = useState(!shipment)
  const [error, setError] = useState('')
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<ImagePreviewState>(null)

  useEffect(() => {
    let mounted = true

    if (shipment && session?.role === 'customer' && shipment.customerId !== session.customerId) {
      setError('คุณสามารถดูได้เฉพาะรายการของบริษัทตัวเองเท่านั้น')
      setLoading(false)
      return
    }

    if (!id || shipment) {
      return
    }

    setLoading(true)
    getShipmentById(id)
      .then((result) => {
        if (!mounted) return
        if (!result) {
          setError('ไม่พบรายการเอกสาร')
          return
        }

        if (session?.role === 'customer' && result.customerId !== session.customerId) {
          setError('คุณสามารถดูได้เฉพาะรายการของบริษัทตัวเองเท่านั้น')
          return
        }

        setShipment(result)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id, session, shipment])

  if (!session) {
    return null
  }

  const activeSession = session
  const backPath = roleHomePath[activeSession.role]
  const backLabel = `กลับสู่แดชบอร์ด ${dashboardCopy[activeSession.role]}`

  if (loading) {
    return (
      <AppShell title="Shipment detail" subtitle="Inspect a single proof record.">
        <LoadingState />
      </AppShell>
    )
  }

  if (error || !shipment) {
    return (
      <AppShell
        title="Shipment detail"
        subtitle="Inspect a single proof record."
        actions={
          <Button tone="slate" onClick={() => navigate(backPath, { replace: true })} className="px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        }
      >
        <ErrorState message={error || 'ไม่พบรายการเอกสาร'} onRetry={() => navigate(backPath, { replace: true })} />
      </AppShell>
    )
  }

  async function handleReceive(payload: { note: string; file: File | null; previewUrl: string | null }) {
    if (!shipment) {
      return
    }

    try {
      let receivedImage: { key: string; url: string } | null = null
      if (payload.file) {
        receivedImage = await uploadShipmentImage({
          file: payload.file,
          customerCode: shipment.customerCode,
          trackingNo: shipment.trackingNo,
          imageType: 'received',
        })
      }

      const updated = await receiveShipmentRecord({
        shipmentId: shipment.shipmentId,
        operationReceiveNote: payload.note,
        receivedBy: activeSession,
        receivedImage,
      })

      setShipment(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถอัปเดตรายการได้')
    } finally {
      setReceiveOpen(false)
    }
  }

  const canReceive = (activeSession.role === 'operation' || activeSession.role === 'admin') && shipment.status === 'NOT_RECEIVED'

  return (
    <AppShell
      title="Shipment detail"
      subtitle="Review the proof trail, customer note, uploaded images, and handoff status."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button tone="slate" onClick={() => navigate(backPath, { replace: true })} className="px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          {canReceive ? (
            <Button tone="amber" onClick={() => setReceiveOpen(true)} className="px-4 py-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              ยืนยันรับแล้ว
            </Button>
          ) : (
            <div className="rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 py-2 trackdocs-text-badge text-[var(--td-text-muted)] shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
              {shipment.status === 'RECEIVED' ? 'รายการนี้รับแล้ว' : 'สิทธิ์อ่านอย่างเดียว'}
            </div>
          )}
        </div>
      }
    >
      <div className="trackdocs-page-entrance">
        <ShipmentDetailPanel
          shipment={shipment}
          onPreviewImage={(image) => setPreviewImage(image)}
        />
      </div>

      <ReceiveDialog
        open={receiveOpen}
        shipment={shipment}
        onClose={() => setReceiveOpen(false)}
        onConfirm={handleReceive}
      />

      <Modal
        open={Boolean(previewImage)}
        title={previewImage?.label ?? 'Image preview'}
        description={previewImage?.alt ?? 'Preview image'}
        onClose={() => setPreviewImage(null)}
        size="lg"
      >
        {previewImage ? (
          <div className="space-y-4">
            <div className="trackdocs-cursor-zoom-out overflow-hidden rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,251,0.96)]">
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[72vh] w-full object-contain bg-[rgba(17,17,17,0.02)]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 py-2 trackdocs-text-body-strong">
                <ImageIcon className="h-4 w-4 text-[var(--td-primary)]" />
                {previewImage.label}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 py-2 trackdocs-text-body-strong transition hover:bg-[rgba(247,250,225,0.9)]"
              >
                <RotateCcw className="h-4 w-4" />
                ปิดพรีวิว
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  )
}

