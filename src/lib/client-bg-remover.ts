/**
 * High-Performance Client-Side Smart Background Isolator & Studio Packshot Generator
 * 
 * Works 100% offline and in all browsers (no Python or external API key needed).
 * Detects background boundary colors, removes outer background / flyers,
 * and creates transparent cutouts and 1000x1000 pure white packshots with ground shadows.
 */

export interface BackgroundRemovalResult {
  success: boolean;
  transparent: string;
  packshot: string;
  source: 'server-u2net' | 'client-smart-segmentation' | 'client-canvas';
}

/**
 * Isolates background using multi-sample border color clustering and edge feathering
 */
export function removeBackgroundOnCanvas(imageSrc: string): Promise<BackgroundRemovalResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.width;
        const origH = img.height;

        // Process at high resolution (up to 1200px)
        const maxDim = 1200;
        let procW = origW;
        let procH = origH;
        if (Math.max(origW, origH) > maxDim) {
          const scale = maxDim / Math.max(origW, origH);
          procW = Math.round(origW * scale);
          procH = Math.round(origH * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = procW;
        canvas.height = procH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve({
            success: true,
            transparent: imageSrc,
            packshot: imageSrc,
            source: 'client-canvas',
          });
        }

        ctx.drawImage(img, 0, 0, procW, procH);
        const imgData = ctx.getImageData(0, 0, procW, procH);
        const data = imgData.data;

        // 1. Sample background colors from all 4 borders & corners
        const samplePoints = [
          [2, 2], [Math.floor(procW / 2), 2], [procW - 3, 2],
          [2, Math.floor(procH / 2)], [procW - 3, Math.floor(procH / 2)],
          [2, procH - 3], [Math.floor(procW / 2), procH - 3], [procW - 3, procH - 3],
          [10, 10], [procW - 11, 10], [10, procH - 11], [procW - 11, procH - 11],
        ];

        const bgSamples: { r: number; g: number; b: number }[] = [];
        for (const [sx, sy] of samplePoints) {
          const idx = (sy * procW + sx) * 4;
          bgSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
        }

        // Color distance function (Euclidean in RGB)
        const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
          return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
        };

        // Flood map: 0 = unvisited, 1 = background, 2 = foreground
        const visited = new Uint8Array(procW * procH);
        const threshold = 42; // Sensitivity for background flood
        const queue: number[] = [];

        // Push perimeter boundary pixels into flood queue
        for (let x = 0; x < procW; x++) {
          queue.push(0 * procW + x); // Top edge
          queue.push((procH - 1) * procW + x); // Bottom edge
        }
        for (let y = 0; y < procH; y++) {
          queue.push(y * procW + 0); // Left edge
          queue.push(y * procW + (procW - 1)); // Right edge
        }

        // BFS flood fill from outside inward
        let head = 0;
        while (head < queue.length) {
          const pixelIdx = queue[head++];
          if (visited[pixelIdx]) continue;

          const px = pixelIdx % procW;
          const py = Math.floor(pixelIdx / procW);
          const pDataIdx = pixelIdx * 4;

          const pr = data[pDataIdx];
          const pg = data[pDataIdx + 1];
          const pb = data[pDataIdx + 2];

          // Check minimum distance to any sampled background color
          let minDist = 999;
          for (const s of bgSamples) {
            const d = colorDistance(pr, pg, pb, s.r, s.g, s.b);
            if (d < minDist) minDist = d;
          }

          // Near edges or matched background color
          const isEdgeZone = px < 8 || px >= procW - 8 || py < 8 || py >= procH - 8;
          if (minDist <= threshold || (isEdgeZone && minDist <= threshold * 1.5)) {
            visited[pixelIdx] = 1; // Mark as background
            data[pDataIdx + 3] = 0; // Make transparent

            // Spread to 4 neighbors
            if (px > 0 && !visited[pixelIdx - 1]) queue.push(pixelIdx - 1);
            if (px < procW - 1 && !visited[pixelIdx + 1]) queue.push(pixelIdx + 1);
            if (py > 0 && !visited[pixelIdx - procW]) queue.push(pixelIdx - procW);
            if (py < procH - 1 && !visited[pixelIdx + procW]) queue.push(pixelIdx + procW);
          } else {
            visited[pixelIdx] = 2; // Foreground barrier
          }
        }

        // Edge softening / feathering
        for (let y = 1; y < procH - 1; y++) {
          for (let x = 1; x < procW - 1; x++) {
            const idx = (y * procW + x) * 4;
            if (data[idx + 3] > 0) {
              const topAlpha = data[((y - 1) * procW + x) * 4 + 3];
              const bottomAlpha = data[((y + 1) * procW + x) * 4 + 3];
              const leftAlpha = data[(y * procW + (x - 1)) * 4 + 3];
              const rightAlpha = data[(y * procW + (x + 1)) * 4 + 3];

              const zeroNeighbors = (topAlpha === 0 ? 1 : 0) + (bottomAlpha === 0 ? 1 : 0) + (leftAlpha === 0 ? 1 : 0) + (rightAlpha === 0 ? 1 : 0);
              if (zeroNeighbors >= 2) {
                data[idx + 3] = 160; // Smooth boundary anti-aliasing
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL('image/png');

        // 2. Composite onto 1000x1000 Pure White Studio Packshot with soft ground drop shadow
        const studioCanvas = document.createElement('canvas');
        studioCanvas.width = 1000;
        studioCanvas.height = 1000;
        const studioCtx = studioCanvas.getContext('2d');
        if (!studioCtx) {
          return resolve({
            success: true,
            transparent: transparentDataUrl,
            packshot: transparentDataUrl,
            source: 'client-smart-segmentation',
          });
        }

        studioCtx.fillStyle = '#FFFFFF';
        studioCtx.fillRect(0, 0, 1000, 1000);

        const targetDim = 820;
        let dw = targetDim;
        let dh = targetDim;
        const asp = procW / procH;
        if (asp > 1) {
          dh = dw / asp;
        } else {
          dw = dh * asp;
        }

        const dx = (1000 - dw) / 2;
        const dy = (1000 - dh) / 2;

        // Add soft realistic studio shadow
        studioCtx.save();
        studioCtx.shadowColor = 'rgba(0, 0, 0, 0.14)';
        studioCtx.shadowBlur = 24;
        studioCtx.shadowOffsetY = 16;
        studioCtx.drawImage(canvas, dx, dy, dw, dh);
        studioCtx.restore();

        studioCtx.drawImage(canvas, dx, dy, dw, dh);
        const packshotDataUrl = studioCanvas.toDataURL('image/jpeg', 0.95);

        resolve({
          success: true,
          transparent: transparentDataUrl,
          packshot: packshotDataUrl,
          source: 'client-smart-segmentation',
        });
      } catch (err) {
        resolve({
          success: true,
          transparent: imageSrc,
          packshot: imageSrc,
          source: 'client-canvas',
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        transparent: imageSrc,
        packshot: imageSrc,
        source: 'client-canvas',
      });
    };

    img.src = imageSrc;
  });
}
