// Main-process side of the template IPC seam (SPEC-001 §4).
//
// No user-facing string lives here: dialog titles and file-type labels arrive
// as parameters from the renderer, and failures come back as machine codes.
// `detail` values are English and developer-facing — logged, never rendered.

import { BrowserWindow, dialog, ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  OpenDialogOptions,
  OpenTemplateResult,
  SaveDialogOptions,
  SaveTemplateResult,
  TemplateFile,
} from '../../shared/contract';

/** SPEC-001 §4 — the only two channels in REQ-001. */
const SAVE_CHANNEL = 'template:save';
const OPEN_CHANNEL = 'template:open';

const JSON_EXTENSION = '.json';

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * SPEC-001 §4: defence in depth behind the disabled Save button (REQ 14 / A10).
 * Only `name` and `slots` are checked here — full validation lives once, in
 * `parseTemplateFile` on the renderer side.
 */
function isSaveablePayload(payload: unknown): payload is TemplateFile {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const candidate: { name?: unknown; slots?: unknown } = payload;
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim() !== '' &&
    Array.isArray(candidate.slots)
  );
}

/** The user may delete the extension in the dialog; SPEC-001 §3 forces it back. */
function forceJsonExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase() === JSON_EXTENSION
    ? filePath
    : `${filePath}${JSON_EXTENSION}`;
}

function parentWindow(sender: Electron.WebContents): BrowserWindow | null {
  return BrowserWindow.fromWebContents(sender);
}

export function registerTemplateIpc(): void {
  ipcMain.handle(
    SAVE_CHANNEL,
    async (
      event,
      template: unknown,
      options: SaveDialogOptions,
    ): Promise<SaveTemplateResult> => {
      if (!isSaveablePayload(template)) {
        return {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          detail: 'template.name must be a non-empty string and template.slots must be an array',
        };
      }

      try {
        const dialogOptions: Electron.SaveDialogOptions = {
          title: options.dialogTitle,
          defaultPath: options.defaultFileName,
          filters: [{ name: options.fileTypeLabel, extensions: ['json'] }],
        };

        const owner = parentWindow(event.sender);
        const result = owner
          ? await dialog.showSaveDialog(owner, dialogOptions)
          : await dialog.showSaveDialog(dialogOptions);

        if (result.canceled || !result.filePath) {
          return { status: 'canceled' };
        }

        const filePath = forceJsonExtension(result.filePath);
        await fs.writeFile(filePath, `${JSON.stringify(template, null, 2)}\n`, 'utf-8');

        return { status: 'saved', filePath };
      } catch (error) {
        return { status: 'error', code: 'WRITE_FAILED', detail: errorDetail(error) };
      }
    },
  );

  ipcMain.handle(
    OPEN_CHANNEL,
    async (event, options: OpenDialogOptions): Promise<OpenTemplateResult> => {
      try {
        const dialogOptions: Electron.OpenDialogOptions = {
          title: options.dialogTitle,
          filters: [{ name: options.fileTypeLabel, extensions: ['json'] }],
          properties: ['openFile'],
        };

        const owner = parentWindow(event.sender);
        const result = owner
          ? await dialog.showOpenDialog(owner, dialogOptions)
          : await dialog.showOpenDialog(dialogOptions);

        const [filePath] = result.filePaths;
        if (result.canceled || filePath === undefined) {
          return { status: 'canceled' };
        }

        // Main does not parse or validate the JSON — the renderer calls
        // `parseTemplateFile`, so validation exists exactly once (SPEC-001 §4).
        const content = await fs.readFile(filePath, 'utf-8');

        return { status: 'opened', filePath, content };
      } catch (error) {
        return { status: 'error', code: 'READ_FAILED', detail: errorDetail(error) };
      }
    },
  );
}
