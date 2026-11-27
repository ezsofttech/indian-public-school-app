/**
 * Pure Vanilla Browser Video Compressor (Zero 3rd-Party Dependencies)
 *
 * Uses native HTMLVideoElement + HTMLCanvasElement + MediaStream + MediaRecorder APIs.
 * Supports configurable resolution capping, bitrate constraints, and progress reporting.
 */

export interface VideoCompressionOptions {
  /** Maximum width or height constraint (e.g. 1280 for 720p HD). Default: 1280 */
  maxDimension?: number;
  /** Target video bitrate in bits per second. Default: 1,500,000 (1.5 Mbps) */
  targetBitrate?: number;
  /** Video frame rate. Default: 30 */
  fps?: number;
  /** Optional callback for compression progress (0 to 100%) */
  onProgress?: (percent: number) => void;
}

/**
 * Compresses an uploaded video file client-side using pure Web APIs.
 * Returns the compressed File if size is reduced; otherwise returns original File.
 */
export async function compressVideoClient(
  file: File,
  options: VideoCompressionOptions = {}
): Promise<File> {
  // Only process video files
  if (!file || !file.type.startsWith('video/')) {
    return file;
  }

  // Ensure MediaRecorder is supported in current environment
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return file;
  }

  const {
    maxDimension = 1280,
    targetBitrate = 1_500_000,
    fps = 30,
    onProgress,
  } = options;

  return new Promise<File>((resolve) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true; // Required for reliable programmatic autoplay across all browsers
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(videoUrl);
      } catch {}
    };

    video.onloadedmetadata = () => {
      const duration = video.duration || 1;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 360;

      // Downscale if either dimension exceeds maximum bound
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Ensure dimensions are even numbers (required by many video encoders)
      if (width % 2 !== 0) width -= 1;
      if (height % 2 !== 0) height -= 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        cleanup();
        return resolve(file);
      }

      // 1. Capture stream from canvas
      const canvasStream = canvas.captureStream(fps);

      // 2. Capture and merge original audio track if present
      try {
        const anyVideo = video as any;
        const mediaStream: MediaStream = (
          anyVideo.captureStream ||
          anyVideo.mozCaptureStream ||
          anyVideo.webkitCaptureStream
        )?.call(anyVideo);

        if (mediaStream) {
          const audioTracks = mediaStream.getAudioTracks();
          if (audioTracks && audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      } catch (audioErr) {
        // Fall back gracefully to video-only if audio capture is restricted
      }

      // 3. Determine best supported mime type
      const mimeCandidates = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      const selectedMime =
        mimeCandidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || 'video/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(canvasStream, {
          mimeType: selectedMime,
          videoBitsPerSecond: targetBitrate,
        });
      } catch {
        cleanup();
        return resolve(file);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanup();
        const compressedBlob = new Blob(chunks, { type: selectedMime });

        if (onProgress) onProgress(100);

        // Only use compressed file if it resulted in real byte savings
        if (compressedBlob.size > 0 && compressedBlob.size < file.size) {
          const ext = selectedMime.includes('mp4') ? '.mp4' : '.webm';
          const originalBaseName = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${originalBaseName}${ext}`;

          const compressedFile = new File([compressedBlob], newFileName, {
            type: selectedMime,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      };

      // 4. Play video & render frames to canvas loop
      let animFrameId: number;

      const drawLoop = () => {
        if (video.paused || video.ended) return;

        ctx.drawImage(video, 0, 0, width, height);

        if (onProgress && duration > 0) {
          const percent = Math.min(99, Math.round((video.currentTime / duration) * 100));
          onProgress(percent);
        }

        animFrameId = requestAnimationFrame(drawLoop);
      };

      video.onended = () => {
        cancelAnimationFrame(animFrameId);
        try {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        } catch {
          cleanup();
          resolve(file);
        }
      };

      video.onerror = () => {
        cancelAnimationFrame(animFrameId);
        cleanup();
        resolve(file);
      };

      try {
        recorder.start(500); // chunk slice interval
        video.play().catch(() => {
          // If browser restricts autoplay
          cleanup();
          resolve(file);
        });
        drawLoop();
      } catch {
        cleanup();
        resolve(file);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(file);
    };
  });
}
