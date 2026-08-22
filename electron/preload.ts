// Preload script — the renderer's only door to the main process.
//
// It exposes exactly the two calls of SPEC-001 §4 and nothing else. Adding a
// method here is a SPEC change, never a local decision. Only types are imported
// from the shared contract, so nothing of it is bundled into the sandboxed
// preload at runtime.

import { contextBridge, ipcRenderer } from 'electron';

import type {
  OpenDialogOptions,
  OpenTemplateResult,
  SaveDialogOptions,
  SaveTemplateResult,
  TemplateFile,
} from '../shared/contract';

/** SPEC-001 §4 — the only two channels in REQ-001. */
const SAVE_CHANNEL = 'template:save';
const OPEN_CHANNEL = 'template:open';

const api = {
  saveTemplate(
    template: TemplateFile,
    opts: SaveDialogOptions,
  ): Promise<SaveTemplateResult> {
    return ipcRenderer.invoke(SAVE_CHANNEL, template, opts);
  },
  openTemplate(opts: OpenDialogOptions): Promise<OpenTemplateResult> {
    return ipcRenderer.invoke(OPEN_CHANNEL, opts);
  },
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: typeof api;
  }
}
