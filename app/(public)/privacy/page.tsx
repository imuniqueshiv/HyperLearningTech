import React from "react";
import {
  Shield,
  Lock,
  Eye,
  Server,
  RefreshCw,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Metadata } from "next";
import { InteractivePath } from "./InteractivePath";
import { ScrollReveal } from "./ScrollReveal";

export const metadata: Metadata = {
  title: "Privacy Policy | Hyper Learning",
  description: "Learn how we protect your data and privacy at Hyper Learning.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#020617] selection:bg-indigo-500/30 overflow-hidden pb-32">
      {/* Massive Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32">
        {/* Hero Section (The Origin) */}
        <div className="relative text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 dark:bg-black/40 border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-[0.15em] mb-6 shadow-sm backdrop-blur-xl transition-transform hover:scale-105">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>Absolute Data Sovereignty</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] text-slate-900 dark:text-white mb-6">
            Your Privacy. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500">
              Beautifully Secured.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Your academic records are deeply personal. We don&apos;t just
            protect them—we&apos;ve engineered an impenetrable, world-class
            architecture to ensure your data remains exclusively yours.
          </p>

          {/* The Path Origin Connector */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-0 h-20 border-l-[2.5px] border-dashed border-slate-300 dark:border-cyan-500/30">
            {/* Origin Glowing Node */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#030712] border-[3px] border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </div>
        </div>

        {/* Custom Animation for the Traveling Map Path */}

        {/* Central Timeline Layout */}
        <div className="relative max-w-5xl mx-auto mt-20 z-50 pb-8">
          {/* Unified Desktop & Mobile Scroll-Linked Path with Tracker */}
          <InteractivePath />

          <div className="space-y-12 sm:space-y-32 pt-12 relative z-10">
            <TimelineNode
              index="I"
              icon={Eye}
              title="Minimal Collection"
              content="We collect only what's absolutely necessary to power your academic tools. This includes basic account info and data you explicitly provide. We never scrape or invisibly track your personal data across the web. Your learning habits remain entirely your own private business."
              side="left"
              delay={0}
            />

            <TimelineNode
              index="II"
              icon={Server}
              title="Strict Data Usage"
              content="Your data strictly powers your experience on Hyper Learning. We use it exclusively to calculate standing, generate targets, and tune the AI Tutor to your specific syllabus. We do not sell your data to advertisers, aggregators, or third-party brokers."
              side="right"
              delay={0.1}
            />

            <TimelineNode
              index="III"
              icon={Lock}
              title="Enterprise Security"
              content="We implement bank-grade security measures. Your sensitive academic data is protected by industry-standard encryption during transfer and rests securely within our isolated cloud infrastructure. We continually audit our systems to ensure your absolute peace of mind."
              side="left"
              delay={0.1}
            />

            <TimelineNode
              index="IV"
              icon={RefreshCw}
              title="Absolute Control"
              content="You own your academic records. At any exact moment, you can export, modify, or permanently wipe your account and all associated data from our servers directly from your dashboard settings. If you decide to leave, your data leaves with you instantly."
              side="right"
              delay={0.1}
            />
          </div>
        </div>

        {/* Floating Premium CTA */}
        <div className="relative mt-36 mb-16 max-w-4xl mx-auto">
          {/* Connector linking timeline path to CTA */}
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-0 h-36 border-l-[2.5px] border-dashed border-slate-300 dark:border-cyan-500/30">
            {/* End Node */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-[#030712] border-4 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]" />
          </div>

          {/* Premium CTA Box */}
          <div className="relative p-[1px] rounded-3xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-cyan-500/30 dark:via-purple-500/10 dark:to-cyan-500/30 shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_0_40px_rgba(34,211,238,0.1)] overflow-hidden group transition-all duration-700 hover:shadow-[0_12px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_60px_rgba(34,211,238,0.2)]">
            {/* Inner background to create the 1px border effect */}
            <div className="relative h-full w-full bg-white/90 dark:bg-[#030712]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-[23px] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-transparent to-indigo-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 dark:bg-cyan-500/10 border border-slate-100 dark:border-cyan-500/20 shrink-0 shadow-sm text-slate-700 dark:text-cyan-400 transition-all duration-500 group-hover:scale-110 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/20 group-hover:text-cyan-600">
                  <Mail className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    Still have questions?
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal max-w-md mx-auto md:mx-0 leading-relaxed">
                    Our privacy protection team is available to clarify any
                    concerns regarding your academic data.
                  </p>
                </div>
              </div>

              {/* World Class Button */}
              <div className="relative group/btn z-10 shrink-0 w-full md:w-auto">
                {/* Ambient glowing aura on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full blur opacity-0 group-hover/btn:opacity-60 transition duration-500"></div>
                <a
                  id="contact-cta-button"
                  href="/contact"
                  className="relative inline-flex items-center justify-center gap-2 px-8 py-4 w-full rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-[0_4px_14px_0_rgb(255,255,255,0.2)]"
                >
                  Contact Team
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineNode({
  index,
  icon: Icon,
  title,
  content,
  side,
  delay,
}: {
  index: string;
  icon: React.ElementType;
  title: string;
  content: string;
  side: "left" | "right";
  delay: number;
}) {
  const isLeft = side === "left";

  return (
    <ScrollReveal delay={delay} direction={isLeft ? "left" : "right"}>
      <div
        className={`relative flex flex-col md:flex-row items-center justify-between md:justify-normal w-full ${isLeft ? "md:flex-row-reverse" : ""}`}
      >
        {/* Spacer for desktop to push content to one side */}
        <div className="hidden md:block w-1/2" />

        {/* Premium Treasure Waypoint Card */}
        <div
          className={`w-full sm:w-[calc(100%-2rem)] md:w-1/2 ${isLeft ? "md:pr-12" : "md:pl-12"}`}
        >
          <div className="relative overflow-hidden p-6 sm:p-10 bg-white dark:bg-[#030712]/90 backdrop-blur-2xl border border-cyan-500/10 dark:border-cyan-500/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_0_40px_rgba(34,211,238,0.05)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_0_50px_rgba(34,211,238,0.15)] transition-all duration-500 group">
            {/* Subtle Ambient Radial Glowing Map Core */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.05),transparent_40%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-[#030712]/50 dark:to-[#030712] pointer-events-none" />

            <div className="relative z-10">
              {/* Treasure Waypoint Header */}
              <div
                className={`flex flex-col md:flex-row items-center gap-4 sm:gap-5 mb-4 sm:mb-6 ${isLeft ? "md:flex-row-reverse" : ""}`}
              >
                {/* Glowing Diamond Node */}
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:bg-cyan-400 dark:group-hover:text-[#030712] transition-all duration-500 rotate-45 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.15)] z-20">
                  <Icon
                    className="w-5 h-5 sm:w-6 sm:h-6 -rotate-45 transition-transform duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <div
                  className={`flex flex-col items-center ${isLeft ? "md:items-end" : "md:items-start"} text-center ${isLeft ? "md:text-right" : "md:text-left"} mt-3 md:mt-0`}
                >
                  <span className="text-[10px] sm:text-xs font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-[0.3em] mb-1">
                    WAYPOINT {index}
                  </span>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h2>
                </div>
              </div>

              <p
                className={`text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium text-center ${isLeft ? "md:text-right" : "md:text-left"}`}
              >
                {content}
              </p>
            </div>

            {/* Adventurer's Glowing Accent Edge */}
            <div
              className={`absolute bottom-0 h-[2.5px] bg-gradient-to-r from-cyan-400 to-indigo-500 w-12 transition-all duration-700 left-1/2 -translate-x-1/2 md:translate-x-0 group-hover:w-full md:group-hover:w-full ${isLeft ? "md:left-auto md:right-0" : "md:left-0 md:right-auto"}`}
            />
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
