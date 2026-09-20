"use client";

import React, { useState, useRef } from "react";

// Pre-defined Intent Presets for the Luminous Morning Prism
const MORNING_INTENTS = [
  {
    id: "serene",
    time: "06:00 AM",
    label: "Serene Dawn",
    tagline: "Calm contemplation & clear thoughts for friends & team",
    glowColor: "from-amber-200/50 via-rose-100/40 to-sky-100/40",
    shadowColor: "rgba(251, 191, 36, 0.22)",
    accentBg: "bg-amber-500/10 text-amber-800 border-amber-200",
    samplePrompt: "Early morning mountain sunrise through mist, delicate dew drops on wildflowers, quiet pastel sky, 8k",
    sampleHeadline: "A Calm Dawn, A Clear Day",
    sampleGreeting: "May your morning unfold with steady quietude and clear focus. Wishing you moments of joy in today's work.",
    previewImg: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "golden",
    time: "06:30 AM",
    label: "Golden Hour Energy",
    tagline: "Warm encouragement, optimism & milestone celebrations",
    glowColor: "from-orange-200/50 via-amber-200/40 to-yellow-100/40",
    shadowColor: "rgba(245, 158, 11, 0.25)",
    accentBg: "bg-orange-500/10 text-orange-800 border-orange-200",
    samplePrompt: "Golden hour warm sunlight casting long serene shadows on minimal architectural garden, quiet elegance",
    sampleHeadline: "Radiance & Steady Momentum",
    sampleGreeting: "Wishing you an energizing morning. May every step you take today open new doors and bring meaningful progress.",
    previewImg: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "festive",
    time: "06:45 AM",
    label: "Sacred Festive Light",
    tagline: "Traditional auspicious occasions: Diwali, New Year & milestones",
    glowColor: "from-yellow-200/60 via-amber-300/40 to-rose-200/40",
    shadowColor: "rgba(217, 119, 6, 0.28)",
    accentBg: "bg-yellow-500/10 text-yellow-800 border-yellow-200",
    samplePrompt: "Warm traditional earthen diya glow with soft marigold bokeh, subtle sacred elegance, clean negative space",
    sampleHeadline: "शुभ दीपावली | Shubh Deepavali",
    sampleGreeting: "May the divine glow of countless diyas bring enduring health, abundant harmony, and prosperity to your household.",
    previewImg: "https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "shanti",
    time: "07:00 AM",
    label: "Tranquil Remembrance",
    tagline: "Sacred peace, heartfelt condolence & memorial greetings",
    glowColor: "from-slate-200/60 via-zinc-200/40 to-stone-100/40",
    shadowColor: "rgba(148, 163, 184, 0.25)",
    accentBg: "bg-slate-500/10 text-slate-800 border-slate-200",
    samplePrompt: "Peaceful white water lily in tranquil morning pond, gentle silver dawn mist, sacred quietude, photorealistic",
    sampleHeadline: "In Sacred Solace | ॐ शान्ति",
    sampleGreeting: "In heartfelt and reverent memory. May the departed soul find eternal solace in divine grace, and may your family find deep peace.",
    previewImg: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "studio">("home");
  const [selectedIntent, setSelectedIntent] = useState(MORNING_INTENTS[0]);

  // Form Questionnaire State
  const [formData, setFormData] = useState({
    name: "Vikram Malhotra",
    purpose: "Good Morning",
    customPurpose: "",
    message: "Wishing you a calm morning, clear thoughts, and steady progress today.",
    tone: "Serene & Warm",
    recipient: "Friends & Team",
    scheduleHour: "06:00 AM",
  });

  // Image Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedResult, setGeneratedResult] = useState<{
    headline: string;
    greeting: string;
    promptUsed: string;
    modelUsed: string;
    imageBase64: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Invoke API for genuine AI image synthesis (Nano Banana Pro / FLUX 2 Klein)
  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage("Harmonizing prompt & feelings...");

    try {
      const activePurpose =
        formData.purpose === "Custom"
          ? formData.customPurpose || "Personal Greeting"
          : formData.purpose;

      setTimeout(() => {
        setStatusMessage("Invoking neural model (flux.2-klein-4b / nano-banana-pro)...");
      }, 1000);

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
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      setGeneratedResult(data);

      if (data.imageBase64) {
        renderCompositedCard(data);
      }
    } catch (err) {
      console.error("Generation error:", err);
      alert("Notice: Could not connect to image server. Please check your network or try again.");
    } finally {
      setIsGenerating(false);
      setStatusMessage("");
    }
  };

  // Render to canvas for 1-click local file download
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

      // Draw AI generated artwork
      ctx.drawImage(img, 0, 0, 1080, 1350);

      // Delicate dark gradient scrim at the lower 45%
      const gradient = ctx.createLinearGradient(0, 1350 * 0.45, 0, 1350);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.3, "rgba(15, 18, 22, 0.45)");
      gradient.addColorStop(1, "rgba(15, 18, 22, 0.9)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 1350 * 0.45, 1080, 1350 * 0.55);

      // Top occasion pill
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.beginPath();
      ctx.roundRect(50, 50, 240, 42, 21);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(formData.purpose.toUpperCase(), 75, 76);

      // Headline
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px serif";
      ctx.fillText(cardData.headline, 60, 1350 * 0.72);

      // Greeting copy
      ctx.fillStyle = "#E4E4E7";
      ctx.font = "24px sans-serif";
      wrapCanvasText(ctx, cardData.greeting, 60, 1350 * 0.78, 960, 36);

      // Footer divider & signature
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      ctx.fillRect(50, 1350 - 95, 980, 1);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(formData.name, 60, 1350 - 45);

      ctx.fillStyle = "#A1A1AA";
      ctx.font = "16px sans-serif";
      ctx.fillText("Mornings · AI Artifact", 1080 - 240, 1350 - 45);
    };
  };

  const wrapCanvasText = (
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

  // 1-Click download to local device
  const handleDownloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `morning-greeting-${formData.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadArtworkOnly = () => {
    if (!generatedResult?.imageBase64) return;
    const a = document.createElement("a");
    a.href = generatedResult.imageBase64;
    a.download = `artwork-flux2-${formData.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] font-sans antialiased selection:bg-zinc-200">
      <canvas ref={canvasRef} className="hidden" />

      {/* ────────────────────────────────────────────────────────────
          1. MINIMALIST EDITORIAL HEADER (LIGHT THEME)
      ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-50">
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
              Story & Vision
            </button>
            <button
              onClick={() => setCurrentView("studio")}
              className={`hover:text-zinc-900 transition-colors ${
                currentView === "studio" ? "text-zinc-900 font-semibold" : ""
              }`}
            >
              Interactive Studio
            </button>
          </nav>

          <div>
            {currentView === "home" ? (
              <button
                onClick={() => setCurrentView("studio")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-xs"
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
          VIEW A: THE STORYTELLING WEBSITE + GLOWING SOLAR PRISM
      ──────────────────────────────────────────────────────────── */}
      {currentView === "home" && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-24">
          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 border border-zinc-200/90 bg-white px-3.5 py-1.5 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                Autonomous Morning Personalization
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-zinc-900 leading-[1.14]">
              Every morning, millions wake up to forwarded spam. <br />
              <span className="italic font-serif text-zinc-600">
                We make thoughtful greetings effortless.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 max-w-xl mx-auto font-light leading-relaxed">
              When you want to say "Good morning" or honor an important festival, you shouldn't have to forward pixelated internet clipart. Tell Mornings your intention, and our neural engine crafts a serene, original artwork saved directly onto your device.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentView("studio")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-6 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <span>Launch Personalization Studio</span>
                <span>→</span>
              </button>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
              THE UNIQUE GLOWING COMPONENT: "THE MORNING AURA PRISM"
              Interactive, living morning light widget with ambient caustics
          ──────────────────────────────────────────────────────── */}
          <section className="relative max-w-3xl mx-auto">
            {/* Ambient Animated Sunbeam Glow (Soft light caustics) */}
            <div
              className={`absolute -inset-6 rounded-3xl bg-gradient-to-r ${selectedIntent.glowColor} opacity-70 blur-3xl transition-all duration-1000 -z-10`}
            />

            {/* The Floating Luminous Glass Card */}
            <div className="rounded-3xl bg-white/95 border border-zinc-200/90 p-8 sm:p-10 shadow-xl backdrop-blur-xl space-y-8 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-600">
                    The Luminous Morning Prism
                  </span>
                  <h2 className="font-serif text-2xl text-zinc-900 mt-1">
                    Select Your Morning Atmosphere
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-mono text-zinc-600">
                    Trigger: {selectedIntent.time}
                  </span>
                </div>
              </div>

              {/* The Intent Dial Buttons (Tactile, Pale, Luminous) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {MORNING_INTENTS.map((intent) => {
                  const isActive = selectedIntent.id === intent.id;
                  return (
                    <button
                      key={intent.id}
                      onClick={() => setSelectedIntent(intent)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        isActive
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-md scale-[1.02]"
                          : "bg-zinc-50/80 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200/80"
                      }`}
                    >
                      <div className="text-xs font-mono opacity-60 mb-1">{intent.time}</div>
                      <div className="text-xs font-semibold">{intent.label}</div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Live Preview Card within the Prism */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-[16/10] sm:aspect-[16/9] shadow-inner flex flex-col justify-between p-6 sm:p-8 text-white transition-all duration-700 group">
                <img
                  src={selectedIntent.previewImg}
                  alt={selectedIntent.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                <div className="relative z-10 flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white">
                    {selectedIntent.label}
                  </span>
                  <span className="text-[11px] font-mono text-white/80">
                    Auto-Dispatched at {selectedIntent.time}
                  </span>
                </div>

                <div className="relative z-10 space-y-2 max-w-xl">
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow">
                    {selectedIntent.sampleHeadline}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-200 font-light leading-relaxed drop-shadow">
                    {selectedIntent.sampleGreeting}
                  </p>
                </div>

                <div className="relative z-10 border-t border-white/20 pt-3 flex items-center justify-between text-xs text-zinc-300">
                  <span>Vikram Malhotra · Founder</span>
                  <span className="font-mono text-[11px] text-amber-300">Zero Generic Forward Spam ✓</span>
                </div>
              </div>

              {/* Subtext description */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-zinc-500">
                <p className="max-w-md font-light leading-relaxed">
                  {selectedIntent.tagline}. Our neural pipeline generates authentic imagery without pixelated forward stamps.
                </p>
                <button
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      purpose: selectedIntent.label,
                      message: selectedIntent.sampleGreeting,
                    }));
                    setCurrentView("studio");
                  }}
                  className="whitespace-nowrap px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 font-medium transition-colors"
                >
                  Personalize This Atmosphere →
                </button>
              </div>
            </div>
          </section>

          {/* Problem Breakdown */}
          <section className="border-t border-zinc-200/80 pt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">
                The Core Problem
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900">
                Forward Fatigue Ruins Warmth
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed font-light">
                Group chats get muted because people receive 50 identical glitter GIFs. Founders and family leaders want to show genuine care, but manually writing 200 custom greetings takes half the morning.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">
                The Solution
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900">
                Bespoke Artistry Saved to Your Device
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed font-light">
                Mornings translates your intent into specialized neural prompts, generating peaceful scenery with clean negative space, and saves the final composite card directly to your phone or laptop.
              </p>
            </div>
          </section>

          {/* CTA Box */}
          <section className="p-10 rounded-2xl bg-zinc-100 border border-zinc-200 text-center space-y-4">
            <h3 className="font-serif text-2xl text-zinc-900">
              Ready to create your custom morning greeting?
            </h3>
            <p className="text-xs text-zinc-600 max-w-md mx-auto">
              Answer 3 quick preferences and let our neural engine render your tailored greeting card.
            </p>
            <button
              onClick={() => setCurrentView("studio")}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition-all"
            >
              Open Studio →
            </button>
          </section>
        </main>
      )}

      {/* ────────────────────────────────────────────────────────────
          VIEW B: THE QUESTIONNAIRE & GENERATOR STUDIO
      ──────────────────────────────────────────────────────────── */}
      {currentView === "studio" && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-zinc-900">
                Personalization Studio
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Answer the questionnaire to synthesize an authentic greeting card with genuine AI generation.
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
            {/* LEFT: Questionnaire Form (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-5">
                {/* Q1: Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-800">
                    1. What is your name / signature?
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                    placeholder="e.g. Vikram Malhotra"
                  />
                  <span className="text-[11px] text-zinc-400">
                    This appears as the executive watermark/signature on your greeting card.
                  </span>
                </div>

                {/* Q2: Purpose / Occasion */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-800">
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
                      placeholder="Specify custom occasion (e.g. New Year, Birthday, Milestone)..."
                    />
                  )}
                </div>

                {/* Q3: What do you want to say */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-800">
                    3. What do you want to say to the people you are greeting?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                    placeholder="e.g. I want to wish them a peaceful morning with clarity and steady energy."
                  />
                  <span className="text-[11px] text-zinc-400">
                    Explain your feeling or thought. The model weaves this into the artwork and headline.
                  </span>
                </div>

                {/* Q4: Tone & Recipient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-800">
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
                    <label className="block text-xs font-semibold text-zinc-800">
                      5. Target Recipients
                    </label>
                    <input
                      type="text"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:bg-white focus:border-zinc-400 focus:outline-none"
                      placeholder="e.g. Friends & Family, Clients"
                    />
                  </div>
                </div>

                {/* Scheduled Morning Component */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-zinc-800">
                      Autonomous Morning Schedule
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Pre-generates daily at 06:00 AM so it is ready on waking up.
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-white border border-zinc-200 px-2.5 py-1 rounded text-zinc-700">
                    {formData.scheduleHour} Daily
                  </span>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{statusMessage || "Generating..."}</span>
                    </>
                  ) : (
                    <span>Generate Artwork with AI</span>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT: Output Artifact & Direct Download (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Generated Output Artifact
                </span>
                {generatedResult && (
                  <span className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded">
                    Engine: {generatedResult.modelUsed}
                  </span>
                )}
              </div>

              {generatedResult?.imageBase64 ? (
                <div className="space-y-4">
                  {/* The Luminous Preview Card */}
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-zinc-200 bg-white aspect-[4/5] flex flex-col justify-between p-6">
                    <img
                      src={generatedResult.imageBase64}
                      alt="AI generation"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    <div className="relative z-10 flex justify-between items-start">
                      <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full">
                        {formData.purpose}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-2 text-white">
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                        {generatedResult.headline}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-200 font-light leading-relaxed">
                        {generatedResult.greeting}
                      </p>

                      <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
                        <span className="font-semibold">{formData.name}</span>
                        <span className="text-[11px] text-zinc-300 font-mono">
                          Mornings · {generatedResult.modelUsed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Local Download Buttons (Direct to Device) */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadCard}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>📥 Download Card (PNG)</span>
                    </button>
                    <button
                      onClick={handleDownloadArtworkOnly}
                      className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>🎨 Save Raw Artwork</span>
                    </button>
                  </div>

                  {/* Visual Prompt Transparency */}
                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 text-[11px] text-zinc-500 space-y-1">
                    <span className="font-semibold text-zinc-700 uppercase tracking-wider block font-mono text-[10px]">
                      Synthesized Visual Prompt for Image Generator:
                    </span>
                    <p className="italic">{generatedResult.promptUsed}</p>
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
                      Fill in the questionnaire and click <strong>"Generate Artwork with AI"</strong> to synthesize your image.
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
            <span>Autonomous Greeting Engine</span>
          </div>
          <div>All generated files save directly to your local device.</div>
        </div>
      </footer>
    </div>
  );
}
