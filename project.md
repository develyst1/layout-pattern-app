
สร้างแอป Desktop ด้วย Electron + React + TypeScript + Konva.js สำหรับทำ Photo Pattern / Collage Template

### ความต้องการหลัก

มี 2 โหมด:

#### 1. Layout Designer
- มี Stage ของ Konva ที่สามารถกำหนดขนาด canvas ได้ (default 1080x1920)
- ปุ่มเพิ่ม Slot (สี่เหลี่ยม)
- แต่ละ Slot สามารถ:
  - ลากย้ายได้
  - ย่อขยายได้ด้วย Transformer
  - ตั้งชื่อได้ (เช่น background, top_left, top_right, bottom_left, bottom_right, center, center_top)
  - เปลี่ยนสีเพื่อแยกแยะ
  - ปรับ z-index
- มีรายการ Slot ด้านข้าง แสดงชื่อ + ลบได้
- ปุ่ม Save Template → บันทึกเป็นไฟล์ JSON ในโฟลเดอร์ templates/ (ใช้ Electron dialog หรือ fs)
- ปุ่ม Load Template → โหลด JSON กลับมาแก้ไขต่อได้
- แสดงชื่อ Slot บนสี่เหลี่ยมด้วย Text ของ Konva

#### 2. Use Template
- เลือก Template จากรายการที่มี
- แสดง preview layout (สี่เหลี่ยมโปร่งใส + ชื่อ)
- สามารถอัปโหลดรูปเข้าไปในแต่ละ Slot ได้ (หรือลากหลายไฟล์แล้วจับคู่ตามลำดับ)
- แสดงรูปจริงใน Slot แบบ object-fit: cover (center crop)
- ปุ่ม Generate:
  - สร้างภาพผลลัพธ์ความละเอียดสูงตามขนาด canvas ของ template
  - วางรูปตามตำแหน่งและขนาดที่กำหนด (ใช้ cover)
  - บันทึกเป็น PNG ผ่าน Electron dialog

### Tech Stack
- Electron (latest)
- React 18 + TypeScript
- Vite
- Konva + react-konva
- Zustand (state management)
- Tailwind CSS (optional แต่แนะนำ)

### โครงสร้างไฟล์
จัดให้เป็นระเบียบตามมาตรฐาน Electron + Vite + React

### เพิ่มเติม
- รองรับ dark mode พื้นฐาน
- UI สะอาด ใช้งานง่าย
- เมื่อ Save Template ให้เก็บข้อมูล: name, canvasWidth, canvasHeight, slots[] (id, name, x, y, width, height, zIndex)

เริ่มจากสร้างโครงสร้างโปรเจกต์และหน้า Layout Designer ให้ใช้งานได้ก่อน แล้วค่อยทำโหมด Use Template