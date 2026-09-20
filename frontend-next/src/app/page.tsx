"use client";

import React, { useState, useRef } from "react";

export default function App() {
  // Navigation view: "home" (storytelling hero) or "demo" (questionnaire & generator)
  const [currentView, setCurrentView] = useState<"home" | "demo">("home");

  // User Questionnaire State
  const [formData, setFormData] = useState({
    name: "Vikram Malhotra",
    purpose: "Good Morning",
    customPurpose: "",
    message: "Wishing you a calm morning, clear thoughts, and steady progress today.",
    tone: "Serene & Warm",
    recipient: "Friends & Team",
    scheduleTrigger: "06:00 AM Daily",
  });

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [result, setResult] = useState<{
    headline: string;
    greeting: string;
    promptUsed: string;
    modelUsed: string;
    imageBase64: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger real generation via flux.2-klein-4b API
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep("Analyzing purpose & crafting specialized prompt...");

    try {
      const activePurpose =
        formData.purpose === "Custom" ? formData.customPurpose || "Personal Greeting" : formData.purpose;

      setTimeout(() => {
        setGenerationStep("Synthesizing image with flux.2-klein-4b neural model...");
      }, 1200);

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          purpose: activePurpose,
          message: formData.message,
          tone: formData.tone,
          recipient: formData.recipient,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      // Render onto canvas for composited download
      if (data.imageBase64) {
        renderCompositedCard(data);
      }
    } catch (err) {
      console.error("Generation error:", err);
      alert("Notice: Could not connect to image server. Please check your network or try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Render the final card with typography onto an HTML5 Canvas for local PNG export
  const renderCompositedCard = (cardData: {
    headline: string;
    greeting: string;
    imageBase64: string;
  }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cardData.imageBase64;
    img.onload = () => {
      canvas.width = 1080;
      canvas.height = 1350;

      // Draw background image
      ctx.drawImage(img, 0, 0, 1080, 1350);

      // Gradient scrim at bottom 45%
      const gradient = ctx.createLinearGradient(0, 1350 * 0.45, 0, 1350);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.3, "rgba(10, 10, 12, 0.45)");
      gradient.addColorStop(1, "rgba(10, 10, 12, 0.88)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 1350 * 0.45, 1080, 1350 * 0.55);

      // Top occasion badge
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.roundRect(40, 40, 240, 40, 20);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(formData.purpose.toUpperCase(), 60, 66);

      // Headline
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px serif";
      ctx.fillText(cardData.headline, 60, 1350 * 0.72);

      // Greeting message (wrapped)
      ctx.fillStyle = "#E4E4E7";
      ctx.font = "24px sans-serif";
      wrapText(ctx, cardData.greeting, 60, 1350 * 0.78, 960, 36);

      // Signature bar
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(40, 1350 - 100, 1000, 1);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(formData.name, 60, 1350 - 50);

      ctx.fillStyle = "#A1A1AA";
      ctx.font = "16px sans-serif";
      ctx.fillText("Sent via Mornings", 1080 - 220, 1350 - 50);
    };
  };

  // Helper to wrap canvas text
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    let curY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  };

  // Direct download to user device as PNG
  const handleDownloadComposited = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `greeting-${formData.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Direct download of raw FLUX 2 Klein AI image
  const handleDownloadRawImage = () => {
    if (!result?.imageBase64) return;
    const a = document.createElement("a");
    a.href = result.imageBase64;
    a.download = `flux2-artwork-${formData.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] font-sans antialiased selection:bg-zinc-200">
      {/* Hidden canvas for client-side local compositing & instant file export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ────────────────────────────────────────────────────────────
          1. MINIMALIST EDITORIAL HEADER (LIGHT THEME)
      ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => setCurrentView("home")}
            className="cursor-pointer flex items-center space-x-2.5"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-serif text-sm font-semibold">
              M
            </div>
            <span className="font-serif text-lg font-semibold tracking-tight text-zinc-900">
              Mornings
            </span>
          </div>

          <nav className="flex items-center space-x-6 text-xs font-medium text-zinc-600">
            <button
              onClick={() => setCurrentView("home")}
              className={`hover:text-zinc-900 transition-colors ${
                currentView === "home" ? "text-zinc-900 font-semibold" : ""
              }`}
            >
              Story
            </button>
            <button
              onClick={() => setCurrentView("demo")}
              className={`hover:text-zinc-900 transition-colors ${
                currentView === "demo" ? "text-zinc-900 font-semibold" : ""
              }`}
            >
              Studio
            </button>
          </nav>

          <div className="flex items-center">
            {currentView === "home" ? (
              <button
                onClick={() => setCurrentView("demo")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                Try Demo →
              </button>
            ) : (
              <button
                onClick={() => setCurrentView("home")}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all"
              >
                ← Back to Story
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          VIEW A: STORYTELLING HERO (NO AI SLOP, LIGHT THEME)
      ──────────────────────────────────────────────────────────── */}
      {currentView === "home" && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-24">
          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 border border-zinc-200 bg-zinc-50 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                Personalized Morning Artifacts · Model: flux.2-klein-4b
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-zinc-900 leading-[1.15]">
              Every morning, millions wake up to forwarded spam. <br />
              <span className="italic font-serif text-zinc-600">
                We make thoughtful greetings effortless.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 max-w-xl mx-auto font-light leading-relaxed">
              When you want to say "Good morning" or honor an important festival, you shouldn't have to copy-paste pixelated internet forwards. Tell Mornings who you want to greet, and our system generates a tailored, high-resolution artwork directly onto your device.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentView("demo")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-6 py-3 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>Try Demo Now</span>
                <span>→</span>
              </button>
            </div>
          </section>

          {/* The Problem & Solution Breakdown */}
          <section className="border-t border-zinc-200/80 pt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">
                The Problem
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-zinc-900">
                The 07:00 AM Forward Dilemma
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed font-light">
                Whether it is wishing your team a productive week or greeting elders on Diwali, maintaining personal warmth across hundreds of contacts is exhausting. People resort to mass forwards that end up muted in group chats.
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">
                The Solution
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-zinc-900">
                Bespoke Artistry at Scheduled Hours
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed font-light">
                Mornings accepts your intent, structures a personalized prompt, and invokes <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-zinc-800">flux.2-klein-4b</code> to render an original, calm image. The final card saves immediately to your local device.
              </p>
            </div>
          </section>

          {/* Feature Pillars */}
          <section className="border-t border-zinc-200/80 pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 space-y-2 shadow-xs">
              <div className="text-xl">☀️</div>
              <h3 className="font-serif text-base font-semibold text-zinc-900">Morning Intention</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Define what you want to convey — peace, encouragement, celebration, or condolences.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 space-y-2 shadow-xs">
              <div className="text-xl">🎨</div>
              <h3 className="font-serif text-base font-semibold text-zinc-900">FLUX 2 Klein Synthesis</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Generates original aesthetic backgrounds with soft natural lighting and editorial negative space.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 space-y-2 shadow-xs">
              <div className="text-xl">📥</div>
              <h3 className="font-serif text-base font-semibold text-zinc-900">Local Device Storage</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Downloaded directly to your phone or computer. Zero remote storage delays.
              </p>
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section className="p-10 rounded-2xl bg-zinc-100 border border-zinc-200 text-center space-y-4">
            <h3 className="font-serif text-2xl text-zinc-900">
              Ready to create your greeting?
            </h3>
            <p className="text-xs text-zinc-600 max-w-md mx-auto">
              Answer 3 quick preferences and let FLUX 2 Klein render your personalized morning greeting.
            </p>
            <button
              onClick={() => setCurrentView("demo")}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition-all"
            >
              Open Studio →
            </button>
          </section>
        </main>
      )}

      {/* ────────────────────────────────────────────────────────────
          VIEW B: THE DEMO & QUESTIONNAIRE STUDIO
      ──────────────────────────────────────────────────────────── */}
      {currentView === "demo" && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-zinc-900">
                Personalization Studio
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Answer the questions below to synthesize a tailored greeting card using flux.2-klein-4b.
              </p>
            </div>

            <button
              onClick={() => setCurrentView("home")}
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ← Back to Story
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: The Questionnaire Form (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-5">
                {/* Question 1: Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    1. What is your name or signature?
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                    placeholder="e.g. Vikram Malhotra"
                  />
                  <span className="text-[11px] text-zinc-400">
                    This will appear as the signature on your greeting card.
                  </span>
                </div>

                {/* Question 2: Purpose & Occasion */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    2. What is the occasion or purpose?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Good Morning", "Diwali", "Condolence", "Custom"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, purpose: p })}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          formData.purpose === p
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                            : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {formData.purpose === "Custom" && (
                    <input
                      type="text"
                      value={formData.customPurpose}
                      onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                      className="w-full mt-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none"
                      placeholder="Specify occasion (e.g. New Year, Birthday, Promotion)..."
                    />
                  )}
                </div>

                {/* Question 3: Message / What do you want to say */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    3. What do you want to say to the people you are greeting?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                    placeholder="e.g. Wishing you a peaceful and productive morning ahead."
                  />
                  <span className="text-[11px] text-zinc-400">
                    Explain your feeling or thought. The AI will weave this into the artwork and text.
                  </span>
                </div>

                {/* Question 4: Tone & Recipient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      4. Desired Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:bg-white focus:border-zinc-400 focus:outline-none"
                    >
                      <option value="Serene & Warm">Serene & Warm</option>
                      <option value="Formal & Executive">Formal & Executive</option>
                      <option value="Inspirational">Inspirational</option>
                      <option value="Somber & Reverent">Somber & Reverent (Condolence)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      5. Target Recipients
                    </label>
                    <input
                      type="text"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:bg-white focus:border-zinc-400 focus:outline-none"
                      placeholder="e.g. Friends & Family, Colleagues"
                    />
                  </div>
                </div>

                {/* Scheduled Cron Option */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-zinc-800">
                      Autonomous Morning Trigger
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Pre-generate daily at 06:00 AM so it is ready on waking up.
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-white border border-zinc-200 px-2.5 py-1 rounded text-zinc-700">
                    {formData.scheduleTrigger}
                  </span>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{generationStep || "Generating..."}</span>
                    </>
                  ) : (
                    <span>Generate Artwork with FLUX 2 Klein</span>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: The Result Canvas & Direct Download (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Generated Output Artifact
                </span>
                {result && (
                  <span className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded">
                    Model: {result.modelUsed}
                  </span>
                )}
              </div>

              {result?.imageBase64 ? (
                <div className="space-y-4">
                  {/* Real Card Preview with overlay */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-zinc-200 bg-white aspect-[4/5] flex flex-col justify-between p-6">
                    <img
                      src={result.imageBase64}
                      alt="FLUX generation"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    <div className="relative z-10 flex justify-between items-start">
                      <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full">
                        {formData.purpose}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-2 text-white">
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                        {result.headline}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-200 font-light leading-relaxed">
                        {result.greeting}
                      </p>

                      <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
                        <span className="font-semibold">{formData.name}</span>
                        <span className="text-[11px] text-zinc-300 font-mono">Mornings · flux.2-klein-4b</span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Local Download Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadComposited}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>📥 Download Card (PNG)</span>
                    </button>
                    <button
                      onClick={handleDownloadRawImage}
                      className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>🎨 Save Raw Artwork</span>
                    </button>
                  </div>

                  {/* Prompt Transparency */}
                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 text-[11px] text-zinc-500 space-y-1">
                    <span className="font-semibold text-zinc-700 uppercase tracking-wider block font-mono text-[10px]">
                      Synthesized Visual Prompt for FLUX.2 Klein:
                    </span>
                    <p className="italic">{result.promptUsed}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white aspect-[4/5] flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-xl">
                    🖼️
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-zinc-800">Awaiting your preferences</div>
                    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                      Fill in the questionnaire on the left and click <strong>"Generate Artwork"</strong> to invoke flux.2-klein-4b.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ────────────────────────────────────────────────────────────
          FOOTER (MINIMALIST & CLEAN)
      ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 bg-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-semibold text-zinc-800">Mornings</span>
            <span>·</span>
            <span>Personalization Engine powered by flux.2-klein-4b</span>
          </div>
          <div>All generated files save directly to your local device.</div>
        </div>
      </footer>
    </div>
  );
}
