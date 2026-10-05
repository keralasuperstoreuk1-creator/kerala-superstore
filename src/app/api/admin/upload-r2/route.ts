import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, uploadToR2 } from "@/lib/cloudflare-r2";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handle JSON request (e.g., base64 dataUrl from AI Background Removal / Studio)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl, fileName, folder } = body;

      if (!dataUrl) {
        return NextResponse.json(
          { error: "No image dataUrl provided" },
          { status: 400 }
        );
      }

      // Check if R2 is configured
      if (!isR2Configured()) {
        // If R2 is not yet configured with keys, return clear status with the dataUrl intact
        return NextResponse.json({
          success: false,
          isConfigured: false,
          message: "Cloudflare R2 credentials not found in .env. Falling back to local storage.",
          url: dataUrl,
        });
      }

      // Parse base64
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { error: "Invalid base64 data URL" },
          { status: 400 }
        );
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      const result = await uploadToR2(
        buffer,
        fileName || `cutout-${Date.now()}.png`,
        mimeType,
        folder || "products"
      );

      return NextResponse.json({
        success: true,
        isConfigured: true,
        url: result.url,
        key: result.key,
        sizeBytes: result.sizeBytes,
      });
    }

    // 2. Handle Multipart Form Data (direct file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "products";

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      if (!isR2Configured()) {
        return NextResponse.json({
          success: false,
          isConfigured: false,
          message: "Cloudflare R2 credentials not found in .env.",
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadToR2(
        buffer,
        file.name,
        file.type || "image/jpeg",
        folder
      );

      return NextResponse.json({
        success: true,
        isConfigured: true,
        url: result.url,
        key: result.key,
        sizeBytes: result.sizeBytes,
      });
    }

    return NextResponse.json({ error: "Unsupported content-type" }, { status: 400 });
  } catch (error: any) {
    console.error("Cloudflare R2 upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image to Cloudflare R2" },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  const configured = isR2Configured();
  return NextResponse.json({
    r2Configured: configured,
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || null,
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || null,
    freeTierDetails: {
      storage: "10 GB / Month (Free Forever)",
      bandwidth: "Unlimited $0 Egress",
      classAOperations: "1 Million / Month (Free)",
      classBOperations: "10 Million / Month (Free)",
    },
  });
}
