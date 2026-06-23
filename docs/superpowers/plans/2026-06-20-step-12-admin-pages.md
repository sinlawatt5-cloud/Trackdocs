# STEP 12 Admin Pages Plan

## เป้าหมาย
- สร้างหน้า `/admin/dashboard`, `/admin/customers`, `/admin/users`, `/admin/reports`
- ให้ admin เท่านั้นเข้าได้
- เพิ่ม flow เพิ่ม/แก้ข้อมูล customers และ users ด้วย confirmation ก่อนบันทึก
- เพิ่มตัวกรองรายงานและ export CSV ที่ตรงฟิลด์ที่สเปกกำหนด

## แนวทาง
- ใช้ layout เดิมของ TrackDocs เพื่อให้ UI ต่อเนื่อง
- ใช้ modal + confirmation dialog สำหรับการแก้ข้อมูลสำคัญ
- ใช้ฟอร์มและตารางที่เรียบง่าย อ่านง่าย รองรับมือถือ
- จำกัดการ export CSV ให้มีเฉพาะฟิลด์ที่กำหนดในสเปก

## งานย่อย
1. ปรับ `src/lib/firestore.ts`
   - เพิ่ม helper สำหรับสร้าง customer ใหม่
   - ปรับ export CSV ให้มีฟิลด์ตามสเปก
2. สร้าง/ปรับ component เล็ก ๆ ที่จำเป็น
   - select field ที่ใช้ซ้ำ
3. อัปเดตหน้า admin ทั้ง 4 หน้า
   - dashboard stats ตามสเปก
   - customers list + add/edit modal
   - users list + edit modal
   - reports filters + export CSV
4. รัน build และแก้ error ที่เหลือ

## เกณฑ์ผ่าน
- build ผ่าน
- แอดมินเปิดได้เฉพาะ role admin
- ฟอร์มแก้ข้อมูลมี confirmation ก่อนบันทึก
- CSV export ได้ฟิลด์ครบตามที่กำหนด
