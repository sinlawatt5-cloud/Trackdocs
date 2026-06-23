export type UserRole = 'customer' | 'operation' | 'admin'
export type Role = UserRole

export type ShipmentStatus = 'NOT_RECEIVED' | 'RECEIVED'

export type ImageType = 'envelope' | 'receipt' | 'received'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  role: UserRole
  customerId: string | null
  customerCode: string | null
  isActive: boolean
}

export type SessionUser = UserProfile

export interface Customer {
  customerId: string
  companyName: string
  companyCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Shipment {
  shipmentId: string
  trackingNo: string
  customerId: string
  customerCode: string
  customerName: string
  senderName: string
  senderPhone: string
  sentDate: string
  envelopeCount: number
  customerNote: string
  envelopeImageKey: string
  envelopeImageUrl: string
  receiptImageKey: string
  receiptImageUrl: string
  receivedImageKey: string
  receivedImageUrl: string
  status: ShipmentStatus
  createdAt: string
  createdBy: string
  createdByName: string
  receivedAt: string
  receivedBy: string
  receivedByName: string
  operationReceiveNote: string
  updatedAt: string
}

export interface ShipmentCounter {
  companyCode: string
  lastNumber: number
  updatedAt: string
}

export interface ShipmentFormValues {
  customerId: string
  customerCode: string
  customerName: string
  senderName: string
  senderPhone: string
  sentDate: string
  envelopeCount: number
  customerNote: string
}

export interface ShipmentImageDraft {
  file: File | null
  previewUrl: string
  key: string
  url: string
}

export interface DashboardStat {
  label: string
  value: string
  tone: 'cyan' | 'amber' | 'green' | 'red' | 'slate'
  description: string
}

export interface FilterState {
  query: string
  status: 'all' | ShipmentStatus
  customerCode: string
}

export interface ReceivePayload {
  shipmentId: string
  operationReceiveNote: string
  receivedImageFile?: File | null
}

export interface UploadResult {
  key: string
  url: string
}
