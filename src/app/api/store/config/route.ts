import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, saveJsonToR2, getJsonFromR2 } from "@/lib/cloudflare-r2";
import { DEFAULT_HERO_SLIDES, DEFAULT_SPOTLIGHT_PROMO } from "@/lib/hero-slides";

const CONFIG_R2_KEY = "config/store-slides-and-banners.json";

export interface GlobalStoreConfigPayload {
  heroSlides?: any[];
  spotlightPromo?: any;
  categoryImages?: Record<string, string>;
  storeConfig?: any;
  updatedAt?: string;
}

/**
 * GET /api/store/config
 * Returns current global configuration from Cloudflare R2 (or fallback default)
 */
export async function GET() {
  try {
    if (isR2Configured()) {
      const cloudConfig = await getJsonFromR2<GlobalStoreConfigPayload>(CONFIG_R2_KEY);
      if (cloudConfig) {
        return NextResponse.json({
          success: true,
          source: "cloudflare-r2",
          heroSlides: cloudConfig.heroSlides || DEFAULT_HERO_SLIDES,
          spotlightPromo: cloudConfig.spotlightPromo || DEFAULT_SPOTLIGHT_PROMO,
          categoryImages: cloudConfig.categoryImages || {},
          storeConfig: cloudConfig.storeConfig || null,
          updatedAt: cloudConfig.updatedAt || new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      source: "default-fallback",
      heroSlides: DEFAULT_HERO_SLIDES,
      spotlightPromo: DEFAULT_SPOTLIGHT_PROMO,
      categoryImages: {},
      storeConfig: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("GET /api/store/config error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/store/config
 * Saves global configuration to Cloudflare R2 so all computers and devices stay 100% in sync
 */
export async function POST(req: NextRequest) {
  try {
    const body: GlobalStoreConfigPayload = await req.json();

    if (!isR2Configured()) {
      return NextResponse.json({
        success: false,
        message: "Cloudflare R2 not configured. Config saved locally.",
      });
    }

    // Read existing to merge cleanly
    const existing = (await getJsonFromR2<GlobalStoreConfigPayload>(CONFIG_R2_KEY)) || {};

    const merged: GlobalStoreConfigPayload = {
      heroSlides: body.heroSlides !== undefined ? body.heroSlides : existing.heroSlides || DEFAULT_HERO_SLIDES,
      spotlightPromo: body.spotlightPromo !== undefined ? body.spotlightPromo : existing.spotlightPromo || DEFAULT_SPOTLIGHT_PROMO,
      categoryImages: body.categoryImages !== undefined ? body.categoryImages : existing.categoryImages || {},
      storeConfig: body.storeConfig !== undefined ? body.storeConfig : existing.storeConfig || null,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveJsonToR2(CONFIG_R2_KEY, merged);

    if (saved) {
      return NextResponse.json({
        success: true,
        message: "Global store configuration saved to Cloudflare R2 successfully!",
        data: merged,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to write to Cloudflare R2" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/store/config error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
