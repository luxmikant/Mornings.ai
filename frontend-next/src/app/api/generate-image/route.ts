import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Allow sufficient time for FLUX model inference

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name = "Vikram",
      purpose = "Good Morning",
      message = "Wishing you a peaceful and productive day ahead.",
      tone = "Warm & Thoughtful",
      recipient = "Friends & Colleagues",
    } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const nvidiaKey = process.env.NVIDIA_API_KEY;

    let headline = `${purpose}, ${name}`;
    let greetingText = message;
    let fluxPrompt = `Elegant minimalist ${purpose} card, soft natural morning sunlight, peaceful aesthetic, dewdrops on white petals, serene landscape, editorial photography, 8k resolution, cinematic lighting, clean composition with negative space`;

    // Step 1: Craft rich copy & specialized FLUX prompt using Gemini
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const promptInstruction = `You are an elite creative director for personalized greeting cards.
Create a thoughtful greeting and a tailored image generation prompt for the FLUX 2 Klein AI image model.

User Name: ${name}
Purpose / Occasion: ${purpose} (e.g., "Good morning", Diwali, Birthday, Condolence, Congratulations)
What they want to say: ${message}
Tone: ${tone}
Recipient: ${recipient}

Return ONLY a raw JSON object with these keys:
{
  "headline": "A short, dignified title (max 5-6 words)",
  "greeting": "A 2-sentence heartfelt greeting matching the tone and occasion.",
  "fluxPrompt": "A highly descriptive visual prompt for FLUX.2 Klein image generator describing a beautiful background scene matching the occasion (e.g. serene dawn, warm festive lamps, or quiet lotus mist). Specify soft lighting, cinematic depth, editorial composition, 8k."
}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptInstruction }] }],
          }),
        });

        if (geminiRes.ok) {
          const gemData = await geminiRes.json();
          let rawText = gemData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawText.includes("```json")) {
            rawText = rawText.split("```json")[1].split("```")[0].trim();
          } else if (rawText.includes("```")) {
            rawText = rawText.split("```")[1].split("```")[0].trim();
          }
          const parsed = JSON.parse(rawText);
          if (parsed.headline) headline = parsed.headline;
          if (parsed.greeting) greetingText = parsed.greeting;
          if (parsed.fluxPrompt) fluxPrompt = parsed.fluxPrompt;
        }
      } catch (err) {
        console.warn("Gemini prompt enhancement notice:", err);
      }
    }

    // Step 2: Call flux.2-klein-4b on NVIDIA NIM
    let imageBase64 = "";
    let modelUsed = "flux.2-klein-4b";

    if (nvidiaKey) {
      const endpoints = [
        "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b",
        "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell",
      ];

      for (const endpoint of endpoints) {
        try {
          const imgRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${nvidiaKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              prompt: fluxPrompt,
              mode: "base",
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const b64 = imgData.artifacts?.[0]?.base64;
            if (b64) {
              imageBase64 = `data:image/png;base64,${b64}`;
              modelUsed = endpoint.includes("flux.2-klein-4b") ? "flux.2-klein-4b" : "flux.1-schnell";
              break;
            }
          } else {
            console.warn(`Endpoint ${endpoint} returned ${imgRes.status}`);
          }
        } catch (e) {
          console.warn(`Error connecting to ${endpoint}:`, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      headline,
      greeting: greetingText,
      promptUsed: fluxPrompt,
      modelUsed,
      imageBase64,
      userName: name,
      purpose,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
