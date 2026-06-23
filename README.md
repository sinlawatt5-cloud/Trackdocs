# TrackDocs

เว็บแอปสำหรับติดตามเอกสาร

## สิ่งที่มีในขั้นนี้

- Vite + React + TypeScript
- Tailwind CSS
- Firebase client helpers
- Cloudflare R2 upload helper
- UI สำหรับ `login`, `customer`, `operation`, `admin`, และหน้ารายละเอียด shipment
- โหมดเดโม่สำหรับเปิดใช้งาน frontend ได้แม้ยังไม่ต่อ backend จริง

## ติดตั้ง

```bash
npm install
```

## ตั้งค่า environment

1. คัดลอก `.env.example` เป็น `.env.local`
2. ใส่ค่า Firebase และ Worker ตามโปรเจกต์จริง
3. ถ้ายังไม่พร้อมต่อ backend ให้ใช้ `VITE_DEMO_MODE=true`

## รันโปรเจกต์

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Demo account

ใช้ได้ในโหมดเดโม่:

- `sms.customer@trackdocs.local` / `TrackDocs123!`
- `aml.customer@trackdocs.local` / `TrackDocs123!`
- `operation@trackdocs.local` / `TrackDocs123!`
- `admin@trackdocs.local` / `TrackDocs123!`

## โครงสร้างไฟล์สำคัญ

- `src/lib/firebase.ts` - init Firebase client
- `src/lib/auth.ts` - sign in/out และ session handling
- `src/lib/firestore.ts` - helpers สำหรับ shipment/customer/user
- `src/lib/r2Upload.ts` - upload ไฟล์ไป Cloudflare Worker
- `src/types/index.ts` - type กลางของระบบ
- `src/components/` - ชุด component ของ UI
- `src/pages/` - route pages ทั้งหมด

## หมายเหตุ

- โปรเจกต์นี้ยังไม่รวม backend worker และ Firestore rules ใน step นี้
- เมื่อเชื่อม Firebase จริงแล้ว UI จะใช้ auth และ Firestore ที่ตั้งค่าไว้ใน env
- ห้าม commit `.env.local`, token, secret, หรือ password ลง GitHub

## Next step

ขั้นถัดไปจะเป็นการเติม Worker, Firestore rules, และ deployment config ให้ครบตามสถาปัตยกรรม TrackDocs
