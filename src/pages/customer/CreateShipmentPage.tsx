import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, FilePlus2, Package2, Send, ShieldCheck, Upload, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorState } from '../../components/ErrorState'
import { ImageUploader } from '../../components/ImageUploader'
import { Input } from '../../components/Input'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { StatCard } from '../../components/StatCard'
import { Textarea } from '../../components/Textarea'
import { useAuth } from '../../auth/useAuth'
import { getCustomerById, reserveTrackingNoWithTransaction, createShipment } from '../../lib/firestore'
import { roleHomePath } from '../../lib/roles'
import { uploadImageToR2, validateImageFile } from '../../lib/r2Upload'
import type { Customer } from '../../types'

const imageFileSchema = z.any().superRefine((value, ctx) => {
  const error = validateImageFile(value as File | null | undefined)
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: error })
  }
})

const schema = z.object({
  senderName: z.string().trim().min(1, 'กรุณากรอกชื่อผู้ส่ง'),
  senderPhone: z.string().trim().max(20, 'หมายเลขโทรศัพท์ยาวเกินไป').optional(),
  sentDate: z.string().min(1, 'กรุณาเลือกวันที่ส่ง'),
  envelopeCount: z.number().int().min(1, 'กรุณาระบุจำนวนซองอย่างน้อย 1'),
  customerNote: z.string().trim().optional(),
  envelopeImage: imageFileSchema,
  receiptImage: imageFileSchema,
})

type ShipmentFormValues = z.infer<typeof schema>

type SubmitStage = 'idle' | 'reserve' | 'envelope' | 'receipt' | 'save'

type FileState = {
  file: File | null
  previewUrl: string | null
}

const submitStages: Array<{
  key: Exclude<SubmitStage, 'idle'>
  label: string
  icon: ReactNode
}> = [
  { key: 'reserve', label: 'กำลังสร้างเลขรายการ', icon: <FilePlus2 className="h-4 w-4" /> },
  { key: 'envelope', label: 'กำลังอัปโหลดรูปหน้าซอง', icon: <Upload className="h-4 w-4" /> },
  { key: 'receipt', label: 'กำลังอัปโหลดรูปใบเสร็จ', icon: <Send className="h-4 w-4" /> },
  { key: 'save', label: 'กำลังบันทึกข้อมูล', icon: <Package2 className="h-4 w-4" /> },
]

function buildUploadFailureMessage(imageLabel: string, error: unknown) {
  const detail = error instanceof Error && error.message ? ` (${error.message})` : ''
  return `อัปโหลด${imageLabel}ไม่สำเร็จ${detail} กรุณาลองสร้างรายการใหม่ เลขรายการที่จองไว้จะไม่ถูกนำกลับมาใช้ซ้ำเพื่อความปลอดภัยของระบบ`
}

export function CreateShipmentPage() {
  const { userProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitStage, setSubmitStage] = useState<SubmitStage>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [envelope, setEnvelope] = useState<FileState>({ file: null, previewUrl: null })
  const [receipt, setReceipt] = useState<FileState>({ file: null, previewUrl: null })
  const [successTrackingNo, setSuccessTrackingNo] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      senderName: '',
      senderPhone: '',
      sentDate: new Date().toISOString().slice(0, 10),
      envelopeCount: 1,
      customerNote: '',
      envelopeImage: null,
      receiptImage: null,
    },
  })

  const customerId = userProfile?.customerId ?? null

  useEffect(() => {
    if (!customerId) {
      setLoadingCustomer(false)
      setCustomer(null)
      return
    }

    let mounted = true
    setLoadingCustomer(true)

    getCustomerById(customerId)
      .then((result) => {
        if (!mounted) {
          return
        }

        if (!result) {
          setCustomer(null)
          setErrorMessage('ไม่พบข้อมูลบริษัทของคุณ กรุณาติดต่อผู้ดูแลระบบ')
          return
        }

        setCustomer(result)
        setErrorMessage('')
      })
      .catch((error) => {
        if (!mounted) {
          return
        }
        setCustomer(null)
        setErrorMessage(error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลบริษัทได้')
      })
      .finally(() => {
        if (mounted) {
          setLoadingCustomer(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [customerId])

  const submitStageIndex = useMemo(() => {
    if (submitStage === 'idle') {
      return -1
    }

    return submitStages.findIndex((stage) => stage.key === submitStage)
  }, [submitStage])

  if (authLoading || loadingCustomer) {
    return (
      <AppShell title="Create shipment" subtitle="Prepare and submit a new document shipment.">
        <LoadingState label="กำลังเตรียมข้อมูลสำหรับสร้างรายการ" />
      </AppShell>
    )
  }

  if (!userProfile) {
    return null
  }

  if (userProfile.role !== 'customer') {
    return <Navigate to={roleHomePath[userProfile.role]} replace />
  }

  if (errorMessage && !customer) {
    return (
      <AppShell title="Create shipment" subtitle="Prepare and submit a new document shipment.">
        <ErrorState title="ไม่สามารถเปิดหน้าสร้างรายการได้" message={errorMessage} onRetry={() => navigate(-1)} />
      </AppShell>
    )
  }

  async function handleSubmit(values: ShipmentFormValues) {
    if (!userProfile || !customer) {
      setErrorMessage('ไม่พบข้อมูลลูกค้าสำหรับผู้ใช้งานนี้')
      return
    }

    if (!userProfile.customerId || !userProfile.customerCode) {
      setErrorMessage('ไม่พบข้อมูลบริษัทของคุณ กรุณาติดต่อผู้ดูแลระบบ')
      return
    }

    const envelopeValidation = validateImageFile(envelope.file)
    if (envelopeValidation) {
      setErrorMessage(`รูปหน้าซอง: ${envelopeValidation}`)
      return
    }

    const receiptValidation = validateImageFile(receipt.file)
    if (receiptValidation) {
      setErrorMessage(`รูปใบเสร็จ: ${receiptValidation}`)
      return
    }

    setSubmitLoading(true)
    setSubmitStage('reserve')
    setErrorMessage('')

    try {
      const trackingNo = await reserveTrackingNoWithTransaction(userProfile)

      setSubmitStage('envelope')
      const envelopeImage = await uploadImageToR2({
        file: envelope.file!,
        customerCode: userProfile.customerCode!,
        trackingNo,
        imageType: 'envelope',
      }).catch((error) => {
        throw new Error(buildUploadFailureMessage('รูปหน้าซอง', error))
      })

      setSubmitStage('receipt')
      const receiptImage = await uploadImageToR2({
        file: receipt.file!,
        customerCode: userProfile.customerCode!,
        trackingNo,
        imageType: 'receipt',
      }).catch((error) => {
        throw new Error(buildUploadFailureMessage('รูปใบเสร็จ', error))
      })

      setSubmitStage('save')
      await createShipment({
        trackingNo,
        customerName: customer.companyName,
        senderName: values.senderName,
        senderPhone: values.senderPhone?.trim() ?? '',
        sentDate: values.sentDate,
        envelopeCount: values.envelopeCount,
        customerNote: values.customerNote?.trim() ?? '',
        envelopeImageKey: envelopeImage.key,
        envelopeImageUrl: envelopeImage.url,
        receiptImageKey: receiptImage.key,
        receiptImageUrl: receiptImage.url,
        userProfile,
      })

      setSuccessTrackingNo(trackingNo)
      setSuccessOpen(true)
      form.reset({
        senderName: '',
        senderPhone: '',
        sentDate: new Date().toISOString().slice(0, 10),
        envelopeCount: 1,
        customerNote: '',
        envelopeImage: null,
        receiptImage: null,
      })
      setEnvelope({ file: null, previewUrl: null })
      setReceipt({ file: null, previewUrl: null })
      setSubmitStage('idle')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'ไม่สามารถสร้างรายการได้'
      setErrorMessage(message)
      setSubmitStage('idle')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <AppShell
      title="Create shipment"
      subtitle="Customer submits envelope and receipt photos, then TrackDocs reserves a tracking number and saves the shipment."
      actions={
        <Link
          to="/customer/dashboard"
          className="trackdocs-button-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold"
        >
          กลับแดชบอร์ด
        </Link>
      }
    >
      <div className="trackdocs-page-entrance grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="trackdocs-stagger-list space-y-6" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
          <Card tone="glass" padding="lg" className="trackdocs-stagger-list space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="trackdocs-pill trackdocs-pill-soft inline-flex px-3 py-1.5 trackdocs-text-badge text-[var(--td-text-muted)]">
                  สร้างรายการใหม่
                </div>
                <h2 className="mt-4 trackdocs-text-page-title">
                  ส่งเอกสารจากลูกค้า
                </h2>
                <p className="mt-2 trackdocs-text-body text-[var(--td-text-muted)]">
                  กรอกข้อมูล สองรูปหลักฐาน แล้วกด submit ระบบจะจองเลขรายการ อัปโหลดรูป และบันทึกลง Firestore ให้อัตโนมัติ
                </p>
              </div>

              <div className="rounded-[22px] border border-[rgba(34,211,238,0.14)] bg-[rgba(236,253,255,0.9)] px-4 py-3 text-right">
                <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
                  Company
                </p>
                <p className="mt-2 text-sm font-extrabold text-[var(--td-text-strong)]">
                  {customer?.companyName ?? 'Unknown'}
                </p>
                <p className="trackdocs-text-helper mt-1">Code: {userProfile.customerCode ?? '--'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="senderName"
                label="ชื่อผู้ส่ง"
                placeholder="กรอกชื่อผู้ส่ง"
                error={form.formState.errors.senderName?.message}
                {...form.register('senderName')}
              />

              <Input
                id="senderPhone"
                label="เบอร์โทรผู้ส่ง (ไม่บังคับ)"
                placeholder="08x-xxx-xxxx"
                error={form.formState.errors.senderPhone?.message}
                {...form.register('senderPhone')}
              />

              <Input
                id="sentDate"
                type="date"
                label="วันที่ส่ง"
                error={form.formState.errors.sentDate?.message}
                {...form.register('sentDate')}
              />

              <Input
                id="envelopeCount"
                type="number"
                min={1}
                inputMode="numeric"
                label="จำนวนซอง"
                placeholder="1"
                error={form.formState.errors.envelopeCount?.message}
                {...form.register('envelopeCount', { valueAsNumber: true })}
              />
            </div>

            <Textarea
              id="customerNote"
              label="หมายเหตุจากลูกค้า (ไม่บังคับ)"
              placeholder="เช่น เอกสารด่วน ส่งก่อนเที่ยง"
              error={form.formState.errors.customerNote?.message}
              rows={4}
              {...form.register('customerNote')}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <ImageUploader
                label="รูปหน้าซอง"
                description="กรุณาอัปโหลดรูป image/* ไม่เกิน 10MB"
                previewUrl={envelope.previewUrl ?? undefined}
                onSelect={(file, previewUrl) => {
                  setEnvelope({ file, previewUrl })
                  form.setValue('envelopeImage', file, { shouldValidate: true, shouldDirty: true })
                }}
                onClear={() => {
                  setEnvelope({ file: null, previewUrl: null })
                  form.setValue('envelopeImage', null, { shouldValidate: true, shouldDirty: true })
                }}
                error={form.formState.errors.envelopeImage?.message as string | undefined}
              />

              <ImageUploader
                label="รูปใบเสร็จ"
                description="กรุณาอัปโหลดรูป image/* ไม่เกิน 10MB"
                previewUrl={receipt.previewUrl ?? undefined}
                onSelect={(file, previewUrl) => {
                  setReceipt({ file, previewUrl })
                  form.setValue('receiptImage', file, { shouldValidate: true, shouldDirty: true })
                }}
                onClear={() => {
                  setReceipt({ file: null, previewUrl: null })
                  form.setValue('receiptImage', null, { shouldValidate: true, shouldDirty: true })
                }}
                error={form.formState.errors.receiptImage?.message as string | undefined}
              />
            </div>

            {errorMessage ? (
              <div className="rounded-[22px] border border-[rgba(248,113,113,0.18)] bg-[rgba(255,241,242,0.92)] px-4 py-3 text-sm font-medium text-rose-600">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                tone="cyan"
                disabled={submitLoading}
                aria-busy={submitLoading}
                className="w-full sm:flex-1"
              >
                {submitLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="trackdocs-loading-dots scale-75" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    กำลังทำรายการ...
                  </span>
                ) : (
                  'Submit'
                )}
                <FilePlus2 className="h-4 w-4" />
              </Button>
              <Link
                to="/customer/dashboard"
                className="trackdocs-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                ยกเลิก
              </Link>
            </div>
          </Card>
        </form>

        <div className="trackdocs-stagger-list space-y-6">
          <StatCard
            label="สถานะลูกค้า"
            value={customer?.companyCode ?? '--'}
            tone="cyan"
            description={customer ? customer.companyName : 'ไม่พบข้อมูลบริษัท'}
          />

          <Card tone="glass" padding="lg" className="trackdocs-stagger-list space-y-4">
            <div className="flex items-center gap-2 trackdocs-text-body-strong">
              <ShieldCheck className="h-4 w-4 text-[var(--td-primary)]" />
              ขั้นตอนการทำงาน
            </div>

            <div className="trackdocs-stagger-list space-y-3">
              {submitStages.map((stage, index) => {
                const isActive = submitStageIndex === index
                const isDone = submitStageIndex > index

                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 ${
                      isActive
                        ? 'border-[rgba(34,211,238,0.24)] bg-[rgba(236,253,255,0.96)]'
                        : isDone
                          ? 'border-[rgba(53,201,126,0.18)] bg-[rgba(234,251,242,0.92)]'
                          : 'border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.8)]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive
                          ? 'bg-[rgba(34,211,238,0.16)] text-cyan-600'
                          : isDone
                            ? 'bg-[rgba(53,201,126,0.16)] text-emerald-600'
                            : 'bg-[rgba(15,23,42,0.06)] text-[var(--td-text-muted)]'
                      }`}
                    >
                      {isActive && submitLoading ? (
                        <span className="trackdocs-loading-dots scale-75" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      ) : isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    <div>
                      <p className="trackdocs-text-body-strong">{stage.label}</p>
                      <p className="trackdocs-text-helper mt-1">
                        {isDone ? 'เสร็จแล้ว' : isActive ? 'กำลังทำงาน' : 'รอทำงาน'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card tone="dark" padding="lg" className="trackdocs-stagger-list space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <XCircle className="h-4 w-4 text-[var(--td-accent-cyan)]" />
              ข้อจำกัดสำคัญ
            </div>
            <ul className="space-y-3 text-sm leading-7 text-white/72">
              <li>• ห้ามมี receiptNo, receiptNumber หรือเลขใบเสร็จ</li>
              <li>• รูปทุกไฟล์ต้องเป็น image/* และไม่เกิน 10MB</li>
              <li>• ถ้าอัปโหลดล้มเหลว เลขรายการที่จองไว้จะไม่ถูกนำกลับมาใช้ซ้ำ</li>
              <li>• ระบบจะบันทึกข้อมูลหลังอัปโหลดรูปสำเร็จเท่านั้น</li>
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={successOpen}
        title="สร้างรายการสำเร็จ"
        description={`เลขรายการ: ${successTrackingNo}`}
        onClose={() => {
          setSuccessOpen(false)
          navigate('/customer/dashboard', { replace: true })
        }}
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              tone="cyan"
              onClick={() => {
                setSuccessOpen(false)
                navigate('/customer/dashboard', { replace: true })
              }}
            >
              ไปแดชบอร์ด
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[rgba(34,211,238,0.16)] bg-[rgba(236,253,255,0.96)] p-5">
            <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
              Tracking No
            </p>
            <p className="mt-3 trackdocs-text-page-title">
              {successTrackingNo}
            </p>
          </div>

          <p className="trackdocs-text-body text-[var(--td-text-muted)]">
            ระบบได้อัปโหลดรูปและบันทึกข้อมูลเรียบร้อยแล้ว คุณสามารถกลับไปดูรายการล่าสุดในแดชบอร์ดได้ทันที
          </p>
        </div>
      </Modal>
    </AppShell>
  )
}



