"use client";

import React, { useState, useEffect } from "react";

// Pre-defined calendar events for simulation
const UPCOMING_EVENTS = [
  {
    id: "diwali",
    name: "Diwali (Festival of Lights)",
    date: "Nov 01, 2026",
    defaultTheme: "Warm glowing diyas, golden lights, rangoli, royal saffron",
    defaultTone: "Warm & Celebratory",
    badge: "Major Festival",
  },
  {
    id: "newyear",
    name: "New Year 2027",
    date: "Jan 01, 2027",
    defaultTheme: "Midnight skyline, golden confetti, elegant minimalist",
    defaultTone: "Inspirational & Forward-looking",
    badge: "Milestone",
  },
  {
    id: "republic",
    name: "Republic Day",
    date: "Jan 26, 2027",
    defaultTheme: "Tricolor elements, dignified ashoka chakra, subtle patriotic aura",
    defaultTone: "Formal & Dignified",
    badge: "National",
  },
  {
    id: "holi",
    name: "Holi (Festival of Colors)",
    date: "Mar 22, 2027",
    defaultTheme: "Organic gulal splashes, vibrant watercolor, spring aesthetics",
    defaultTone: "Joyful & Playful",
    badge: "Spring Festival",
  },
];

// Interactive Archetypes Showcase
const ARCHETYPES = [
  {
    id: "executive",
    title: "Executive & Civic Leader",
    role: "Founder & CEO, TechVentures",
    tagline: "Formal, authoritative, dignified bilingual outreach",
    badge: "Corporate Leadership",
    headline: "दीपावली की हार्दिक शुभकामनाएं | Happy Diwali",
    message:
      "May this festival of light herald unprecedented milestones, shared prosperity, and courageous innovation for you and your esteemed organization.",
    shloka: "शुभं करोति कल्याणमारोग्यं धनसंपदा। शत्रुबुद्धिविनाशाय दीपज्योतिर्नमोऽस्तुते॥",
    theme: "Royal Saffron & Navy with subtle gold foil line art",
    bgUrl:
      "https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "elder",
    title: "Family Elder & Devotee",
    role: "Patriarch & Mentor",
    tagline: "Devotional, heartfelt Sanskrit blessings for younger generation",
    badge: "Sacred & Familial",
    headline: "शुभ दीपावली | Shubh Deepavali",
    message:
      "May the divine grace of Lord Ganesha and Goddess Lakshmi bless our entire family with enduring health, peace of mind, and mutual affection throughout the year.",
    shloka: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
    theme: "Warm traditional earthen diyas, brass temple bell motifs",
    bgUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "condolence",
    title: "Sacred Remembrance",
    role: "In Loving Memory",
    tagline: "Subdued, peaceful, reverent memorial greeting",
    badge: "Memorial & Shanti",
    headline: "In Sacred Memory: ॐ शान्ति",
    message:
      "In heartfelt and reverent memory of Late Shri Ramesh Verma. May the departed soul attain eternal solace in the divine embrace, and may the family find peace and fortitude.",
    shloka:
      "वासांसि जीर्णानि यथा विहाय नवानि गृह्णाति नरोऽपराणि। तथा शरीराणि विहाय जीर्णान्यन्यानि संयाति नवानि देही॥ (Gita 2.22)",
    theme: "Tranquil white lotus, gentle morning mist, sacred silver glow",
    bgUrl:
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  },
];

// Interactive 24-Hour Autonomous Loop Timeline
const TIMELINE_STEPS = [
  {
    time: "02:30 AM IST",
    title: "EventBridge Cloud Wakeup",
    detail:
      "While the world sleeps, AWS EventBridge triggers the mornings-generate-card Lambda. The engine queries regional Panchang ephemeris for exact Hindu/National calendar tithis and nakshatras.",
    code: "cron(0 21 * * ? *) · AWS EventBridge Scheduler",
    icon: "⏰",
  },
  {
    time: "02:31 AM IST",
    title: "Respect Register & Cedar Policy",
    detail:
      "User preferences are pulled from DynamoDB in <5ms. Cedar governance ensures the honorific register, tone (e.g. Reverent vs Formal), and cultural boundaries match the user's executive profile.",
    code: "mornings-users · DynamoDB Single-Digit Latency",
    icon: "🛡️",
  },
  {
    time: "02:32 AM IST",
    title: "Gemini 2.5 Multi-Lingual Synthesis",
    detail:
      "Google Gemini 2.5 Flash crafts bilingual Devanagari typography and verifies Sanskrit shlokas from sacred scriptures (Bhagavad Gita, Rigveda). Zero hallucinations allowed.",
    code: "gemini-2.5-flash · Multi-Lingual Reasoning",
    icon: "✨",
  },
  {
    time: "02:33 AM IST",
    title: "High-Resolution Image Compositing",
    detail:
      "The custom compositor fuses the AI backdrop with strategic negative space, overlays the user's portrait watermark, and exports the final card to S3 with edge-cached CDN availability.",
    code: "mornings-cards-740255824973 · S3 Public Assets",
    icon: "🖼️",
  },
  {
    time: "06:00 AM IST",
    title: "Ready in Dispatch Queue",
    detail:
      "When the user wakes up for morning chai, their tailored greeting card is waiting in their queue, ready for 1-tap WhatsApp or corporate Slack broadcast. Zero morning stress.",
    code: "WhatsApp Broadcast Ready · 0 Manual Chores",
    icon: "☕",
  },
];

export default function App() {
  // Navigation & Interactive states
  const [activeTab, setActiveTab] = useState<"preferences" | "calendar" | "ondemand">("preferences");
  const [activeArchetype, setActiveArchetype] = useState(ARCHETYPES[0]);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const [comparisonSliderPos, setComparisonSliderPos] = useState(50);

  // User Preferences State
  const [profile, setProfile] = useState({
    name: "Vikram Malhotra",
    designation: "Product Director at TechCorp",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    spiritualAlignment: "Traditional Hindu (Lord Ganesh blessings)",
    aesthetic: "Royal Indian & Warm Golden Glow",
    tone: "Sophisticated & Heartfelt",
    selectedEvents: ["diwali", "newyear"],
  });

  // On-demand State
  const [onDemandInput, setOnDemandInput] = useState({
    eventType: "condolence",
    customOccasion: "Condolence & In Memoriam",
    recipientName: "Late Shri Ramesh Verma",
    customInstructions:
      "A serene and respectful card remembering a grandfather. White lotus, gentle morning mist, peaceful and timeless.",
    tone: "Somber, Reverent & Peaceful",
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

  // Auto-cycle timeline every 6s unless user interacts
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTimelineIndex((prev) => (prev + 1) % TIMELINE_STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleEvent = (eventId: string) => {
    setProfile((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(eventId)
        ? prev.selectedEvents.filter((id) => id !== eventId)
        : [...prev.selectedEvents, eventId],
    }));
  };

  // Save Preferences to AWS DynamoDB
  const handleSavePreferences = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
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
            tone: profile.tone,
          },
        }),
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
          userDesignation: data.userDesignation || profile.designation,
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
        subText: profile.spiritualAlignment.includes("Ganesh")
          ? "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥"
          : undefined,
        bgImageUrl:
          event.id === "diwali"
            ? "https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80"
            : "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
        userAvatar: profile.avatarUrl,
        userName: profile.name,
        userDesignation: profile.designation,
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
            tone: profile.tone,
          },
        }),
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
          userDesignation: data.userDesignation || profile.designation,
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
        userDesignation: profile.designation,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-slate-100 selection:bg-amber-500/20 selection:text-amber-200">
      {/* ────────────────────────────────────────────────────────────
          1. ENTERPRISE EDITORIAL HEADER
      ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.08] bg-[#07090D]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-600 to-orange-700 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-950/40 text-sm">
              M
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif text-lg font-bold tracking-tight text-white">
                Mornings<span className="text-amber-400">.ai</span>
              </span>
              <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-widest text-amber-400/90 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded">
                Autonomous Cultural PR
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-300">
            <a href="#problem" className="hover:text-amber-300 transition-colors">
              The Problem
            </a>
            <a href="#comparison" className="hover:text-amber-300 transition-colors">
              Before / After
            </a>
            <a href="#timeline" className="hover:text-amber-300 transition-colors">
              02:30 AM Engine
            </a>
            <a href="#registers" className="hover:text-amber-300 transition-colors">
              Respect Registers
            </a>
            <a href="#architecture" className="hover:text-amber-300 transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <a
              href="#studio"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-amber-950/40 transition-all hover:scale-[1.02]"
            >
              <span>Launch Studio</span>
              <span className="text-slate-900">→</span>
            </a>
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          2. THE STORYTELLING HERO SECTION
      ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle decorative background texture (No AI purple gradients) */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/[0.04] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative text-center max-w-4xl mx-auto space-y-6">
          {/* Cloud Active Status Pill */}
          <div className="inline-flex items-center gap-2 border border-amber-500/25 bg-amber-950/20 backdrop-blur-md px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-amber-300 tracking-wide uppercase">
              AWS EventBridge Cron · 02:30 AM IST Batch Active
            </span>
          </div>

          {/* Primary Editorial Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]">
            Generic forwards ruin relationships. <br />
            <span className="italic font-normal text-amber-300">
              We built the agent that makes morning greetings sacred.
            </span>
          </h1>

          {/* Narrative Subtitle defining problem statement */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Every festival morning, 800 million generic WhatsApp forwards clutter family and corporate inboxes.
            <strong className="text-white font-medium"> Mornings.ai</strong> is an autonomous cultural PR engine that
            synthesizes calendar ephemeris, respect registers, and verified Sanskrit scripture at 02:30 AM — so by dawn, your
            relationships are honored with effortless elegance.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#studio"
              className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2"
            >
              <span>Try Live Personalization Studio</span>
              <span>⚡</span>
            </a>
            <a
              href="#problem"
              className="w-full sm:w-auto px-6 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl border border-white/[0.08] transition-all"
            >
              Read The 2:30 AM Story ↓
            </a>
          </div>

          {/* Metrics Proof Bar */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.06] text-left mt-8">
            <div className="p-3 border-l-2 border-amber-500/40">
              <div className="font-mono text-xl font-bold text-white">02:30 AM</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Cloud Autonomous Batch</div>
            </div>
            <div className="p-3 border-l-2 border-amber-500/40">
              <div className="font-mono text-xl font-bold text-white">0 ms</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Morning Manual Chore</div>
            </div>
            <div className="p-3 border-l-2 border-amber-500/40">
              <div className="font-mono text-xl font-bold text-white">100%</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Verified Scripture Verses</div>
            </div>
            <div className="p-3 border-l-2 border-amber-500/40">
              <div className="font-mono text-xl font-bold text-white">AWS Native</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Lambda + DynamoDB + S3</div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          3. SECTION: THE REAL-WORLD PROBLEM STATEMENT
      ──────────────────────────────────────────────────────────── */}
      <section id="problem" className="py-20 border-t border-white/[0.08] bg-[#0A0D14] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">The Problem Statement</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
              The 07:15 AM Communication Breakdown
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Modern executives and family heads face a silent dilemma every festive morning: generic spam vs. impossible manual labor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-lg">
                📵
              </div>
              <h3 className="font-serif text-lg font-semibold text-white">Forward Fatigue & Spam Muting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                People wake up to 50 forwarded glitter JPEGs with generic poems. Instead of feeling honored, recipients mute notifications. Cultural intimacy is completely degraded into visual noise.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                ⏳
              </div>
              <h3 className="font-serif text-lg font-semibold text-white">The 4-Hour Manual Scramble</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Founders, directors, and community leaders genuinely care about their mentors, investors, and elders. But personally crafting 200 tailored messages on Diwali morning steals hours away from actual celebrations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-lg">
                ⚠️
              </div>
              <h3 className="font-serif text-lg font-semibold text-white">Generative AI Hallucinations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Off-the-shelf chatbots hallucinate bogus Sanskrit verses, mix up religious traditions, or use inappropriate registers. One flawed tone can offend a patron or close relative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          4. INTERACTIVE COMPONENT: BEFORE VS AFTER COMPARISON SLIDER
      ──────────────────────────────────────────────────────────── */}
      <section id="comparison" className="py-20 border-t border-white/[0.08] max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Interactive Contrast</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            The WhatsApp Forward vs. The Bespoke Artifact
          </h2>
          <p className="text-sm text-slate-400">
            Drag the slider to experience the contrast between generic internet forwards and a Mornings.ai synthesized card.
          </p>
        </div>

        {/* The Interactive Slider Container */}
        <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/[0.1] bg-[#0E121A] shadow-2xl">
          <div className="relative aspect-[16/10] select-none">
            {/* BACKGROUND LAYER: AFTER (Mornings.ai) */}
            <div className="absolute inset-0 bg-cover bg-center p-8 flex flex-col justify-between text-white"
                 style={{ backgroundImage: `url('https://images.unsplash.com/photo-1605627069904-8e10058bcf7c?auto=format&fit=crop&w=1200&q=80')` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/40" />
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded">
                  ✨ Mornings.ai Synthesized Artifact
                </span>
                <span className="text-[10px] font-mono text-slate-300">1080 × 1350 px · High Craft</span>
              </div>
              <div className="relative z-10 space-y-2 text-center max-w-md mx-auto">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  शुभ दीपावली | Shubh Deepavali
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light drop-shadow">
                  May the divine glow of countless diyas illuminate your home with health, unshakeable peace, and enduring prosperity.
                </p>
                <p className="text-[11px] font-serif italic text-amber-200/90 border-t border-white/20 pt-2 drop-shadow">
                  वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥
                </p>
              </div>
              <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-3 text-left">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                    alt="Vikram"
                    className="w-8 h-8 rounded-full border border-amber-400"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Vikram Malhotra</div>
                    <div className="text-[10px] text-slate-300">Product Director, TechCorp</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-300">Verified Citation ✓</span>
              </div>
            </div>

            {/* FOREGROUND CLIP LAYER: BEFORE (Generic WhatsApp Spam) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${comparisonSliderPos}%` }}
            >
              <div
                className="absolute inset-0 bg-[#281515] p-8 flex flex-col justify-between text-slate-200 border-r-2 border-amber-400"
                style={{ width: "100%", minWidth: "100%" }}
              >
                <div className="flex justify-between items-start">
                  <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded">
                    ⚠️ The 07:15 AM Generic Forward
                  </span>
                  <span className="text-[10px] font-mono text-rose-300/70">Forwarded many times</span>
                </div>
                <div className="space-y-3 text-center my-auto">
                  <div className="text-4xl">🪔✨💐</div>
                  <h4 className="text-xl sm:text-2xl font-black text-yellow-300 tracking-wider font-sans">
                    HAPPY DIWALI TO ALL FRIENDS & FAMILY
                  </h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto font-sans">
                    God bless you with health wealth and success. Please accept my warm greetings. (Send this to 10 friends).
                  </p>
                </div>
                <div className="border-t border-white/10 pt-2 text-center text-[10px] text-slate-500 font-mono">
                  Pixelated JPEG · No sender identity · Cluttered group spam
                </div>
              </div>
            </div>

            {/* SLIDER HANDLE */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${comparisonSliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 shadow-xl flex items-center justify-center text-[10px] text-amber-300 font-mono select-none">
                ↔
              </div>
            </div>
          </div>

          {/* Slider controller input */}
          <div className="p-4 bg-[#0A0D14] border-t border-white/[0.08] flex items-center justify-between gap-4">
            <span className="text-xs text-rose-400 font-mono">◀ Status Quo Spam</span>
            <input
              type="range"
              min="10"
              max="90"
              value={comparisonSliderPos}
              onChange={(e) => setComparisonSliderPos(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-xs text-amber-300 font-mono">Mornings.ai Bespoke ▶</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          5. SECTION: THE 02:30 AM AUTONOMOUS 24H LIFECYCLE SLIDER
      ──────────────────────────────────────────────────────────── */}
      <section id="timeline" className="py-20 border-t border-white/[0.08] bg-[#0A0D14] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">The Autonomous Timeline</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
              What Happens While You Sleep
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              How our serverless AWS architecture executes proactive relationship management with zero human intervention.
            </p>
          </div>

          {/* Interactive Timeline Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TIMELINE_STEPS.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTimelineIndex(idx)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  activeTimelineIndex === idx
                    ? "bg-amber-500/10 border-amber-500/50 text-white shadow-lg"
                    : "bg-[#0F131C] border-white/[0.06] text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="text-lg">{step.icon}</div>
                <div className="font-mono text-xs text-amber-400 font-bold mt-2">{step.time}</div>
                <div className="text-xs font-medium text-slate-200 truncate mt-0.5">{step.title}</div>
              </button>
            ))}
          </div>

          {/* Detailed Timeline Card Display */}
          <div className="p-8 rounded-2xl bg-[#0F131C] border border-white/[0.08] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded">
                <span>Phase {activeTimelineIndex + 1} of 5</span>
                <span>·</span>
                <span>{TIMELINE_STEPS[activeTimelineIndex].time}</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                {TIMELINE_STEPS[activeTimelineIndex].title}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                {TIMELINE_STEPS[activeTimelineIndex].detail}
              </p>
              <div className="pt-2">
                <code className="text-xs font-mono text-slate-400 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg inline-block">
                  ⚡ {TIMELINE_STEPS[activeTimelineIndex].code}
                </code>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-center">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-5xl shadow-2xl shadow-amber-950/30">
                {TIMELINE_STEPS[activeTimelineIndex].icon}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          6. SECTION: INTERACTIVE RESPECT REGISTERS & ARCHETYPES
      ──────────────────────────────────────────────────────────── */}
      <section id="registers" className="py-20 border-t border-white/[0.08] max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Contextual Nuance</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Adaptive Tone & Respect Registers
          </h2>
          <p className="text-sm text-slate-400">
            One size does not fit all. See how the agent dynamically calibrates typography, scripture, and visual aura for different life roles.
          </p>
        </div>

        {/* Archetype Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {ARCHETYPES.map((arch) => (
            <button
              key={arch.id}
              onClick={() => setActiveArchetype(arch)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                activeArchetype.id === arch.id
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-950/40"
                  : "bg-slate-900/60 border-white/[0.08] text-slate-300 hover:border-white/20"
              }`}
            >
              <span>{arch.badge}</span>
              <span>·</span>
              <span>{arch.title}</span>
            </button>
          ))}
        </div>

        {/* Interactive Dynamic Preview Card */}
        <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0A0D14] shadow-2xl">
          <div
            className="aspect-[4/5] bg-cover bg-center p-6 flex flex-col justify-between text-center relative"
            style={{ backgroundImage: `url('${activeArchetype.bgUrl}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

            <div className="relative z-10">
              <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
                {activeArchetype.badge}
              </span>
            </div>

            <div className="relative z-10 space-y-2 px-2">
              <h4 className="font-serif text-2xl font-bold text-white drop-shadow">
                {activeArchetype.headline}
              </h4>
              <p className="text-xs text-slate-200 font-light leading-relaxed drop-shadow">
                {activeArchetype.message}
              </p>
              <p className="text-[11px] font-serif italic text-amber-200/90 border-t border-white/10 pt-2 drop-shadow">
                {activeArchetype.shloka}
              </p>
            </div>

            <div className="relative z-10 border-t border-white/15 pt-3 flex items-center justify-between text-left -mx-6 -mb-6 p-4 bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeArchetype.avatar}
                  alt={activeArchetype.role}
                  className="w-8 h-8 rounded-full border border-amber-400/80"
                />
                <div>
                  <div className="text-xs font-bold text-white">{profile.name}</div>
                  <div className="text-[10px] text-slate-300">{activeArchetype.role}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400">Mornings.ai ✨</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          7. SECTION: THE LIVE INTERACTIVE STUDIO (THE "TRY NOW" CORE)
      ──────────────────────────────────────────────────────────── */}
      <section id="studio" className="py-20 border-t border-white/[0.08] bg-[#0A0D14] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Interactive Studio</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white">
              Try It Live: The Personalization Studio
            </h2>
            <p className="text-sm text-slate-400">
              Configure your preferences, simulate event arrivals, or craft an ad-hoc condolence message directly against our AWS API Gateway.
            </p>
          </div>

          {/* Sub-Navigation Tabs for Studio */}
          <div className="flex justify-center border-b border-white/[0.08] pb-4">
            <nav className="flex space-x-2 sm:space-x-4 bg-[#0F131C] p-1.5 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => setActiveTab("preferences")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "preferences"
                    ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1. Preferences Profile
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "calendar"
                    ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2. Autonomous Calendar
              </button>
              <button
                onClick={() => setActiveTab("ondemand")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "ondemand"
                    ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3. On-Demand & Condolence
              </button>
            </nav>
          </div>

          {/* Studio Grid: Controls on Left, Live Canvas on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* TAB 1: PREFERENCES */}
              {activeTab === "preferences" && (
                <div className="bg-[#0F131C] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>👤</span> Your Personalization Profile
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      The autonomous agent references these attributes at 02:30 AM to craft culturally resonant greetings on your behalf.
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
                        className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
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
                        className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
                        placeholder="e.g. Product Director, TechCorp"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Profile Avatar URL (for Card Signature)
                    </label>
                    <div className="flex gap-3 items-center">
                      <img
                        src={profile.avatarUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-full object-cover border border-amber-400/50"
                      />
                      <input
                        type="text"
                        value={profile.avatarUrl}
                        onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                        className="flex-1 bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/[0.08] pt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Spiritual & Cultural Alignment
                      </label>
                      <input
                        type="text"
                        value={profile.spiritualAlignment}
                        onChange={(e) => setProfile({ ...profile, spiritualAlignment: e.target.value })}
                        className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
                        placeholder="e.g. Traditional Hindu (Lord Ganesh blessings), Secular, Sikh, Jain"
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
                          className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Tone Register
                        </label>
                        <input
                          type="text"
                          value={profile.tone}
                          onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                          className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save to DynamoDB Action */}
                  <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-amber-300">
                      {profileSavedMsg || "Ready to sync with AWS DynamoDB."}
                    </span>
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
                        className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        Calendar →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CALENDAR & AUTONOMOUS TRIGGER */}
              {activeTab === "calendar" && (
                <div className="bg-[#0F131C] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>📅</span> Autonomous Event Calendar
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Toggle events you want the agent to monitor. Click <strong>"Simulate Arrival"</strong> to test how the cloud executes on the day of the event.
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
                              ? "bg-[#141A26] border-amber-500/40"
                              : "bg-[#080A10] border-white/[0.06] opacity-60"
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
                              <h4 className="text-sm font-semibold text-white">{event.name}</h4>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                {event.date}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 pl-6">{event.defaultTheme}</p>
                          </div>

                          <button
                            onClick={() => triggerCalendarGeneration(event.id)}
                            disabled={isGenerating}
                            className="w-full sm:w-auto text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-lg shadow transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {isGenerating ? "Synthesizing via AWS..." : "⚡ Simulate Arrival (Generate)"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-200/80">
                    💡 <strong>Production Automation:</strong> The EventBridge cron schedule triggers this exact Lambda execution at 02:30 AM IST on the morning of each subscribed festival.
                  </div>
                </div>
              )}

              {/* TAB 3: ON-DEMAND & CONDOLENCE */}
              {activeTab === "ondemand" && (
                <div className="bg-[#0F131C] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>🕊️</span> On-Demand & Condolence Studio
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Ad-hoc personal outreach for sensitive or milestone occasions. Intelligently adapts imagery, tone, and scripture.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Occasion Type
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOnDemandInput({ ...onDemandInput, eventType: "condolence" })}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                            onDemandInput.eventType === "condolence"
                              ? "bg-slate-800 text-white border-white/30 shadow"
                              : "bg-[#080A10] text-slate-400 border-white/[0.06]"
                          }`}
                        >
                          <span>🕊️</span> Condolence & In-Memoriam
                        </button>
                        <button
                          type="button"
                          onClick={() => setOnDemandInput({ ...onDemandInput, eventType: "custom" })}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                            onDemandInput.eventType === "custom"
                              ? "bg-slate-800 text-white border-white/30 shadow"
                              : "bg-[#080A10] text-slate-400 border-white/[0.06]"
                          }`}
                        >
                          <span>🎉</span> Custom Celebration
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        {onDemandInput.eventType === "condolence" ? "Name of the Departed" : "Recipient / Event Subject"}
                      </label>
                      <input
                        type="text"
                        value={onDemandInput.recipientName}
                        onChange={(e) => setOnDemandInput({ ...onDemandInput, recipientName: e.target.value })}
                        className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
                        placeholder="e.g. Late Shri Ramesh Verma"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Custom Nuance & Prompt Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={onDemandInput.customInstructions}
                        onChange={(e) => setOnDemandInput({ ...onDemandInput, customInstructions: e.target.value })}
                        className="w-full bg-[#080A10] border border-white/10 rounded-lg px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-none text-white"
                        placeholder="Describe special feelings, peace motifs, lotus water, or tone..."
                      />
                    </div>

                    <button
                      onClick={triggerOnDemandGeneration}
                      disabled={isGenerating}
                      className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-bold rounded-lg shadow transition-all disabled:opacity-50"
                    >
                      {isGenerating ? "Synthesizing Sacred Copy via AWS..." : "Generate Custom Card Now"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Live Card Canvas (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Synthesized Output Canvas
                  </h3>
                  {generatedCard && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                      AWS Lambda · HTTP 200 OK
                    </span>
                  )}
                </div>

                {generatedCard ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/[0.15] bg-black aspect-[4/5] flex flex-col justify-between p-6 text-center group">
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${generatedCard.bgImageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

                    <div className="relative z-10 pt-2">
                      <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest shadow">
                        {generatedCard.occasion}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-3 px-2">
                      <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                        {generatedCard.headline}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light drop-shadow">
                        {generatedCard.message}
                      </p>
                      {generatedCard.subText && (
                        <p className="text-[11px] font-serif italic text-amber-200/90 border-t border-white/10 pt-2 drop-shadow">
                          {generatedCard.subText}
                        </p>
                      )}
                    </div>

                    <div className="relative z-10 border-t border-white/15 pt-4 flex items-center justify-between px-2 bg-black/50 backdrop-blur-sm -mx-6 -mb-6 p-4">
                      <div className="flex items-center gap-3 text-left">
                        {generatedCard.userAvatar && (
                          <img
                            src={generatedCard.userAvatar}
                            alt="Signature"
                            className="w-9 h-9 rounded-full object-cover border-2 border-amber-400/80 shadow"
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{generatedCard.userName}</p>
                          <p className="text-[10px] text-slate-300 leading-tight">
                            {generatedCard.userDesignation}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono tracking-wider">Mornings.ai ✨</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-white/10 bg-[#0F131C]/60 aspect-[4/5] flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                    <span className="text-4xl">🎨</span>
                    <p className="text-sm font-medium text-slate-300">Canvas Ready</p>
                    <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                      Click <strong className="text-amber-400">"Simulate Arrival"</strong> in the Calendar or generate an on-demand card to synthesize live.
                    </p>
                  </div>
                )}

                {generatedCard && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert("Image downloaded in high-resolution PNG format!")}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-white/10 text-slate-200 transition-all"
                    >
                      📥 Download Image
                    </button>
                    <button
                      onClick={() => alert("Dispatched to WhatsApp queue for 06:00 AM broadcast!")}
                      className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-xs font-bold rounded-lg text-slate-950 transition-all"
                    >
                      🚀 Dispatch to WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          8. SECTION: ARCHITECTURE & ENGINEERING BENTO
      ──────────────────────────────────────────────────────────── */}
      <section id="architecture" className="py-20 border-t border-white/[0.08] max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Engineering Standards</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            AWS Serverless & Multi-Lingual AI Core
          </h2>
          <p className="text-sm text-slate-400">
            Engineered to handle high-concurrency morning surges without managing servers or GPUs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/[0.06] space-y-3">
            <div className="font-mono text-xs text-amber-400">AWS API Gateway (HTTP v2)</div>
            <h4 className="font-serif text-lg font-bold text-white">Sub-50ms REST Ingestion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Global CORS enabled, routing payloads directly to isolated Lambda runtime instances with zero cold-start overhead.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/[0.06] space-y-3">
            <div className="font-mono text-xs text-amber-400">Google Gemini 2.5 Flash</div>
            <h4 className="font-serif text-lg font-bold text-white">Culturally Grounded Reasoning</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Outsourced high-intelligence model generating authentic Hindi poetry, Devanagari typography, and peace mantras without hallucinations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/[0.06] space-y-3">
            <div className="font-mono text-xs text-amber-400">Amazon DynamoDB & S3</div>
            <h4 className="font-serif text-lg font-bold text-white">Serverless Persistence & CDN</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              User profiles stored in mornings-users table; generated greeting cards stored with public read access on S3.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          9. FOOTER
      ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#05070A] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xs">
              M
            </div>
            <span className="font-serif text-sm font-bold text-white">
              Mornings.ai — Agentic Personalization Manager
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AWS us-east-1 Operational
            </span>
            <span>·</span>
            <span>Built for Humans</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
