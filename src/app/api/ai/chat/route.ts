import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedProductCatalog } from '@/lib/product-catalog';

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBn7A1Zb371H5iBXytz0RIjqUcKZAA5csQ';

const STORE_KNOWLEDGE_PROMPT = `
You are "KSS Smart Assistant", the helpful, friendly 24/7 AI concierge for Kerala Superstore Manchester (UK's leading authentic Kerala grocery & spice store).

--- STORE DETAILS ---
- Store Name: Kerala Superstore Manchester Ltd
- Address: Unit 2, 73 Old Market Street, Manchester, M9 8DX, United Kingdom
- Contact / WhatsApp: +44 7749 132122
- Email: info@keralasuperstores.com
- Opening Hours: Monday to Sunday, 09:00 AM – 09:00 PM
- Free Customer Parking: Available at the rear of the store.

--- UK DELIVERY & SHIPPING ---
- Standard UK Courier Delivery: £3.99
- Free Delivery: Automatically applied on all orders over £50 across Greater Manchester & nationwide UK.
- Fast Dispatch: Orders placed before 2 PM dispatched same day via tracked courier.
- In-Store Click & Collect: Free collection at Unit 2, 73 Old Market Street, M9 8DX within 1 hour.

--- PRODUCT RANGE & BRANDS ---
- Rice & Grains: Palakkadan Vadi Matta, Unda Matta, Kaima/Jeerakasala Biryani Rice, Ponni Boiled Rice, Idli Rice.
- Masalas & Powders: Eastern, Nirapara, Brahmins, Double Horse, Aachi, Melam (Sambar, Meat, Chicken, Fish Curry, Kashmiri Chilli).
- Breakfast Podi: Chemba Puttu Podi, White Rice Puttu Podi, Appam & Idiyappam Podi, Roasted Rava.
- Spices & Whole Condiments: Wayanad Green Cardamom, Tellicherry Black Pepper, Whole Cloves, Star Anise.
- Snacks & Sweets: Fresh Nendran Banana Chips (fried in pure coconut oil), Sharkara Upperi, Kerala Mixture, Kozhikodan Halwa.
- Oils & Ghee: Pure Kera Coconut Oil, Gingelly (Sesame) Oil, Malabar Cow Ghee.
- Kitchenware & Pooja: Bronze Uruli, Puttu Maker (Puttu Kutti), Appam Chatti, Nilavilakku.
- Kitchen Specials: Fresh Thalassery Dum Biriyani & Daily Specials.

--- GUIDELINES FOR RESPONSES ---
1. Be polite, cheerful, concise, and professional in clear UK English.
2. Directly answer questions regarding stock availability, delivery rules, store location, prices, and how to place orders.
3. If the customer wants human support or a custom bulk order, invite them to chat directly with store staff on WhatsApp (+44 7749 132122).
4. Keep answers short and actionable (2-4 sentences max).
`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMsg = message.trim().toLowerCase();

    // Quick instant answers for common FAQs to provide instantaneous latency
    if (trimmedMsg.includes('address') || trimmedMsg.includes('location') || trimmedMsg.includes('where')) {
      return NextResponse.json({
        reply: "We are located at **Unit 2, 73 Old Market Street, Manchester, M9 8DX**. Free customer parking is available at the rear!",
        suggestions: ["What are your opening hours?", "What are delivery charges?", "Browse Matta Rice"]
      });
    }

    if (trimmedMsg.includes('delivery') || trimmedMsg.includes('postage') || trimmedMsg.includes('shipping')) {
      return NextResponse.json({
        reply: "We deliver nationwide across the UK! Standard delivery is **£3.99**, and delivery is **FREE on all orders over £50**. Local Manchester orders are dispatched with priority.",
        suggestions: ["Check store location", "Order on WhatsApp", "View Combo Kits"]
      });
    }

    if (trimmedMsg.includes('biriyani') || trimmedMsg.includes('biryani') || trimmedMsg.includes('special')) {
      return NextResponse.json({
        reply: "Our kitchen prepares authentic **Thalassery Dum Biriyani** and fresh daily specials! You can order directly online or message our kitchen team on WhatsApp at +44 7749 132122.",
        suggestions: ["View Today's Specials", "Order on WhatsApp", "Delivery info"]
      });
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: `${STORE_KNOWLEDGE_PROMPT}\n\nCustomer question: "${message}"\n\nProvide a friendly, helpful, short answer:` }
        ]
      }
    ];

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 250,
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API Error:', res.status, errText);
      // Fallback
      return NextResponse.json({
        reply: "Welcome to Kerala Superstore Manchester! We offer authentic Kerala groceries with UK fast delivery (Free over £50) and store collection at Unit 2, 73 Old Market Street, M9 8DX. How can we help you today?",
        suggestions: ["Store Location", "Delivery Charges", "Order on WhatsApp"]
      });
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const reply = candidate || "Welcome to Kerala Superstore Manchester! How may we assist your grocery shopping today?";

    return NextResponse.json({
      reply,
      suggestions: [
        "What are your delivery charges?",
        "Store address & parking?",
        "Do you have Matta Rice in stock?",
        "Order on WhatsApp (+44 7749 132122)"
      ]
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({
      reply: "Welcome to Kerala Superstore Manchester! We are located at Unit 2, 73 Old Market Street, Manchester, M9 8DX with fast UK delivery. Need immediate help? Message us directly on WhatsApp at +44 7749 132122.",
      suggestions: ["Delivery info", "Store Address", "Chat on WhatsApp"]
    });
  }
}
