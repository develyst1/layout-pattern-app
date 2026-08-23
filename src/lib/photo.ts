import type { PickedImage } from '@shared/contract';
import type { PlacedPhoto } from '@/store/useTemplateStore';

/**
 * Turning picked bytes into drawable photos (SPEC-002 §6 "Decoding") — **one
 * helper, both paths**: the per-row single pick and the toolbar's multi-pick
 * hand the same function their `PickedImage[]` and get back either a fully
 * decoded batch or `null`.
 *
 * Two rules live here and nowhere else:
 *
 * - **The Req 11 gate (SA call B-10).** JPG/PNG is enforced on the *bytes*, by
 *   magic number, before any `Blob` is made. Not on `mimeType` (a hint), not on
 *   the file name (a GIF renamed `photo.png` would pass), not in main. A genuine
 *   JPEG named `.gif` is therefore accepted — Req 11 is about what the file *is*.
 * - **All-or-nothing per batch (B-4 / B-11).** The whole batch is gated and
 *   decoded *before any of it is placed*, surplus photos included. If any one of
 *   them fails, every object URL this call created is revoked, nothing is placed
 *   and the caller shows `error.photoUnreadable`. The surplus URLs that *do*
 *   survive are revoked later, by `fillFromPhotos` — see its comment.
 *
 * Bytes are never turned into base64 and never into a data URL.
 */

/** JPEG: `FF D8 FF`. */
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
/** PNG: `89 50 4E 47 0D 0A 1A 0A`. */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) {
    return false;
  }
  return magic.every((byte, index) => bytes[index] === byte);
}

/**
 * SA call B-10: is this actually a JPEG or a PNG? Bytes shorter than the
 * signature — an empty file, a truncated header — are refused, and refused
 * *without being decoded*.
 */
export function hasImageMagic(bytes: Uint8Array): boolean {
  return startsWith(bytes, JPEG_MAGIC) || startsWith(bytes, PNG_MAGIC);
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image decode failed'));
    image.src = objectUrl;
  });
}

/**
 * Gate + decode a whole batch. Returns the decoded photos in the order they were
 * picked, or `null` if **any** of them failed — in which case every object URL
 * created here has already been revoked and the caller must place nothing.
 */
export async function decodePhotos(images: PickedImage[]): Promise<PlacedPhoto[] | null> {
  const created: string[] = [];
  const decoded: PlacedPhoto[] = [];

  for (const picked of images) {
    if (!hasImageMagic(picked.bytes)) {
      // B-10: refused before a Blob exists, so nothing was ever decoded.
      break;
    }
    // `PickedImage.bytes` is declared `Uint8Array`, which TypeScript widens to
    // `Uint8Array<ArrayBufferLike>` — possibly backed by a `SharedArrayBuffer`,
    // which `BlobPart` excludes. Bytes handed over `contextBridge` are never
    // shared memory, so this narrows the declared type without copying a byte.
    // Re-declaring it in `shared/contract.ts` is not a renderer change to make.
    const part = picked.bytes as Uint8Array<ArrayBuffer>;
    const objectUrl = URL.createObjectURL(new Blob([part], { type: picked.mimeType }));
    created.push(objectUrl);
    try {
      const image = await loadImage(objectUrl);
      decoded.push({ objectUrl, image, fileName: picked.fileName });
    } catch {
      break;
    }
  }

  if (decoded.length !== images.length) {
    for (const objectUrl of created) {
      URL.revokeObjectURL(objectUrl);
    }
    return null;
  }
  return decoded;
}
