import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { buildShipmentObjectKey } from './r2Upload'
import type {
  Customer,
  ReceivePayload,
  Role,
  SessionUser,
  Shipment,
  ShipmentCounter,
  ShipmentStatus,
  UserProfile,
} from '../types'

export interface ShipmentQueryFilters {
  status?: ShipmentStatus | 'all'
  search?: string
  date?: string
  companyCode?: string | 'all'
  limitCount?: number
}

export interface CreateShipmentInput {
  trackingNo: string
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
  userProfile: UserProfile
}

export interface ReceiveShipmentInput {
  userProfile: UserProfile
  operationReceiveNote: string
  receivedImageKey?: string
  receivedImageUrl?: string
}

export interface UpdateCustomerInput {
  companyName?: string
  companyCode?: string
  isActive?: boolean
}

export interface CreateCustomerInput {
  companyName: string
  companyCode: string
  isActive: boolean
}

export interface UpdateUserProfileInput {
  displayName?: string
  email?: string
  role?: Role
  customerId?: string | null
  customerCode?: string | null
  isActive?: boolean
}

type FirestoreTimestampLike = {
  toDate: () => Date
}

function hasFirestoreTimestamp(value: unknown): value is FirestoreTimestampLike {
  return Boolean(value && typeof value === 'object' && 'toDate' in value && typeof (value as FirestoreTimestampLike).toDate === 'function')
}

function toIsoString(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (hasFirestoreTimestamp(value)) {
    return value.toDate().toISOString()
  }

  return ''
}

function toNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function isUserRole(value: unknown): value is Role {
  return value === 'customer' || value === 'operation' || value === 'admin'
}

function isShipmentStatus(value: unknown): value is ShipmentStatus {
  return value === 'NOT_RECEIVED' || value === 'RECEIVED'
}

function normalizeUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    displayName: toStringValue(data.displayName, 'TrackDocs User'),
    email: toStringValue(data.email),
    role: isUserRole(data.role) ? data.role : 'customer',
    customerId: toNullableString(data.customerId),
    customerCode: toNullableString(data.customerCode),
    isActive: data.isActive !== false,
  }
}

function normalizeCustomer(customerId: string, data: Record<string, unknown>): Customer {
  return {
    customerId: toStringValue(data.customerId, customerId) || customerId,
    companyName: toStringValue(data.companyName),
    companyCode: toStringValue(data.companyCode),
    isActive: data.isActive !== false,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function normalizeShipment(shipmentId: string, data: Record<string, unknown>): Shipment {
  return {
    shipmentId: toStringValue(data.shipmentId, shipmentId) || shipmentId,
    trackingNo: toStringValue(data.trackingNo),
    customerId: toStringValue(data.customerId),
    customerCode: toStringValue(data.customerCode),
    customerName: toStringValue(data.customerName),
    senderName: toStringValue(data.senderName),
    senderPhone: toStringValue(data.senderPhone),
    sentDate: toStringValue(data.sentDate),
    envelopeCount: typeof data.envelopeCount === 'number' ? data.envelopeCount : Number(data.envelopeCount ?? 0),
    customerNote: toStringValue(data.customerNote),
    envelopeImageKey: toStringValue(data.envelopeImageKey),
    envelopeImageUrl: toStringValue(data.envelopeImageUrl),
    receiptImageKey: toStringValue(data.receiptImageKey),
    receiptImageUrl: toStringValue(data.receiptImageUrl),
    receivedImageKey: toStringValue(data.receivedImageKey),
    receivedImageUrl: toStringValue(data.receivedImageUrl),
    status: isShipmentStatus(data.status) ? data.status : 'NOT_RECEIVED',
    createdAt: toIsoString(data.createdAt),
    createdBy: toStringValue(data.createdBy),
    createdByName: toStringValue(data.createdByName),
    receivedAt: toIsoString(data.receivedAt),
    receivedBy: toStringValue(data.receivedBy),
    receivedByName: toStringValue(data.receivedByName),
    operationReceiveNote: toStringValue(data.operationReceiveNote),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function shipmentTime(shipment: Shipment) {
  return new Date(shipment.updatedAt || shipment.createdAt || shipment.sentDate || '').getTime() || 0
}

function sortByLatest(shipments: Shipment[]) {
  return [...shipments].sort((left, right) => shipmentTime(right) - shipmentTime(left))
}

function sortOperationShipments(shipments: Shipment[]) {
  return [...shipments].sort((left, right) => {
    const leftRank = left.status === 'NOT_RECEIVED' ? 0 : 1
    const rightRank = right.status === 'NOT_RECEIVED' ? 0 : 1
    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    const timeDiff = shipmentTime(right) - shipmentTime(left)
    if (timeDiff !== 0) {
      return timeDiff
    }

    return right.trackingNo.localeCompare(left.trackingNo)
  })
}

function normalizeSearch(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

function resolveDateFilter(date?: string) {
  if (!date) {
    return null
  }

  if (date === 'today') {
    return new Date().toISOString().slice(0, 10)
  }

  return date.slice(0, 10)
}

function matchesShipmentFilters(shipment: Shipment, filters?: ShipmentQueryFilters) {
  const statusFilter = filters?.status ?? 'all'
  if (statusFilter !== 'all' && shipment.status !== statusFilter) {
    return false
  }

  const companyCodeFilter = filters?.companyCode ?? 'all'
  if (companyCodeFilter !== 'all' && shipment.customerCode !== companyCodeFilter) {
    return false
  }

  const dateFilter = resolveDateFilter(filters?.date)
  if (dateFilter) {
    const candidateDates = [
      shipment.sentDate,
      shipment.createdAt,
      shipment.updatedAt,
      shipment.receivedAt,
    ]
      .filter(Boolean)
      .map((date) => date.slice(0, 10))

    if (!candidateDates.includes(dateFilter)) {
      return false
    }
  }

  const search = normalizeSearch(filters?.search)
  if (search) {
    const haystack = [
      shipment.trackingNo,
      shipment.customerName,
      shipment.senderName,
      shipment.senderPhone,
      shipment.customerNote,
      shipment.createdByName,
      shipment.receivedByName,
      shipment.operationReceiveNote,
    ]
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  return true
}

function shipmentCsvEscape(value: string | number | boolean | null | undefined) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

async function fetchShipmentSnapshotList() {
  const snapshots = await getDocs(query(collection(db, 'shipments'), orderBy('createdAt', 'desc')))
  return snapshots.docs.map((snapshot) => normalizeShipment(snapshot.id, snapshot.data() as Record<string, unknown>))
}

async function fetchCustomerShipmentSnapshotList(customerId: string, limitCount: number) {
  const snapshots = await getDocs(
    query(collection(db, 'shipments'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'), limit(limitCount)),
  )
  return snapshots.docs.map((snapshot) => normalizeShipment(snapshot.id, snapshot.data() as Record<string, unknown>))
}

async function fetchUserSnapshotList() {
  const snapshots = await getDocs(query(collection(db, 'users'), orderBy('displayName', 'asc')))
  return snapshots.docs.map((snapshot) => normalizeUserProfile(snapshot.id, snapshot.data() as Record<string, unknown>))
}

async function fetchCustomerSnapshotList() {
  const snapshots = await getDocs(query(collection(db, 'customers'), orderBy('companyName', 'asc')))
  return snapshots.docs.map((snapshot) => normalizeCustomer(snapshot.id, snapshot.data() as Record<string, unknown>))
}

function formatTrackingNumber(value: number) {
  return value >= 1000 ? String(value) : String(value).padStart(3, '0')
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, 'users', uid))

  if (!snapshot.exists()) {
    return null
  }

  return normalizeUserProfile(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function getCustomers() {
  return fetchCustomerSnapshotList()
}

export async function getCustomerById(customerId: string) {
  const snapshot = await getDoc(doc(db, 'customers', customerId))

  if (!snapshot.exists()) {
    return null
  }

  return normalizeCustomer(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function createCustomer(customerId: string, data: CreateCustomerInput) {
  const ref = doc(db, 'customers', customerId)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    await setDoc(ref, {
      customerId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(
      ref,
      {
        customerId,
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  return getCustomerById(customerId)
}

export async function reserveTrackingNoWithTransaction(userProfile: UserProfile) {
  if (userProfile.role !== 'customer' && userProfile.role !== 'operation' && userProfile.role !== 'admin') {
    throw new Error('เฉพาะลูกค้า, แผนกปฏิบัติการ และผู้ดูแลระบบเท่านั้นที่จองเลขรายการได้')
  }

  const customerCode = userProfile.customerCode?.trim()
  if (!customerCode) {
    throw new Error('ไม่พบรหัสลูกค้าในโปรไฟล์ผู้ใช้งาน')
  }

  const counterRef = doc(db, 'shipmentCounters', customerCode)
  const nextNumber = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef)
    const current = snapshot.exists() ? ((snapshot.data() as ShipmentCounter).lastNumber ?? 0) : 0
    const next = current + 1

    transaction.set(
      counterRef,
      {
        companyCode: customerCode,
        lastNumber: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return next
  })

  return `${customerCode}-${formatTrackingNumber(nextNumber)}`
}

export async function getNextTrackingNo(companyCode: string) {
  const counterRef = doc(db, 'shipmentCounters', companyCode)
  const nextNumber = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef)
    const current = snapshot.exists() ? ((snapshot.data() as ShipmentCounter).lastNumber ?? 0) : 0
    const next = current + 1

    transaction.set(
      counterRef,
      {
        companyCode,
        lastNumber: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return next
  })

  return `${companyCode}-${formatTrackingNumber(nextNumber)}`
}

export async function createShipment(data: CreateShipmentInput) {
  if (data.userProfile.role !== 'customer' && data.userProfile.role !== 'operation' && data.userProfile.role !== 'admin') {
    throw new Error('เฉพาะลูกค้า, แผนกปฏิบัติการ และผู้ดูแลระบบเท่านั้นที่สร้างรายการเอกสารได้')
  }

  if (!data.userProfile.customerId || !data.userProfile.customerCode) {
    throw new Error('ไม่พบรหัสลูกค้าในโปรไฟล์ผู้ใช้งาน')
  }

  const shipmentRef = doc(collection(db, 'shipments'))
  const nowIso = new Date().toISOString()
  const shipment: Shipment = {
    shipmentId: shipmentRef.id,
    trackingNo: data.trackingNo,
    customerId: data.userProfile.customerId,
    customerCode: data.userProfile.customerCode,
    customerName: data.customerName,
    senderName: data.senderName,
    senderPhone: data.senderPhone,
    sentDate: data.sentDate,
    envelopeCount: data.envelopeCount,
    customerNote: data.customerNote,
    envelopeImageKey: data.envelopeImageKey,
    envelopeImageUrl: data.envelopeImageUrl,
    receiptImageKey: data.receiptImageKey,
    receiptImageUrl: data.receiptImageUrl,
    receivedImageKey: '',
    receivedImageUrl: '',
    status: 'NOT_RECEIVED',
    createdAt: nowIso,
    createdBy: data.userProfile.uid,
    createdByName: data.userProfile.displayName,
    receivedAt: '',
    receivedBy: '',
    receivedByName: '',
    operationReceiveNote: '',
    updatedAt: nowIso,
  }

  await setDoc(shipmentRef, {
    ...shipment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return shipment
}

export async function getCustomerShipments(customerId: string, filters: ShipmentQueryFilters = {}) {
  const limitCount = filters.limitCount ?? 50
  const snapshots = await fetchCustomerShipmentSnapshotList(customerId, limitCount)
  return sortByLatest(snapshots.filter((shipment) => matchesShipmentFilters(shipment, filters)))
}

export async function getOperationShipments(filters: ShipmentQueryFilters = {}) {
  const limitCount = filters.limitCount ?? 50
  const snapshots = await getDocs(query(collection(db, 'shipments'), orderBy('createdAt', 'desc'), limit(limitCount)))
  const shipments = snapshots.docs.map((snapshot) => normalizeShipment(snapshot.id, snapshot.data() as Record<string, unknown>))
  return sortOperationShipments(shipments.filter((shipment) => matchesShipmentFilters(shipment, filters)))
}

export async function getShipmentById(shipmentId: string) {
  const byId = await getDoc(doc(db, 'shipments', shipmentId))
  if (byId.exists()) {
    return normalizeShipment(byId.id, byId.data() as Record<string, unknown>)
  }

  const fallback = await getDocs(query(collection(db, 'shipments'), where('trackingNo', '==', shipmentId), limit(1)))
  const docSnapshot = fallback.docs[0]

  if (!docSnapshot) {
    return null
  }

  return normalizeShipment(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
}

export async function receiveShipment(shipmentId: string, data: ReceiveShipmentInput) {
  if (data.userProfile.role !== 'operation' && data.userProfile.role !== 'admin') {
    throw new Error('เฉพาะ Operation หรือ Admin เท่านั้นที่รับเอกสารได้')
  }

  const current = await getShipmentById(shipmentId)
  if (!current) {
    throw new Error('ไม่พบรายการเอกสาร')
  }

  const updated: Shipment = {
    ...current,
    status: 'RECEIVED',
    receivedAt: new Date().toISOString(),
    receivedBy: data.userProfile.uid,
    receivedByName: data.userProfile.displayName,
    operationReceiveNote: data.operationReceiveNote,
    receivedImageKey: data.receivedImageKey ?? current.receivedImageKey ?? '',
    receivedImageUrl: data.receivedImageUrl ?? current.receivedImageUrl ?? '',
    updatedAt: new Date().toISOString(),
  }

  await updateDoc(doc(db, 'shipments', current.shipmentId), {
    status: 'RECEIVED',
    receivedAt: serverTimestamp(),
    receivedBy: data.userProfile.uid,
    receivedByName: data.userProfile.displayName,
    operationReceiveNote: data.operationReceiveNote,
    receivedImageKey: updated.receivedImageKey,
    receivedImageUrl: updated.receivedImageUrl,
    updatedAt: serverTimestamp(),
  })

  return updated
}

export async function updateCustomer(customerId: string, data: UpdateCustomerInput) {
  await setDoc(
    doc(db, 'customers', customerId),
    {
      customerId,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return getCustomerById(customerId)
}

export async function updateUserProfile(uid: string, data: UpdateUserProfileInput) {
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      ...data,
      isActive: data.isActive ?? true,
    },
    { merge: true },
  )

  return getUserProfile(uid)
}

export async function exportShipmentsCsv(filters: ShipmentQueryFilters = {}) {
  const shipments = sortOperationShipments(
    (await fetchShipmentSnapshotList()).filter((shipment) => matchesShipmentFilters(shipment, filters)),
  )

  const header = [
    'trackingNo',
    'customerCode',
    'customerName',
    'senderName',
    'sentDate',
    'envelopeCount',
    'customerNote',
    'status',
    'createdAt',
    'receivedAt',
    'receivedByName',
  ]

  const rows = shipments.map((shipment) =>
    [
      shipment.trackingNo,
      shipment.customerCode,
      shipment.customerName,
      shipment.senderName,
      shipment.sentDate,
      shipment.envelopeCount,
      shipment.customerNote,
      shipment.status,
      shipment.createdAt,
      shipment.receivedAt,
      shipment.receivedByName,
    ]
      .map((value) => shipmentCsvEscape(value))
      .join(','),
  )

  return [header.map((value) => shipmentCsvEscape(value)).join(','), ...rows].join('\n')
}

export async function listCustomers() {
  return getCustomers()
}

export async function listUsers() {
  return fetchUserSnapshotList()
}

export async function listShipmentsForRole(params: {
  role: Role
  customerId?: string | null
  customerCode?: string | null
  limitCount?: number
}) {
  const limitCount = params.limitCount ?? 50

  if (params.role === 'customer') {
    if (!params.customerId) {
      return []
    }

    return getCustomerShipments(params.customerId, { limitCount })
  }

  return getOperationShipments({ limitCount })
}

export async function createShipmentRecord(params: {
  trackingNo: string
  form: {
    customerName: string
    senderName: string
    senderPhone: string
    sentDate: string
    envelopeCount: number
    customerNote: string
  }
  envelopeImage: { key: string; url: string }
  receiptImage: { key: string; url: string }
  createdBy: SessionUser
}) {
  return createShipment({
    trackingNo: params.trackingNo,
    customerName: params.form.customerName,
    senderName: params.form.senderName,
    senderPhone: params.form.senderPhone,
    sentDate: params.form.sentDate,
    envelopeCount: params.form.envelopeCount,
    customerNote: params.form.customerNote,
    envelopeImageKey: params.envelopeImage.key,
    envelopeImageUrl: params.envelopeImage.url,
    receiptImageKey: params.receiptImage.key,
    receiptImageUrl: params.receiptImage.url,
    userProfile: params.createdBy,
  })
}

export async function receiveShipmentRecord(
  params: ReceivePayload & {
    receivedBy: SessionUser
    receivedImage?: { key: string; url: string } | null
  },
) {
  return receiveShipment(params.shipmentId, {
    userProfile: params.receivedBy,
    operationReceiveNote: params.operationReceiveNote,
    receivedImageKey: params.receivedImage?.key,
    receivedImageUrl: params.receivedImage?.url,
  })
}

export function buildShipmentImageKey(customerCode: string, trackingNo: string, imageType: 'envelope' | 'receipt' | 'received') {
  return buildShipmentObjectKey(customerCode, trackingNo, imageType)
}
