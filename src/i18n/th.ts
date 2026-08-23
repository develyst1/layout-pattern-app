// The ONLY place Thai user-facing text exists (SPEC-001 §2, §7).
//
// All 39 keys and their values are copied verbatim from the SPEC that introduced
// them — 26 from SPEC-001 §7 and 13 from SPEC-002 §7 (whose 18 strings the human
// approved on 2026-08-23, REQ-002 Q13). SPEC-001's 27th, `mode.useTemplate.badge`,
// was deleted by TASK-007: the mode is available now, so it became dead text. The
// keys are fixed by the SPEC; the values are the human's to approve. A wording correction is
// a one-line change in this file and NOWHERE else — never branch on a message's
// text, never bake one into a component, a store or a test.

export const th = {
  'app.windowTitle': 'โปรแกรมออกแบบเลย์เอาต์ภาพ', // application window title
  'mode.designer': 'ออกแบบเลย์เอาต์', // tab: Layout Designer
  'mode.useTemplate': 'ใช้เทมเพลต', // tab: Use Template
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
  'props.required': 'ต้องใส่รูป', // designer: checkbox label; checked = the slot is required
  'useTemplate.pickTemplate': 'เลือกเทมเพลต', // button: choose the template .json
  'useTemplate.noTemplate': 'ยังไม่ได้เลือกเทมเพลต', // shown before any template is chosen
  'useTemplate.currentTemplate': 'เทมเพลตที่ใช้อยู่', // label in front of the loaded template's name
  'useTemplate.pickPhoto': 'เลือกรูป', // per-row button: put one photo in this slot
  'useTemplate.pickManyPhotos': 'เลือกหลายรูป', // toolbar button: fill slots from several photos at once
  'useTemplate.removePhoto': 'เอารูปออก', // per-row button: take the photo back out
  'useTemplate.slotEmpty': 'ยังไม่มีรูป', // marker on a row whose slot has no photo
  'useTemplate.slotRequired': 'ต้องใส่รูป', // marker on a row whose slot is required
  'dialog.save.title': 'บันทึกไฟล์เทมเพลต', // native Save dialog title
  'dialog.open.title': 'เปิดไฟล์เทมเพลต', // native Open dialog title
  'dialog.fileTypeLabel': 'ไฟล์เทมเพลต (JSON)', // file-type label for the JSON filter
  'dialog.pickPhotos.title': 'เลือกไฟล์รูปภาพ', // native Open dialog title for photos
  'dialog.photoTypeLabel': 'ไฟล์รูปภาพ (JPG, PNG)', // file-type label for the JPG/PNG filter
  'error.saveFailed': 'บันทึกไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', // writing the file failed (`WRITE_FAILED`)
  'error.loadFailed': 'เปิดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', // reading the file failed (`READ_FAILED`)
  'error.fileUnreadable': 'ไฟล์นี้ไม่ใช่ไฟล์เทมเพลตที่ใช้งานได้', // the chosen file is not a valid template
  'error.photoUnreadable': 'ไฟล์รูปนี้ใช้งานไม่ได้', // the chosen file is not a usable JPG/PNG
  'error.photoLoadFailed': 'เปิดไฟล์รูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', // `image:pick` `READ_FAILED`
  'error.duplicateSlotName': 'มีช่องที่ใช้ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น', // duplicate-rename warning (REQ-001 Q11 / Req 15 / A11)
  'error.blankSlotName': 'ชื่อช่องต้องไม่เว้นว่าง กรุณาตั้งชื่อใหม่', // blank-name warning (REQ-001 Q13 / Req 16 / A15)
} as const;

export type ThKey = keyof typeof th;
