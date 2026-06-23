import { formatISO, subDays } from 'date-fns'
import type { Customer, SessionUser, Shipment } from '../types'

const now = new Date()

function iso(daysAgo: number) {
  return formatISO(subDays(now, daysAgo))
}

function svgPlaceholder(label: string, accent = '#d7ea49') {
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0b1220"/>
          <stop offset="100%" stop-color="#07111f"/>
        </linearGradient>
      </defs>
      <rect width="960" height="640" rx="36" fill="url(#g)" />
      <rect x="54" y="54" width="852" height="532" rx="30" fill="rgba(255,255,255,0.03)" stroke="${accent}" stroke-opacity="0.4"/>
      <circle cx="118" cy="128" r="22" fill="${accent}" fill-opacity="0.85"/>
      <text x="84" y="342" fill="#e5eefb" font-size="54" font-family="Inter, Noto Sans Thai, Arial, sans-serif" font-weight="700">${label}</text>
      <text x="84" y="392" fill="#8ca3c7" font-size="23" font-family="Inter, Noto Sans Thai, Arial, sans-serif">TrackDocs proof image</text>
    </svg>
  `)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

export const demoCustomers: Customer[] = [
  {
    customerId: 'customer-sms',
    companyName: 'Siam Marine Services',
    companyCode: 'SMS',
    isActive: true,
    createdAt: iso(120),
    updatedAt: iso(1),
  },
  {
    customerId: 'customer-aml',
    companyName: 'AM Logistics',
    companyCode: 'AML',
    isActive: true,
    createdAt: iso(100),
    updatedAt: iso(1),
  },
]

export const demoUsers: SessionUser[] = [
  {
    uid: 'user-sms',
    displayName: 'SMS Customer',
    email: 'sms.customer@trackdocs.local',
    role: 'customer',
    customerId: 'customer-sms',
    customerCode: 'SMS',
    isActive: true,
  },
  {
    uid: 'user-aml',
    displayName: 'AML Customer',
    email: 'aml.customer@trackdocs.local',
    role: 'customer',
    customerId: 'customer-aml',
    customerCode: 'AML',
    isActive: true,
  },
  {
    uid: 'user-op',
    displayName: 'Operation Lead',
    email: 'operation@trackdocs.local',
    role: 'operation',
    customerId: null,
    customerCode: null,
    isActive: true,
  },
  {
    uid: 'user-admin',
    displayName: 'TrackDocs Admin',
    email: 'admin@trackdocs.local',
    role: 'admin',
    customerId: null,
    customerCode: null,
    isActive: true,
  },
]

export const demoCredentials = {
  password: 'TrackDocs123!',
}

export const baseShipments: Shipment[] = [
  {
    shipmentId: 'ship-001',
    trackingNo: 'SMS-001',
    customerId: 'customer-sms',
    customerCode: 'SMS',
    customerName: 'Siam Marine Services',
    senderName: 'Nopparat K.',
    senderPhone: '081-555-0101',
    sentDate: iso(2),
    envelopeCount: 3,
    customerNote: 'เอกสารสัญญารอบเดือน พร้อมใบรับรองแนบในซองเดียว',
    envelopeImageKey: 'shipments/SMS/SMS-001/envelope.webp',
    envelopeImageUrl: svgPlaceholder('Envelope'),
    receiptImageKey: 'shipments/SMS/SMS-001/receipt.webp',
    receiptImageUrl: svgPlaceholder('Receipt'),
    receivedImageKey: '',
    receivedImageUrl: '',
    status: 'NOT_RECEIVED',
    createdAt: iso(2),
    createdBy: 'user-sms',
    createdByName: 'SMS Customer',
    receivedAt: '',
    receivedBy: '',
    receivedByName: '',
    operationReceiveNote: '',
    updatedAt: iso(2),
  },
  {
    shipmentId: 'ship-002',
    trackingNo: 'AML-001',
    customerId: 'customer-aml',
    customerCode: 'AML',
    customerName: 'AM Logistics',
    senderName: 'Pimchanok T.',
    senderPhone: '089-555-0202',
    sentDate: iso(4),
    envelopeCount: 1,
    customerNote: 'ชุดใบกำกับภาษีและเอกสารเดินรถ',
    envelopeImageKey: 'shipments/AML/AML-001/envelope.webp',
    envelopeImageUrl: svgPlaceholder('Envelope'),
    receiptImageKey: 'shipments/AML/AML-001/receipt.webp',
    receiptImageUrl: svgPlaceholder('Receipt'),
    receivedImageKey: 'shipments/AML/AML-001/received.webp',
    receivedImageUrl: svgPlaceholder('Received', '#b9d82b'),
    status: 'RECEIVED',
    createdAt: iso(4),
    createdBy: 'user-aml',
    createdByName: 'AML Customer',
    receivedAt: iso(3),
    receivedBy: 'user-op',
    receivedByName: 'Operation Lead',
    operationReceiveNote: 'รับเอกสารครบถ้วนตอน 14:25 น.',
    updatedAt: iso(3),
  },
  {
    shipmentId: 'ship-003',
    trackingNo: 'SMS-002',
    customerId: 'customer-sms',
    customerCode: 'SMS',
    customerName: 'Siam Marine Services',
    senderName: 'Supachai M.',
    senderPhone: '086-555-0303',
    sentDate: iso(6),
    envelopeCount: 2,
    customerNote: 'เอกสารอนุมัติและสรุปงานส่งรอบเช้า',
    envelopeImageKey: 'shipments/SMS/SMS-002/envelope.webp',
    envelopeImageUrl: svgPlaceholder('Envelope'),
    receiptImageKey: 'shipments/SMS/SMS-002/receipt.webp',
    receiptImageUrl: svgPlaceholder('Receipt'),
    receivedImageKey: '',
    receivedImageUrl: '',
    status: 'NOT_RECEIVED',
    createdAt: iso(6),
    createdBy: 'user-sms',
    createdByName: 'SMS Customer',
    receivedAt: '',
    receivedBy: '',
    receivedByName: '',
    operationReceiveNote: '',
    updatedAt: iso(6),
  },
  {
    shipmentId: 'ship-004',
    trackingNo: 'AML-002',
    customerId: 'customer-aml',
    customerCode: 'AML',
    customerName: 'AM Logistics',
    senderName: 'Wichai P.',
    senderPhone: '087-555-0404',
    sentDate: iso(8),
    envelopeCount: 4,
    customerNote: 'เอกสารนำเข้าและสำเนาใบรับรองจากคลองเตย',
    envelopeImageKey: 'shipments/AML/AML-002/envelope.webp',
    envelopeImageUrl: svgPlaceholder('Envelope'),
    receiptImageKey: 'shipments/AML/AML-002/receipt.webp',
    receiptImageUrl: svgPlaceholder('Receipt'),
    receivedImageKey: '',
    receivedImageUrl: '',
    status: 'NOT_RECEIVED',
    createdAt: iso(8),
    createdBy: 'user-aml',
    createdByName: 'AML Customer',
    receivedAt: '',
    receivedBy: '',
    receivedByName: '',
    operationReceiveNote: '',
    updatedAt: iso(8),
  },
  {
    shipmentId: 'ship-005',
    trackingNo: 'SMS-003',
    customerId: 'customer-sms',
    customerCode: 'SMS',
    customerName: 'Siam Marine Services',
    senderName: 'Anan P.',
    senderPhone: '080-555-0505',
    sentDate: iso(1),
    envelopeCount: 1,
    customerNote: 'งานด่วนสำหรับรอบบ่าย',
    envelopeImageKey: 'shipments/SMS/SMS-003/envelope.webp',
    envelopeImageUrl: svgPlaceholder('Envelope'),
    receiptImageKey: 'shipments/SMS/SMS-003/receipt.webp',
    receiptImageUrl: svgPlaceholder('Receipt'),
    receivedImageKey: '',
    receivedImageUrl: '',
    status: 'NOT_RECEIVED',
    createdAt: iso(1),
    createdBy: 'user-sms',
    createdByName: 'SMS Customer',
    receivedAt: '',
    receivedBy: '',
    receivedByName: '',
    operationReceiveNote: '',
    updatedAt: iso(1),
  },
]

export const demoPasswordsByEmail: Record<string, string> = {
  'sms.customer@trackdocs.local': demoCredentials.password,
  'aml.customer@trackdocs.local': demoCredentials.password,
  'operation@trackdocs.local': demoCredentials.password,
  'admin@trackdocs.local': demoCredentials.password,
}

export const demoSessionKey = 'trackdocs:demo-session'
export const demoShipmentKey = 'trackdocs:demo-shipments'
export const demoCounterKey = 'trackdocs:demo-counters'
