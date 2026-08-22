// Preload script.
//
// Intentionally exposes NO API yet: the IPC seam (`window.api`) is defined in
// SPEC-001 §4 and implemented by TASK-002. Keeping this file present from
// TASK-001 means the BrowserWindow's `preload` path and the Vite build wiring
// are already exercised.
//
// contextIsolation is on and sandbox is on, so anything added here must go
// through `contextBridge.exposeInMainWorld` and may only use `ipcRenderer`.

export {};
