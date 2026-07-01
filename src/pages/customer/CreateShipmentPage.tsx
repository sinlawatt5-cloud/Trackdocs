import { zodResolver } from '@hookform/resolvers/zod'
import { FilePlus2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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



type FileState = {
  file: File | null
  previewUrl: string | null
}



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
  const dashboardPath = userProfile ? `/${userProfile.role}/dashboard` : '/'
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



  const [activeStep, setActiveStep] = useState<'info' | 'evidence' | 'confirm'>('info')

  if (authLoading || loadingCustomer) {
    return (
      <AppShell density="compact" title="Create Shipment" subtitle="กำลังเตรียมข้อมูล...">
        <LoadingState label="กำลังเตรียมข้อมูลสำหรับสร้างรายการ" />
      </AppShell>
    )
  }

  if (!userProfile) {
    return null
  }

  if (userProfile.role !== 'customer' && userProfile.role !== 'operation' && userProfile.role !== 'admin') {
    return <Navigate to={roleHomePath[userProfile.role]} replace />
  }

  if (errorMessage && !customer) {
    return (
      <AppShell density="compact" title="Create Shipment" subtitle="พบข้อผิดพลาด">
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
    setErrorMessage('')

    try {
      const trackingNo = await reserveTrackingNoWithTransaction(userProfile)

      const envelopeImage = await uploadImageToR2({
        file: envelope.file!,
        customerCode: userProfile.customerCode!,
        trackingNo,
        imageType: 'envelope',
      }).catch((error) => {
        throw new Error(buildUploadFailureMessage('รูปหน้าซอง', error))
      })

      const receiptImage = await uploadImageToR2({
        file: receipt.file!,
        customerCode: userProfile.customerCode!,
        trackingNo,
        imageType: 'receipt',
      }).catch((error) => {
        throw new Error(buildUploadFailureMessage('รูปใบเสร็จ', error))
      })

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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'ไม่สามารถสร้างรายการได้'
      setErrorMessage(message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleNext = () => {
    if (activeStep === 'info') setActiveStep('evidence')
    else if (activeStep === 'evidence') setActiveStep('confirm')
  }

  return (
    <AppShell
      density="compact"
      title="Create Shipment"
      subtitle="กรอกข้อมูลและอัปโหลดหลักฐาน ระบบจะสร้างรายการให้ทันที"
    >
      <div className="trackdocs-page-entrance w-full max-w-6xl mx-auto pb-[90px] lg:pb-0">
        
        {/* Mobile Segmented Control */}
        <div className="mb-5 flex rounded-[16px] bg-[rgba(15,23,42,0.04)] p-1 lg:hidden">
          <button
            onClick={() => setActiveStep('info')}
            className={`flex-1 rounded-[12px] py-2 text-[12px] font-extrabold transition-all ${
              activeStep === 'info'
                ? 'bg-[#d9f127] text-[#171c01] shadow-[0_4px_12px_rgba(217,241,39,0.3)]'
                : 'text-[var(--td-text-muted)] hover:bg-[rgba(15,23,42,0.02)]'
            }`}
          >
            1. ข้อมูลจัดส่ง
          </button>
          <button
            onClick={() => setActiveStep('evidence')}
            className={`flex-1 rounded-[12px] py-2 text-[12px] font-extrabold transition-all ${
              activeStep === 'evidence'
                ? 'bg-[#d9f127] text-[#171c01] shadow-[0_4px_12px_rgba(217,241,39,0.3)]'
                : 'text-[var(--td-text-muted)] hover:bg-[rgba(15,23,42,0.02)]'
            }`}
          >
            2. หลักฐาน
          </button>
          <button
            onClick={() => setActiveStep('confirm')}
            className={`flex-1 rounded-[12px] py-2 text-[12px] font-extrabold transition-all ${
              activeStep === 'confirm'
                ? 'bg-[#d9f127] text-[#171c01] shadow-[0_4px_12px_rgba(217,241,39,0.3)]'
                : 'text-[var(--td-text-muted)] hover:bg-[rgba(15,23,42,0.02)]'
            }`}
          >
            3. ยืนยัน
          </button>
        </div>

        <form className="trackdocs-stagger-list space-y-6" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
          <Card tone="glass" className="p-4 lg:p-8 space-y-5 lg:space-y-8 rounded-[24px]">
            {/* Desktop Header */}
            <div className="hidden lg:flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="mt-4 trackdocs-text-page-title">สร้างรายการใหม่</h2>
                <p className="mt-2 trackdocs-text-body text-[var(--td-text-muted)]">
                  กรอกข้อมูล สองรูปหลักฐาน แล้วกด submit ระบบจะจองเลขรายการ อัปโหลดรูป และบันทึกลง Firestore ให้อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_1.2fr] xl:grid-cols-[0.85fr_1.15fr] xl:gap-12">
              {/* Left Column: Form Inputs & Actions */}
              <div className={`flex flex-col space-y-4 lg:space-y-6 ${activeStep !== 'info' ? 'hidden lg:flex' : ''}`}>
                <div className="hidden lg:block">
                  <h3 className="trackdocs-text-section-title text-[1.1rem]">ข้อมูลการจัดส่ง</h3>
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
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
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
                </div>

                <Textarea
                  id="customerNote"
                  label="หมายเหตุจากลูกค้า (ไม่บังคับ)"
                  placeholder="เช่น เอกสารด่วน"
                  error={form.formState.errors.customerNote?.message}
                  rows={2}
                  className="min-h-[72px]"
                  {...form.register('customerNote')}
                />

                <div className="mt-4 lg:hidden">
                  <Button type="button" tone="lime" onClick={handleNext} className="w-full py-3 text-[13px]">
                    ถัดไป: อัปโหลดหลักฐาน
                  </Button>
                </div>
              </div>

              {/* Right Column: Image Uploaders */}
              <div className={`flex flex-col space-y-4 lg:space-y-6 lg:rounded-[24px] lg:border lg:border-[rgba(15,23,42,0.06)] lg:bg-[rgba(255,255,255,0.5)] lg:p-6 lg:p-7 ${activeStep !== 'evidence' ? 'hidden lg:flex' : ''}`}>
                <div>
                  <h3 className="text-[14px] lg:text-[1.1rem] font-bold text-[var(--td-text-strong)]">หลักฐานการจัดส่ง</h3>
                  <p className="mt-1 text-[11px] lg:text-[0.85rem] font-medium text-[var(--td-text-muted)]">
                    อัปโหลดรูปภาพเพื่อใช้เป็นหลักฐานในการตรวจสอบ (ไม่เกิน 10MB)
                  </p>
                </div>
                
                <div className="flex-1 grid gap-4 lg:gap-6 sm:grid-cols-2">
                  <div className="lg:hidden">
                    <ImageUploader
                      variant="mobile"
                      label="รูปหน้าซอง"
                      description="เห็นรายละเอียดหน้าซองชัดเจน"
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
                  </div>
                  <div className="hidden lg:block">
                    <ImageUploader
                      label="รูปหน้าซอง"
                      description="เห็นรายละเอียดหน้าซองชัดเจน"
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
                  </div>

                  <div className="lg:hidden">
                    <ImageUploader
                      variant="mobile"
                      label="รูปใบเสร็จ"
                      description="ห้ามเห็นหมายเลข Tracking"
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
                  <div className="hidden lg:block">
                    <ImageUploader
                      label="รูปใบเสร็จ"
                      description="ห้ามเห็นหมายเลข Tracking"
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
                </div>

                <div className="mt-4 lg:hidden">
                  <Button type="button" tone="lime" onClick={handleNext} className="w-full py-3 text-[13px]">
                    ถัดไป: ตรวจสอบและยืนยัน
                  </Button>
                </div>
              </div>

              {/* Confirm Step (Mobile Only) */}
              <div className={`flex flex-col space-y-4 lg:hidden ${activeStep !== 'confirm' ? 'hidden' : ''}`}>
                <h3 className="text-[14px] font-bold text-[var(--td-text-strong)]">สรุปรายการ</h3>
                <div className="rounded-[18px] border border-[rgba(0,0,0,0.06)] bg-[#fafafa] p-4 text-[13px]">
                  <div className="flex justify-between py-1.5 border-b border-black/5">
                    <span className="font-bold text-[var(--td-text-muted)]">ผู้ส่ง</span>
                    <span className="font-extrabold text-[var(--td-text-strong)]">{form.watch('senderName') || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-black/5">
                    <span className="font-bold text-[var(--td-text-muted)]">วันที่ส่ง</span>
                    <span className="font-extrabold text-[var(--td-text-strong)]">{form.watch('sentDate') || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-black/5">
                    <span className="font-bold text-[var(--td-text-muted)]">จำนวนซอง</span>
                    <span className="font-extrabold text-[var(--td-text-strong)]">{form.watch('envelopeCount') || '-'} ซอง</span>
                  </div>
                  <div className="flex justify-between py-1.5 pt-2">
                    <span className="font-bold text-[var(--td-text-muted)]">หลักฐาน</span>
                    <div className="flex items-center gap-2">
                      {envelope.file ? <span className="text-[#869b18] font-bold text-[11px] bg-[#f4f9d8] px-2 py-0.5 rounded-full">✓ หน้าซอง</span> : <span className="text-rose-400 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full">✗ หน้าซอง</span>}
                      {receipt.file ? <span className="text-[#869b18] font-bold text-[11px] bg-[#f4f9d8] px-2 py-0.5 rounded-full">✓ ใบเสร็จ</span> : <span className="text-rose-400 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full">✗ ใบเสร็จ</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Error Message */}
            <div className="hidden lg:block mt-auto pt-4">
              {errorMessage ? (
                <div className="mb-6 rounded-[22px] border border-[rgba(248,113,113,0.18)] bg-[rgba(255,241,242,0.92)] px-4 py-3 text-sm font-medium text-rose-600">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  tone="cyan"
                  disabled={submitLoading}
                  aria-busy={submitLoading}
                  className="w-full sm:flex-1 py-3.5 text-[0.95rem]"
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
                    'Submit สร้างรายการ'
                  )}
                  <FilePlus2 className="h-4 w-4" />
                </Button>
                <Link
                  to={dashboardPath}
                  className="trackdocs-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                >
                  ยกเลิก
                </Link>
              </div>
            </div>
          </Card>

          {/* Sticky Submit Bar (Mobile) */}
          <div className={`fixed bottom-[env(safe-area-inset-bottom,16px)] left-0 right-0 z-40 mb-[60px] flex-col gap-2 bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-2 pt-6 lg:hidden ${activeStep === 'confirm' ? 'flex' : 'hidden'}`}>
            {errorMessage ? (
              <div className="rounded-[14px] border border-[rgba(248,113,113,0.18)] bg-[rgba(255,241,242,0.92)] px-3 py-2 text-[11px] font-medium text-rose-600">
                {errorMessage}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Link
                to={dashboardPath}
                className="flex h-[48px] items-center justify-center rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white px-4 text-[13px] font-bold text-[var(--td-text-muted)] shadow-sm active:scale-95"
              >
                ยกเลิก
              </Link>
              <Button
                type="submit"
                tone="lime"
                disabled={submitLoading}
                aria-busy={submitLoading}
                className="h-[48px] flex-1 text-[14px]"
              >
                {submitLoading ? 'กำลังสร้างรายการ...' : 'Submit สร้างรายการ'}
              </Button>
            </div>
          </div>
        </form>

      </div>

      <Modal
        open={successOpen}
        title="สร้างรายการสำเร็จ"
        description={`เลขรายการ: ${successTrackingNo}`}
        onClose={() => {
          setSuccessOpen(false)
          navigate(dashboardPath, { replace: true })
        }}
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              tone="cyan"
              onClick={() => {
                setSuccessOpen(false)
                navigate(dashboardPath, { replace: true })
              }}
            >
              ไปแดชบอร์ด
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[rgba(190,213,43,0.16)] bg-[#f4f9d8] p-5">
            <p className="trackdocs-text-badge text-[#869b18]">
              Tracking No
            </p>
            <p className="mt-3 trackdocs-text-page-title text-[#172008]">
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



