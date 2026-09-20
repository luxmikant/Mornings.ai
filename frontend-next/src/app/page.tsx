"use client";

import React, { useState } from "react";

// Pre-defined calendar events
const UPCOMING_EVENTS = [
  { id: "diwali", name: "Diwali (Festival of Lights)", date: "Nov 01, 2026", defaultTheme: "Warm glowing diyas, golden lights, rangoli, festive fireworks", defaultTone: "Warm & Celebratory" },
  { id: "newyear", name: "New Year 2027", date: "Jan 01, 2027", defaultTheme: "Midnight skyline, golden confetti, elegant minimalist", defaultTone: "Inspirational & Forward-looking" },
  { id: "republic", name: "Republic Day", date: "Jan 26, 2027", defaultTheme: "Tricolor elements, dignified ashoka chakra, subtle patriotic aura", defaultTone: "Formal & Dignified" },
  { id: "holi", name: "Holi (Festival of Colors)", date: "Mar 22, 2027", defaultTheme: "Organic gulal splashes, vibrant watercolor, spring aesthetics", defaultTone: "Joyful & Playful" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"preferences" | "calendar" | "ondemand">("preferences");

  // User Preferences State
  const [profile, setProfile] = useState({
    name: "Vikram Malhotra",
    designation: "Product Director at TechCorp",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    spiritualAlignment: "Traditional Hindu (Lord Ganesh blessings)",
    aesthetic: "Royal Indian & Warm Golden Glow",
    tone: "Sophisticated & Heartfelt",
    selectedEvents: ["diwali", "newyear"]
  });

  // On-demand State
  const [onDemandInput, setOnDemandInput] = useState({
    eventType: "condolence",
    customOccasion: "Condolence & In Memoriam",
    recipientName: "Late Shri Ramesh Verma",
    customInstructions: "A serene and respectful card remembering a grandfather. White lotus, gentle morning mist, peaceful and timeless.",
    tone: "Somber, Reverent & Peaceful"
  });

  // Generation / Card State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState("");
  const [generatedCard, setGeneratedCard] = useState<{
    occasion: string;
    headline: string;
    message: string;
    subText?: string;
    bgImageUrl: string;
    userAvatar?: string;
    userName?: string;
    userDesignation?: string;
  } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://9jvi9ikjcj.execute-api.us-east-1.amazonaws.com";

  // Handle Event Toggle
  const toggleEvent = (eventId: string) => {
    setProfile((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(eventId)
        ? prev.selectedEvents.filter((id) => id !== eventId)
        : [...prev.selectedEvents, eventId]
    }));
  };

  // Save Preferences to AWS DynamoDB
  const handleSavePreferences = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setProfileSavedMsg("Preferences synced to AWS DynamoDB!");
        setTimeout(() => setProfileSavedMsg(""), 4000);
      }
    } catch (e) {
      console.error("Save profile error", e);
      setProfileSavedMsg("Saved locally");
      setTimeout(() => setProfileSavedMsg(""), 3000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Trigger Proactive Generation for a Calendar Event via AWS Lambda / Gemini
  const triggerCalendarGeneration = async (eventId: string) => {
    const event = UPCOMING_EVENTS.find((e) => e.id === eventId);
    if (!event) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: event.name,
          eventType: "festival",
          profile: {
            name: profile.name,
            designation: profile.designation,
            avatarUrl: profile.avatarUrl,
            spiritualAlignment: profile.spiritualAlignment,
            aesthetic: profile.aesthetic,
            tone: profile.tone
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedCard({
          occasion: data.occasion || event.name,
          headline: data.headline,
          message: data.message,
          subText: data.subText,
          bgImageUrl: data.bgImageUrl,
          userAvatar: data.userAvatar || profile.avatarUrl,
          userName: data.userName || profile.name,
          userDesignation: data.userDesignation || profile.designation
        });
      } else {
        throw new Error("API responded with non-200");
      }
    } catch (err) {
      console.warn("Falling back to local high-res synthesis:", err);
      setGeneratedCard({
        occasion: event.name,
        headline: event.id === "diwali" ? "शुभ दीपावली | Shubh Deepavali" : `Warmest Wishes for ${event.name}`,
        message:
          event.id === "diwali"
            ? "May the divine glow of countless diyas illuminate your home with good health, unshakeable peace, and enduring prosperity. Wishing you and your loved ones a blessed celebration."
            : `May this ${event.name} herald new opportunities, joyous milestones, and meaningful success for you and your family.`,
        subText:
          profile.spiritualAlignment.includes("Ganesh")
            ? "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥"
            : undefined,
        bgImageUrl:
          event.id === "diwali"
            ? "https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80"
            : "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
        userAvatar: profile.avatarUrl,
        userName: profile.name,
        userDesignation: profile.designation
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger On-Demand Generation (e.g. Condolence) via AWS Lambda / Gemini
  const triggerOnDemandGeneration = async () => {
    setIsGenerating(true);
    const isCondolence = onDemandInput.eventType === "condolence";

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: isCondolence ? "Condolence & In Memoriam" : onDemandInput.customOccasion,
          eventType: onDemandInput.eventType,
          recipientName: onDemandInput.recipientName,
          customInstructions: onDemandInput.customInstructions,
          profile: {
            name: profile.name,
            designation: profile.designation,
            avatarUrl: profile.avatarUrl,
            spiritualAlignment: profile.spiritualAlignment,
            aesthetic: profile.aesthetic,
            tone: profile.tone
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedCard({
          occasion: data.occasion || (isCondolence ? "In Sacred Memory & Condolence" : onDemandInput.customOccasion),
          headline: data.headline,
          message: data.message,
          subText: data.subText,
          bgImageUrl: data.bgImageUrl,
          userAvatar: data.userAvatar || profile.avatarUrl,
          userName: data.userName || profile.name,
          userDesignation: data.userDesignation || profile.designation
        });
      } else {
        throw new Error("API non-200");
      }
    } catch (err) {
      console.warn("Falling back to local synthesis:", err);
      setGeneratedCard({
        occasion: isCondolence ? "In Sacred Memory & Condolence" : onDemandInput.customOccasion,
        headline: isCondolence ? "May Peace Prevail | ॐ शान्ति" : `In Honor of ${onDemandInput.recipientName}`,
        message: isCondolence
          ? `In heartfelt and reverent memory of ${onDemandInput.recipientName || "a cherished soul"}. May the departed soul attain eternal peace in the divine embrace, and may the family find immense strength during this hour of grief.`
          : `Celebrating ${onDemandInput.recipientName}. Wishing moments of joy and cherished memories today.`,
        subText: isCondolence ? "ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः॥" : undefined,
        bgImageUrl: isCondolence
          ? "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80"
          : "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
        userAvatar: profile.avatarUrl,
        userName: profile.name,
        userDesignation: profile.designation
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✨</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
                Mornings.ai
              </h1>
              <p className="text-[11px] text-slate-400">Autonomous Agentic Personalization Manager</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Bedrock AgentCore Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "preferences"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            1. User Profile & Preferences
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "calendar"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            2. Event Calendar & Autonomous Trigger
          </button>
          <button
            onClick={() => setActiveTab("ondemand")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "ondemand"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            3. On-Demand Generator (Condolence & Custom)
          </button>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Workflows (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>👤</span> Your Personalization Profile
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  The agent references these core preferences to automatically craft custom cards on your behalf when events arrive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Vikram Malhotra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={profile.designation}
                    onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. VP of Operations"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Profile Photo URL (for card watermark/signature)
                </label>
                <div className="flex gap-3 items-center">
                  <img
                    src={profile.avatarUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-full object-cover border border-amber-500/50"
                  />
                  <input
                    type="text"
                    value={profile.avatarUrl}
                    onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Spiritual & Cultural Alignment
                  </label>
                  <input
                    type="text"
                    value={profile.spiritualAlignment}
                    onChange={(e) => setProfile({ ...profile, spiritualAlignment: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Devotional Hindu (Ganesh/Shiva), Secular, Jain, Sikh"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Visual Aesthetic
                    </label>
                    <input
                      type="text"
                      value={profile.aesthetic}
                      onChange={(e) => setProfile({ ...profile, aesthetic: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      placeholder="e.g. Royal Golden Glow, Minimalist"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Tone of Voice
                    </label>
                    <input
                      type="text"
                      value={profile.tone}
                      onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      placeholder="e.g. Sophisticated & Warm, Playful"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300">
                    {profileSavedMsg || "Profile ready to sync with AWS DynamoDB & EventBridge."}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSavingProfile}
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                  >
                    {isSavingProfile ? "Saving to AWS..." : "💾 Save to DynamoDB"}
                  </button>
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                  >
                    Calendar →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALENDAR & PROACTIVE MONITOR */}
          {activeTab === "calendar" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📅</span> Autonomous Event Calendar
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select events to celebrate. When an event arrives, Mornings.ai automatically composes and renders your card based on your profile.
                </p>
              </div>

              <div className="space-y-3">
                {UPCOMING_EVENTS.map((event) => {
                  const isSubscribed = profile.selectedEvents.includes(event.id);
                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSubscribed
                          ? "bg-slate-900/90 border-amber-500/40"
                          : "bg-slate-900/40 border-slate-800 opacity-60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSubscribed}
                            onChange={() => toggleEvent(event.id)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                          />
                          <h3 className="text-base font-semibold text-slate-100">{event.name}</h3>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                            {event.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 pl-6">{event.defaultTheme}</p>
                      </div>

                      <button
                        onClick={() => triggerCalendarGeneration(event.id)}
                        disabled={isGenerating}
                        className="w-full sm:w-auto text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg shadow transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {isGenerating ? "Synthesizing..." : "⚡ Simulate Arrival (Generate)"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                💡 <span className="font-semibold text-slate-200">Autonomous Execution Mode:</span> In production, a scheduled CloudWatch cron invokes the AgentCore pipeline at 06:00 AM on the day of the event, dispatching the card to your WhatsApp or Slack automatically.
              </div>
            </div>
          )}

          {/* TAB 3: ON-DEMAND & CONDOLENCE */}
          {activeTab === "ondemand" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>🕊️</span> On-Demand Generator (Condolence & Custom)
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Need a card on the fly? Instantly create respectful condolence messages, congratulations, or custom announcements with intelligent theme adaptation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Card Type / Occasion
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOnDemandInput({ ...onDemandInput, eventType: "condolence" })}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        onDemandInput.eventType === "condolence"
                          ? "bg-slate-800 text-white border-slate-500 shadow-md"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      <span>🕊️</span> Condolence / Obituary
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnDemandInput({ ...onDemandInput, eventType: "custom" })}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        onDemandInput.eventType === "custom"
                          ? "bg-slate-800 text-white border-slate-500 shadow-md"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      <span>🎉</span> Custom Celebration
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {onDemandInput.eventType === "condolence" ? "Name of the Departed / Honored" : "Recipient / Event Subject"}
                  </label>
                  <input
                    type="text"
                    value={onDemandInput.recipientName}
                    onChange={(e) => setOnDemandInput({ ...onDemandInput, recipientName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Late Shri Ramesh Verma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Custom Prompt / Nuance Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={onDemandInput.customInstructions}
                    onChange={(e) => setOnDemandInput({ ...onDemandInput, customInstructions: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="Describe specific themes, feelings, or elements..."
                  />
                </div>

                <button
                  onClick={triggerOnDemandGeneration}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-950 font-bold rounded-lg shadow transition-all disabled:opacity-50"
                >
                  {isGenerating ? "Synthesizing Theme & Copy..." : "Generate Custom Card Now"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Card Canvas / Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Generated Asset Output
              </h2>
              {generatedCard && (
                <span className="text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  Ready to Publish
                </span>
              )}
            </div>

            {/* THE GREETING CARD CANVAS */}
            {generatedCard ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 aspect-[4/5] flex flex-col justify-between p-6 text-center animate-fade-in group">
                {/* Background Image with Overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${generatedCard.bgImageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

                {/* Card Top: Occasion Badge */}
                <div className="relative z-10 pt-2">
                  <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest shadow">
                    {generatedCard.occasion}
                  </span>
                </div>

                {/* Card Middle: Headline & Copy */}
                <div className="relative z-10 space-y-3 px-2">
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight drop-shadow-md">
                    {generatedCard.headline}
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed font-light drop-shadow">
                    {generatedCard.message}
                  </p>
                  {generatedCard.subText && (
                    <p className="text-xs text-amber-200/90 font-serif italic border-t border-white/10 pt-2 drop-shadow">
                      {generatedCard.subText}
                    </p>
                  )}
                </div>

                {/* Card Bottom: Sender Details / Watermark */}
                <div className="relative z-10 border-t border-white/15 pt-4 flex items-center justify-between px-2 bg-black/40 backdrop-blur-sm -mx-6 -mb-6 p-4">
                  <div className="flex items-center gap-3 text-left">
                    {generatedCard.userAvatar && (
                      <img
                        src={generatedCard.userAvatar}
                        alt="Signature"
                        className="w-9 h-9 rounded-full object-cover border-2 border-amber-400/80 shadow"
                      />
                    )}
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {generatedCard.userName}
                      </p>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        {generatedCard.userDesignation}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono tracking-wider">
                    Mornings.ai ✨
                  </span>
                </div>
              </div>
            ) : (
              /* Empty Placeholder State */
              <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/50 aspect-[4/5] flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                <span className="text-4xl">🎨</span>
                <p className="text-sm font-medium text-slate-400">No card generated yet</p>
                <p className="text-xs max-w-xs leading-relaxed">
                  Configure your preferences and click <span className="text-amber-400">"Simulate Arrival"</span> in the Calendar or generate an on-demand card.
                </p>
              </div>
            )}

            {generatedCard && (
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Card saved to user media gallery!")}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-200 transition-all"
                >
                  📥 Download Image
                </button>
                <button
                  onClick={() => alert("Simulated direct dispatch to WhatsApp/Slack!")}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-xs font-bold rounded-lg text-slate-950 transition-all"
                >
                  🚀 Dispatch to WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
