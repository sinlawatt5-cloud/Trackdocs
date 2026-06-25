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



  if (authLoading || loadingCustomer) {
    return (
      <AppShell density="compact" title="แจ้งส่งเอกสารใหม่" subtitle="กำลังเตรียมข้อมูล...">
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
      <AppShell density="compact" title="แจ้งส่งเอกสารใหม่" subtitle="พบข้อผิดพลาด">
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

  return (
    <AppShell
      density="compact"
      title="แจ้งส่งเอกสารใหม่"
      subtitle="ระบุรายละเอียดจำนวนซองและอัปโหลดรูปถ่ายหลักฐาน เพื่อบันทึกข้อมูลเข้าระบบ"
    >
      <div className="trackdocs-page-entrance w-full max-w-6xl mx-auto">
        <form className="trackdocs-stagger-list space-y-6" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
          <Card tone="glass" padding="lg" className="trackdocs-stagger-list space-y-8">
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

            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] xl:grid-cols-[0.85fr_1.15fr] xl:gap-12">
              {/* Left Column: Form Inputs & Actions */}
              <div className="flex flex-col space-y-6">
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

                <div className="mt-auto pt-4">
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
                      to="/customer/dashboard"
                      className="trackdocs-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                    >
                      ยกเลิก
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Image Uploaders */}
              <div className="flex flex-col space-y-6 rounded-[24px] border border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.5)] p-6 lg:p-7">
                <div>
                  <h3 className="trackdocs-text-section-title text-[1.1rem]">หลักฐานการจัดส่ง</h3>
                  <p className="mt-1 trackdocs-text-helper">
                    อัปโหลดรูปภาพเพื่อใช้เป็นหลักฐานในการตรวจสอบ (ไม่เกิน 10MB)
                  </p>
                </div>
                
                <div className="flex-1 grid gap-6 sm:grid-cols-2">
                  <ImageUploader
                    label="รูปหน้าซอง"
                    description="รูปถ่ายหน้าซองที่เห็นรายละเอียดชัดเจน"
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
                    description="รูปถ่ายใบเสร็จ (ห้ามเห็นหมายเลข Tracking)"
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
            </div>
          </Card>
        </form>


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



