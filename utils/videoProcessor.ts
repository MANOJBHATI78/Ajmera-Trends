import { ReelData } from '../types';

/**
 * Calculates wrapped lines without drawing them to determine height
 */
function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines = text.split('\n');
  const wrappedLines: string[] = [];

  lines.forEach((line) => {
    const words = line.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        wrappedLines.push(currentLine);
        currentLine = words[n] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    wrappedLines.push(currentLine);
  });
  
  return wrappedLines;
}

/**
 * Processes the video by playing it on a hidden canvas and recording the stream.
 */
export const processVideo = async (
  videoSource: string,
  data: ReelData,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoSource;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      // Ensure dimensions are even numbers (encoders prefer even dimensions)
      const exactWidth = video.videoWidth;
      const exactHeight = video.videoHeight;
      const width = exactWidth % 2 === 0 ? exactWidth : exactWidth - 1;
      const height = exactHeight % 2 === 0 ? exactHeight : exactHeight - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // High quality text rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Audio setup
      let dest: MediaStreamAudioDestinationNode | null = null;
      let audioContext: AudioContext | null = null;
      
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
          const source = audioContext.createMediaElementSource(video);
          dest = audioContext.createMediaStreamDestination();
          source.connect(dest);
        }
      } catch (e) {
        console.warn("Audio context setup failed, proceeding without audio re-encoding", e);
      }

      // Capture stream at 30 FPS for consistent export speed and compatibility
      const stream = canvas.captureStream(30);
      
      if (dest) {
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      }

      // Determine MIME type
      const mimeTypes = [
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      // Use high bitrate (8 Mbps) for HD clarity
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 8000000, 
        ...(selectedMimeType ? { mimeType: selectedMimeType } : {})
      };
      
      let mediaRecorder: MediaRecorder;
      try {
         mediaRecorder = new MediaRecorder(stream, options);
      } catch (err) {
         console.warn('Failed to create MediaRecorder with options, trying default', err);
         mediaRecorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || 'video/mp4'; 
        const blob = new Blob(chunks, { type: finalType });
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
        resolve(blob);
      };

      video.onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      // ------------------------------------------------------------------
      // Pre-calculate layout Metrics (Run once)
      // ------------------------------------------------------------------
      
      // 1. Font Sizes
      const fontSizeMobile = (height * 0.045) * data.mobileScale; 
      const fontSizeAddress = (height * 0.028) * data.addressScale;
      const lineHeightAddress = fontSizeAddress * 1.35;
      
      const sidePadding = width * 0.06;
      const bottomMargin = height * 0.05; // 5% from bottom edge
      const elementGap = height * 0.025; // Gap between Mobile and Address
      
      const maxTextWidth = width - (sidePadding * 2);

      // 2. Calculate Address Layout
      // We need to know how tall the address block is to position it above the mobile number
      ctx.font = `500 ${fontSizeAddress}px Inter, sans-serif`;
      const addressLines = getWrappedLines(ctx, data.address, maxTextWidth);
      const totalAddressHeight = addressLines.length * lineHeightAddress;

      // 3. Determine Vertical Positions (Stacking Bottom-Up)
      
      // Mobile Y (Baseline)
      const mobileY = height - bottomMargin;
      
      // Address Start Y (Top of the address block)
      // Formula: Mobile Baseline - Mobile Height - Gap - Address Height
      const mobileHeightApprox = fontSizeMobile; 
      const addressStartY = mobileY - mobileHeightApprox - elementGap - totalAddressHeight + fontSizeAddress; // +fontSizeAddress because textBaseline 'top' draws down

      // 4. Dynamic Gradient Banner Height
      // Calculate how much space the text takes up + some padding
      const contentTopY = addressStartY;
      const contentHeight = (height - bottomMargin) - contentTopY + fontSizeMobile;
      // Ensure banner is at least 25% of screen, but grows if text is huge
      const minBannerHeight = height * 0.25;
      const dynamicBannerHeight = Math.max(minBannerHeight, contentHeight + (height * 0.05));

      // Drawing function
      const drawFrame = () => {
        if (video.paused || video.ended) return;

        // 1. Draw Video Frame
        ctx.drawImage(video, 0, 0, width, height);

        // 2. Draw Dark Gradient Background
        const gradientStartY = height - dynamicBannerHeight;
        const gradient = ctx.createLinearGradient(0, gradientStartY, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.2, 'rgba(0,0,0,0.6)');
        gradient.addColorStop(0.6, 'rgba(0,0,0,0.85)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, gradientStartY, width, dynamicBannerHeight);

        // 3. Draw Text
        ctx.textAlign = 'center';
        const centerX = width / 2;
        
        // Setup common shadow
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        // -- DRAW ADDRESS --
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.font = `500 ${fontSizeAddress}px Inter, sans-serif`;
        ctx.shadowBlur = 4; // Lighter shadow for smaller text
        
        // Draw pre-calculated lines
        addressLines.forEach((line, index) => {
          ctx.fillText(line, centerX, addressStartY + (index * lineHeightAddress));
        });

        // -- DRAW MOBILE --
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSizeMobile}px Inter, sans-serif`;
        ctx.shadowBlur = 8; // Stronger shadow for main text
        ctx.fillText(data.mobile, centerX, mobileY);

        // Progress
        const progress = Math.round((video.currentTime / video.duration) * 100);
        onProgress(progress);

        // Request next frame
        if ('requestVideoFrameCallback' in video) {
          (video as any).requestVideoFrameCallback(drawFrame);
        } else {
          requestAnimationFrame(drawFrame);
        }
      };

      try {
        mediaRecorder.start();
        video.play().then(() => {
          if ('requestVideoFrameCallback' in video) {
            (video as any).requestVideoFrameCallback(drawFrame);
          } else {
            requestAnimationFrame(drawFrame);
          }
        }).catch((e) => {
           reject(new Error(`Error playing video: ${e.message}`));
        });
      } catch (e: any) {
        reject(new Error(`Recorder error: ${e.message}`));
      }
    };

    video.onerror = () => {
      const err = video.error;
      const msg = err ? `Code ${err.code}: ${err.message}` : 'Unknown error';
      reject(new Error(`Error loading video source: ${msg}`));
    };
  });
};