import { NextRequest, NextResponse } from 'next/server';

/**
 * Kerala Super Store - Smart AI Product Studio API
 * 
 * Sends the admin's EXACT uploaded photo + smart Kerala grocery website context prompt
 * to Gemini for real background removal.
 * 
 * Models tried in order:
 * 1. gemini-2.0-flash-preview-image-generation (best for image editing)
 * 2. gemini-2.0-flash-exp (experimental image generation)
 * 3. gemini-2.0-flash-exp-image-generation (alternate name)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      imageBase64 = '',
      mimeType = 'image/jpeg',
      productName = '',
      brand = '',
      category = '',
      customApiKey = '',
      editPrompt = ''
    } = await req.json();

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        source: 'no-api-key',
        error: 'No Gemini API key. Please connect your free key from aistudio.google.com/app/apikey',
      });
    }

    if (!imageBase64) {
      return NextResponse.json({
        success: false,
        error: 'No image provided'
      }, { status: 400 });
    }

    // Strip data URL prefix if present
    const rawBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const imageMimeType = mimeType || 'image/jpeg';

    // Build smart website-context prompt if not provided
    const productDesc = [brand, productName].filter(Boolean).join(' ') || 'Kerala grocery product';
    const smartPrompt = editPrompt || `You are processing a product image for Kerala Super Store, a UK-based online supermarket for authentic Kerala (South Indian) groceries.

TASK: Remove the background. Keep the product packaging EXACTLY unchanged.

PRODUCT: ${productDesc} (${category || 'Kerala grocery'})

KEEP: Everything printed on the actual product packet/bag.
REMOVE: Promotional flyer text, price badges, offer starbursts, store logos, phone numbers, addresses, coloured backgrounds, food photography around the packet.

OUTPUT: Pure white (#FFFFFF) background, product centred, 1000x1000px, soft ground shadow under product only.`;

    // Models that support image-in → image-out editing (in order of preference)
    const imageEditModels = [
      'gemini-2.0-flash-preview-image-generation',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-exp-image-generation',
    ];

    for (const model of imageEditModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: imageMimeType,
                    data: rawBase64
                  }
                },
                {
                  text: smartPrompt
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.05,
          }
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(60000) // 60s timeout
        });

        if (!res.ok) {
          const errText = await res.text();
          console.log(`Model ${model} failed (${res.status}):`, errText.slice(0, 200));
          continue; // Try next model
        }

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts ?? [];

        // Find the image part in Gemini's response
        for (const part of parts) {
          if (part.inline_data?.data && part.inline_data.mime_type?.startsWith('image/')) {
            return NextResponse.json({
              success: true,
              source: 'gemini-image-edit',
              model,
              imageUrl: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`,
              promptUsed: smartPrompt
            });
          }
        }

        // Model responded but only with text (no image output) - try next model
        const textPart = parts.find((p: { text?: string }) => p.text);
        console.log(`Model ${model} responded text-only:`, textPart?.text?.slice(0, 100));

      } catch (modelErr) {
        console.log(`Model ${model} error:`, modelErr);
        continue;
      }
    }

    // All models returned text-only responses - Gemini image editing is not available on this key tier
    // Return a helpful error so the UI can show clear instructions
    return NextResponse.json({
      success: false,
      source: 'gemini-text-only',
      error: 'Your Gemini API key does not have image generation access yet. Image editing requires gemini-2.0-flash-preview-image-generation which may need enablement. Use the manual canvas sliders below as an alternative.',
      promptUsed: smartPrompt,
      // Pass the prompt back so admin can copy-paste into Gemini.google.com manually
      manualGeminiUrl: 'https://gemini.google.com',
      suggestedPrompt: smartPrompt
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
