/**
 * Unified Client-Side Media Compressor (100% Vanilla JS/TS - Zero 3rd-Party Libs)
 *
 * Automatically compresses:
 * - Images (JPEG, PNG, WebP) -> Canvas downscaling + JPEG compression
 * - Videos (MP4, MOV, WebM)  -> MediaRecorder + Canvas frame streaming
 * - Non-media (PDFs, docs)   -> Kept intact and passed through to backend
 */

import { compressImageClient, ImageCompressionOptions } from './image-compressor';
import { compressVideoClient, VideoCompressionOptions } from './video-compressor';

export interface MediaCompressionOptions {
  image?: ImageCompressionOptions;
  video?: VideoCompressionOptions;
  onProgress?: (type: 'image' | 'video', percent: number) => void;
}

/**
 * Pre-processes any uploaded File before appending to FormData.
 */
export async function compressMediaClient(
  file: File,
  options: MediaCompressionOptions = {}
): Promise<File> {
  if (!file) return file;

  // 1. Image Files
  if (file.type.startsWith('image/')) {
    if (options.onProgress) options.onProgress('image', 0);
    const compressed = await compressImageClient(file, options.image);
    if (options.onProgress) options.onProgress('image', 100);
    return compressed;
  }

  // 2. Video Files
  if (file.type.startsWith('video/')) {
    return await compressVideoClient(file, {
      ...options.video,
      onProgress: (percent) => options.onProgress?.('video', percent),
    });
  }

  // 3. Other files (PDFs, Docs, etc.) pass through untouched
  return file;
}

export { compressImageClient } from './image-compressor';
export { compressVideoClient } from './video-compressor';
