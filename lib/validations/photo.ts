// Shared photo validation — identical logic runs on client AND server.
// The server ALWAYS re-validates; client-side validation is UX-only and never trusted alone.

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

// Extension map derived from MIME type — never from the file name.
// Deriving the extension from photo.name (e.g. "evil.php.jpg") can be spoofed.
export const MIME_TO_EXT: Record<AllowedPhotoMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 10 MB hard limit
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

export type PhotoValidationError =
  | { code: "INVALID_TYPE"; message: string }
  | { code: "FILE_TOO_LARGE"; message: string };

/**
 * Validates a file's MIME type and size.
 * Returns null if valid, or an error descriptor if not.
 */
export function validatePhoto(file: {
  type: string;
  size: number;
}): PhotoValidationError | null {
  const allowedTypes: readonly string[] = ALLOWED_PHOTO_MIME_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      code: "INVALID_TYPE",
      message: `File type "${file.type}" is not allowed. Accepted: JPEG, PNG, WEBP.`,
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      code: "FILE_TOO_LARGE",
      message: `File is ${sizeMB} MB. Maximum allowed size is 10 MB.`,
    };
  }

  return null;
}
