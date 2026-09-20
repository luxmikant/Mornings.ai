import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name = "Vikram",
      purpose = "Good Morning",
      message = "Wishing you a peaceful and productive morning with clear skies and calm thoughts.",
      tone = "Serene & Warm",
      recipient = "Friends & Team",
    } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const nvidiaKey = process.env.NVIDIA_API_KEY;

    let headline = `${purpose}, ${name}`;
    let greetingText = message;
    let fluxPrompt = `A serene and beautiful morning greeting card scene with soft morning sunlight, peaceful dewdrops on wildflowers, tranquil dawn mist, clean negative space, 8k resolution, cinematic natural lighting, photorealistic editorial art`;

    // Step 1: Craft rich copy & specialized visual prompt using Gemini
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const promptInstruction = `You are a creative director for personalized morning greetings.
Create a thoughtful greeting and an image generation prompt.

User Name: ${name}
Occasion / Purpose: ${purpose}
What they want to say: ${message}
Tone: ${tone}
Recipient: ${recipient}

CRITICAL RULES FOR "fluxPrompt":
- Keep under 40 words.
- Describe ONLY serene nature scenes (e.g. golden morning light over misty lake, wildflowers, dewdrops, sunrise, calm pastel sky, water lilies).
- For Diwali: warm traditional golden diya lamps with soft bokeh.
- For Condolence: tranquil white lotus flowers in morning pond, peaceful silver mist.
- NEVER use sensitive or ambiguous words like "kissed", "blades", "sharp", "naked", "sensual", "flesh" to strictly prevent content filters.
- Photorealistic 8k, cinematic depth of field, clean negative space.

Return ONLY raw JSON:
{
  "headline": "Short title (max 5 words)",
  "greeting": "2-sentence warm greeting matching occasion and feelings.",
  "fluxPrompt": "Serene nature scene description under 40 words."
}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
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
          if (parsed.headline && typeof parsed.headline === "string") headline = parsed.headline.trim();
          if (parsed.greeting && typeof parsed.greeting === "string") greetingText = parsed.greeting.trim();
          if (parsed.fluxPrompt && typeof parsed.fluxPrompt === "string") fluxPrompt = parsed.fluxPrompt.trim();
        }
      } catch (err) {
        console.warn("Gemini prompt enhancement notice:", err);
      }
    }

    // Sanitize prompt of sensitive filter words
    const sanitizePrompt = (p: string) => {
      return p
        .replace(/dew-kissed|sun-kissed|kissed/gi, "dewy")
        .replace(/blades of grass|blades/gi, "meadow grass")
        .replace(/sharp/gi, "gentle")
        .trim();
    };

    const getSafeScenicPrompt = (purp: string) => {
      const lower = purp.toLowerCase();
      if (lower.includes("diwali")) {
        return "Warm traditional earthen diya lamps glowing peacefully with soft marigold bokeh, subtle festive light, cinematic, photorealistic 8k";
      }
      if (lower.includes("condolence") || lower.includes("shanti") || lower.includes("memorial")) {
        return "A peaceful white water lily in a tranquil morning pond, gentle dawn mist, soft silver lighting, quiet elegance, photorealistic 8k";
      }
      return "A serene morning sunrise with gentle golden light over a tranquil lake, water lilies, soft dawn mist, pastel sky, cinematic, photorealistic 8k";
    };

    let imageBase64 = "";
    let modelUsed = "flux.2-klein-4b";

    // Step 2: Try Nano Banana Pro preview first if configured (with 3.5s fast timeout)
    if (geminiKey) {
      try {
        const nanoBananaUrl = `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${geminiKey}`;
        const nanoRes = await fetch(nanoBananaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate image: ${sanitizePrompt(fluxPrompt)}` }] }],
          }),
        });

        if (nanoRes.ok) {
          const nanoData = await nanoRes.json();
          const parts = nanoData.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.inlineData && p.inlineData.data) {
              const mime = p.inlineData.mimeType || "image/png";
              imageBase64 = `data:${mime};base64,${p.inlineData.data}`;
              modelUsed = "nano-banana-pro-preview";
              break;
            }
          }
        }
      } catch (nanoErr) {
        console.warn("Nano Banana Pro notice (fast-fail to FLUX):", nanoErr instanceof Error ? nanoErr.message : nanoErr);
      }
    }

    // Step 3: Fast & High-fidelity synthesis using flux.2-klein-4b on NVIDIA NIM with automatic safe retry
    if (!imageBase64 && nvidiaKey) {
      const endpoint = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";
      const candidatePrompts = [
        sanitizePrompt(fluxPrompt),
        getSafeScenicPrompt(purpose)
      ];

      for (const p of candidatePrompts) {
        try {
          const imgRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${nvidiaKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(18000),
            body: JSON.stringify({ prompt: p }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const artifact = imgData.artifacts?.[0];
            if (artifact?.base64 && artifact.finishReason !== "CONTENT_FILTERED") {
              imageBase64 = `data:image/png;base64,${artifact.base64}`;
              modelUsed = "flux.2-klein-4b";
              fluxPrompt = p;
              break;
            } else {
              console.warn("FLUX content filtered on prompt, automatically retrying with guaranteed safe scenic prompt...");
            }
          } else {
            const errBody = await imgRes.text().catch(() => "");
            console.warn(`Endpoint ${endpoint} returned status ${imgRes.status}: ${errBody.slice(0, 150)}`);
          }
        } catch (e) {
          console.warn(`Error on ${endpoint}:`, e);
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
