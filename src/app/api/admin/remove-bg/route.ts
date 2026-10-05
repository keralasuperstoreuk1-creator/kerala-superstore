import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const maxDuration = 60; // 60 seconds max

export async function POST(req: NextRequest) {
  try {
    let { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Support static paths like /branding/... or /specials/...
    if (typeof imageBase64 === 'string' && imageBase64.startsWith('/')) {
      const fs = await import('fs');
      const filePath = path.join(process.cwd(), 'public', imageBase64.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        const fileBuf = fs.readFileSync(filePath);
        imageBase64 = `data:image/jpeg;base64,${fileBuf.toString('base64')}`;
      }
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'ai_remove_bg.py');

    const result = await new Promise<{ success: boolean; transparent?: string; packshot?: string; error?: string }>((resolve) => {
      const py = spawn('python', [scriptPath], {
        cwd: process.cwd(),
      });

      let stdoutData = '';
      let stderrData = '';

      py.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      py.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      py.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      py.on('close', (code) => {
        if (code !== 0) {
          resolve({ success: false, error: stderrData || `Python exited with code ${code}` });
          return;
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (e: any) {
          resolve({ success: false, error: `Invalid JSON from python: ${stdoutData.slice(0, 200)}` });
        }
      });

      py.stdin.write(JSON.stringify({ imageBase64 }));
      py.stdin.end();
    });

    if (result.success && result.transparent && result.packshot) {
      return NextResponse.json({
        success: true,
        source: 'u2net-ai-neural',
        transparent: result.transparent,
        packshot: result.packshot,
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to remove background',
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Server error',
    }, { status: 500 });
  }
}
