// Main-process side of the image IPC seam (SPEC-002 §4).
//
// Same rules as `ipc/template.ts`: no user-facing string lives here, dialog
// titles and file-type labels arrive as parameters from the renderer, failures
// come back as machine codes, and `detail` is English and developer-facing —
// logged, never rendered. Nothing about the user's files is logged here.

import { BrowserWindow, dialog, ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  PickImagesOptions,
  PickImagesResult,
  PickedImage,
  SavePngOptions,
  SavePngResult,
} from '../../shared/contract';

/** SPEC-002 §4 — the only two channels REQ-002 adds. */
const PICK_CHANNEL = 'image:pick';
const SAVE_PNG_CHANNEL = 'png:save';

const PNG_EXTENSION = '.png';

/** Req 11: the picker offers JPG/PNG and nothing else. */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

/** The 8-byte PNG signature, checked before anything is written. */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parentWindow(sender: Electron.WebContents): BrowserWindow | null {
  return BrowserWindow.fromWebContents(sender);
}

/**
 * SPEC-002 §4: derived from the extension only. Main never sniffs or decodes —
 * a file that lies about its extension fails to decode in the renderer, which is
 * the one place that can actually tell.
 */
function mimeTypeFromExtension(filePath: string): PickedImage['mimeType'] {
  return path.extname(filePath).toLowerCase() === PNG_EXTENSION
    ? 'image/png'
    : 'image/jpeg';
}

/** The user may delete the extension in the dialog; forced back, as `.json` is. */
function forcePngExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase() === PNG_EXTENSION
    ? filePath
    : `${filePath}${PNG_EXTENSION}`;
}

/**
 * SPEC-002 §4: defence in depth before writing, mirroring `isSaveablePayload`.
 * Runs before the dialog, so a refused payload never opens one and never writes.
 */
function isPngPayload(bytes: unknown): bytes is Uint8Array {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    return false;
  }
  if (bytes.length < PNG_MAGIC.length) {
    return false;
  }
  return PNG_MAGIC.every((byte, index) => bytes[index] === byte);
}

export function registerImageIpc(): void {
  ipcMain.handle(
    PICK_CHANNEL,
    async (event, options: PickImagesOptions): Promise<PickImagesResult> => {
      try {
        const properties: Electron.OpenDialogOptions['properties'] = options.multiple
          ? ['openFile', 'multiSelections']
          : ['openFile'];

        const dialogOptions: Electron.OpenDialogOptions = {
          title: options.dialogTitle,
          filters: [{ name: options.fileTypeLabel, extensions: IMAGE_EXTENSIONS }],
          properties,
        };

        const owner = parentWindow(event.sender);
        const result = owner
          ? await dialog.showOpenDialog(owner, dialogOptions)
          : await dialog.showOpenDialog(dialogOptions);

        if (result.canceled || result.filePaths.length === 0) {
          return { status: 'canceled' };
        }

        // All-or-nothing (SA call B-4): one unreadable file fails the whole call
        // and nothing is returned. `filePaths` order is preserved.
        const images: PickedImage[] = [];
        for (const filePath of result.filePaths) {
          const bytes = await fs.readFile(filePath);
          images.push({
            filePath,
            fileName: path.basename(filePath),
            mimeType: mimeTypeFromExtension(filePath),
            bytes,
          });
        }

        return { status: 'picked', images };
      } catch (error) {
        return { status: 'error', code: 'READ_FAILED', detail: errorDetail(error) };
      }
    },
  );

  ipcMain.handle(
    SAVE_PNG_CHANNEL,
    async (event, bytes: unknown, options: SavePngOptions): Promise<SavePngResult> => {
      if (!isPngPayload(bytes)) {
        return {
          status: 'error',
          code: 'INVALID_PAYLOAD',
          detail: 'bytes must be a non-empty Uint8Array starting with the PNG signature',
        };
      }

      try {
        const dialogOptions: Electron.SaveDialogOptions = {
          title: options.dialogTitle,
          defaultPath: options.defaultFileName,
          filters: [{ name: options.fileTypeLabel, extensions: ['png'] }],
        };

        const owner = parentWindow(event.sender);
        const result = owner
          ? await dialog.showSaveDialog(owner, dialogOptions)
          : await dialog.showSaveDialog(dialogOptions);

        if (result.canceled || !result.filePath) {
          return { status: 'canceled' };
        }

        const filePath = forcePngExtension(result.filePath);
        await fs.writeFile(filePath, bytes);

        return { status: 'saved', filePath };
      } catch (error) {
        return { status: 'error', code: 'WRITE_FAILED', detail: errorDetail(error) };
      }
    },
  );
}
