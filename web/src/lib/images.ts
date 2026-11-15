export interface PreparedPhoto {
  full: Blob; // ~1568px long edge: what Claude reads and what the detail page shows
  thumb: Blob; // ~480px for list cards
  base64: string; // `full` as base64, for the label reader
  previewUrl: string; // object URL for showing the photo before it is saved
}

async function resize(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the photo'))), 'image/jpeg', quality),
  );
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Shrinks a camera photo (often 4-12 MB HEIC/JPEG) to a small JPEG, honouring EXIF rotation. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const [full, thumb] = await Promise.all([resize(bitmap, 1568, 0.85), resize(bitmap, 480, 0.8)]);
    return { full, thumb, base64: await toBase64(full), previewUrl: URL.createObjectURL(full) };
  } finally {
    bitmap.close();
  }
}
