// The ONLY place Thai user-facing text exists (SPEC-001 §2, §7).
//
// All 27 keys and their values are copied verbatim from SPEC-001 §7. The keys are
// fixed by the SPEC; the values are the human's to approve. A wording correction is
// a one-line change in this file and NOWHERE else — never branch on a message's
// text, never bake one into a component, a store or a test.

export const th = {
  'app.windowTitle': 'โปรแกรมออกแบบเลย์เอาต์ภาพ', // application window title
  'mode.designer': 'ออกแบบเลย์เอาต์', // tab: Layout Designer
  'mode.useTemplate': 'ใช้เทมเพลต', // tab: Use Template
  'mode.useTemplate.badge': 'ยังไม่พร้อมใช้งาน', // short "not available yet" marker on that tab
  'toolbar.templateName': 'ชื่อเทมเพลต', // label of the template-name input
  'toolbar.canvasWidth': 'ความกว้าง (px)', // label: canvas width
  'toolbar.canvasHeight': 'ความสูง (px)', // label: canvas height
  'toolbar.addSlot': 'เพิ่มช่อง', // button: add a slot
  'toolbar.save': 'บันทึกเทมเพลต', // button: save template
  'toolbar.load': 'เปิดเทมเพลต', // button: load template
  'toolbar.darkMode': 'โหมดมืด', // label of the dark-mode toggle
  'panel.slotsHeading': 'รายการช่อง', // heading of the slot list
  'panel.empty': 'ยังไม่มีช่องในเลย์เอาต์', // text shown when there are no slots yet
  'panel.bringForward': 'เลื่อนขึ้นหน้า', // button/tooltip: bring slot forward
  'panel.sendBackward': 'เลื่อนลงหลัง', // button/tooltip: send slot backward
  'panel.delete': 'ลบช่อง', // button/tooltip: delete slot
  'props.heading': 'คุณสมบัติช่อง', // heading of the slot properties panel
  'props.name': 'ชื่อช่อง', // label: slot name
  'props.color': 'สีช่อง', // label: slot colour
  'dialog.save.title': 'บันทึกไฟล์เทมเพลต', // native Save dialog title
  'dialog.open.title': 'เปิดไฟล์เทมเพลต', // native Open dialog title
  'dialog.fileTypeLabel': 'ไฟล์เทมเพลต (JSON)', // file-type label for the JSON filter
  'error.saveFailed': 'บันทึกไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', // writing the file failed (`WRITE_FAILED`)
  'error.loadFailed': 'เปิดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', // reading the file failed (`READ_FAILED`)
  'error.fileUnreadable': 'ไฟล์นี้ไม่ใช่ไฟล์เทมเพลตที่ใช้งานได้', // the chosen file is not a valid template
  'error.duplicateSlotName': 'มีช่องที่ใช้ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น', // duplicate-rename warning (REQ-001 Q11 / Req 15 / A11)
  'error.blankSlotName': 'ชื่อช่องต้องไม่เว้นว่าง กรุณาตั้งชื่อใหม่', // blank-name warning (REQ-001 Q13 / Req 16 / A15)
} as const;

export type ThKey = keyof typeof th;
