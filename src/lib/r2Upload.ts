import imageCompression from 'browser-image-compression'
import { auth } from './firebase'
import { r2WorkerUrl } from './env'
import type { ImageType, UploadResult } from '../types'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function buildShipmentObjectKey(customerCode: string, trackingNo: string, imageType: ImageType) {
  return `shipments/${customerCode}/${trackingNo}/${imageType}.webp`
}

export async function getFirebaseIdToken() {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('ไม่พบสถานะเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
  }

  try {
    return await currentUser.getIdToken()
  } catch {
    throw new Error('ไม่พบสถานะเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
  }
}

export function validateImageFile(file: File | null | undefined) {
  if (!file || !file.type.startsWith('image/')) {
    return 'กรุณาเลือกไฟล์รูปภาพเท่านั้น'
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'รูปภาพต้องไม่เกิน 10MB'
  }

  return null
}

export async function compressImageIfNeeded(file: File) {
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  if (file.size <= 1.5 * 1024 * 1024) {
    return file
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 3.2,
      maxWidthOrHeight: 2200,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.9,
      alwaysKeepResolution: true,
    })

    if (compressed.size > MAX_IMAGE_BYTES) {
      throw new Error('รูปภาพต้องไม่เกิน 10MB')
    }

    return new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: compressed.type || 'image/webp',
      lastModified: Date.now(),
    })
  } catch {
    if (file.size <= MAX_IMAGE_BYTES) {
      return file
    }

    throw new Error('รูปภาพต้องไม่เกิน 10MB')
  }
}

export async function uploadImageToR2(params: {
  file: File
  customerCode: string
  trackingNo: string
  imageType: ImageType
}): Promise<UploadResult> {
  const validationError = validateImageFile(params.file)
  if (validationError) {
    throw new Error(validationError)
  }

  const preparedFile = await compressImageIfNeeded(params.file)
  const formData = new FormData()
  const key = buildShipmentObjectKey(params.customerCode, params.trackingNo, params.imageType)

  formData.append('file', preparedFile)
  formData.append('key', key)
  formData.append('customerCode', params.customerCode)
  formData.append('trackingNo', params.trackingNo)
  formData.append('imageType', params.imageType)

  try {
    const response = await fetch(`${r2WorkerUrl.replace(/\/$/, '')}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let message = 'อัปโหลดรูปไม่สำเร็จ'

      try {
        const payload = (await response.json()) as Partial<{ error: string; message: string }>
        message = payload.error || payload.message || message
      } catch {
        const text = await response.text()
        message = text || message
      }

      throw new Error(message)
    }

    const payload = (await response.json()) as Partial<UploadResult>
    if (!payload.key || !payload.url) {
      throw new Error('อัปโหลดรูปไม่สำเร็จ')
    }

    return {
      key: payload.key,
      url: payload.url,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' ||
        error.message === 'รูปภาพต้องไม่เกิน 10MB' ||
        error.message === 'ไม่พบสถานะเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่'
      ) {
        throw error
      }

      if (error.message && error.message !== 'Failed to fetch') {
        throw error
      }
    }

    throw new Error('ไม่สามารถเชื่อมต่อระบบเก็บรูปได้')
  }
}

export async function checkR2WorkerHealth() {
  try {
    const response = await fetch(`${r2WorkerUrl.replace(/\/$/, '')}/health`, {
      method: 'GET',
    })

    return response.ok
  } catch {
    return false
  }
}

export async function prepareShipmentImage(file: File) {
  return compressImageIfNeeded(file)
}

export async function uploadShipmentImage(params: {
  file: File
  customerCode: string
  trackingNo: string
  imageType: ImageType
}) {
  return uploadImageToR2(params)
}
