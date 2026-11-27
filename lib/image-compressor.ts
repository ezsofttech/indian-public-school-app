/**
 * Pure Vanilla Browser Image Compressor (Zero 3rd-Party Dependencies)
 *
 * Uses HTML5 Canvas + OffscreenCanvas / ImageBitmap to resize and compress images
 * directly in the browser before network upload.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.8)
  maxSizeMB?: number; // optional target max size in MB
}

/**
 * Compresses an image file using standard browser Canvas APIs.
 * Non-image files (e.g. PDFs, docs, videos) are safely returned as-is.
 * If compression is unsupported or fails, falls back to the original file.
 */
export async function compressImageClient(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  // If not an image or is SVG / GIF (to preserve vector / animations), return as-is
  if (
    !file ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
  } = options;

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;
    let imageSource: ImageBitmap | HTMLImageElement;

    // Use createImageBitmap if available in browser, else fallback to HTMLImageElement
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
      imageSource = bitmap;
    } else {
      imageSource = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      sourceWidth = imageSource.naturalWidth || imageSource.width;
      sourceHeight = imageSource.naturalHeight || imageSource.height;
    }

    // Determine target dimensions maintaining aspect ratio
    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    // Draw on off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return file;
    }

    // High quality canvas scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

    // Clean up ImageBitmap if used
    if ('close' in imageSource && typeof (imageSource as ImageBitmap).close === 'function') {
      (imageSource as ImageBitmap).close();
    } else if (imageSource instanceof HTMLImageElement && imageSource.src.startsWith('blob:')) {
      URL.revokeObjectURL(imageSource.src);
    }

    // Determine target format (JPEG is most universally supported and compressed)
    const exportMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const outputQuality = exportMime === 'image/png' ? undefined : quality;

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        exportMime,
        outputQuality
      );
    });

    if (!compressedBlob || compressedBlob.size >= file.size) {
      // If compressed file is larger or failed, return original
      return file;
    }

    return new File([compressedBlob], file.name, {
      type: exportMime,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn(`[Client Image Compression] Skipped for ${file.name}:`, err);
    return file;
  }
}
