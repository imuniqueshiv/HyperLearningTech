import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  BrainCircuit,
  Sparkles,
  Star,
  Library,
  FileText,
  Target,
  TrendingUp,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 w-full bg-background dark:bg-black">
      {/* Main Split Content */}
      <div className="flex flex-1 w-full min-h-[600px]">
        {/* Left Side - Brand & Features (Hidden on Mobile) */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-slate-950 dark:bg-black lg:flex border-r border-border/50">
          {/* Background Gradients & Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
            <div className="absolute -right-[10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
          </div>

          {/* Top Logo - Large like Instagram */}
          <div className="absolute top-12 left-12 z-10">
            <div className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 p-[2px] shadow-2xl">
              <div className="flex h-full w-full items-center justify-center rounded-[1.1rem] bg-black">
                <Image
                  src="/hl-logo.png"
                  alt="Hyper Learning Logo"
                  width={44}
                  height={44}
                  className="object-contain invert brightness-0"
                />
              </div>
            </div>
          </div>

          {/* Center Premium Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-8 py-4 max-w-[540px] mt-8">
            <h1 className="text-[36px] font-semibold tracking-tight text-slate-100 xl:text-[42px] leading-[1.2]">
              Elevate your engineering journey with a{" "}
              <span className="bg-gradient-to-br from-blue-400 to-indigo-400 bg-clip-text text-transparent font-bold">
                personalized AI tutor
              </span>
              .
            </h1>

            {/* Fanned-out Premium Feature Mockups */}
            <div
              className="mt-10 relative w-full h-[340px] flex items-center justify-center"
              style={{ perspective: "1000px" }}
            >
              {/* Card 1: Back Left (University Support) */}
              <div className="absolute top-12 left-0 sm:left-[5%] z-0 w-[200px] h-[300px] sm:w-[220px] sm:h-[320px] -rotate-12 scale-[0.85] transition-transform duration-500 hover:rotate-0 hover:z-40 hover:scale-105 group flex flex-col p-5 rounded-[24px] border border-white/10 border-t-white/20 bg-[#151a23] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Library className="h-5 w-5" />
                  </div>
                  <h3 className="text-white/95 font-semibold text-sm leading-tight">
                    University
                    <br />
                    Support
                  </h3>
                </div>
                {/* Real Content: University Features */}
                <div className="flex flex-col gap-2.5 mt-auto w-full">
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 border border-white/5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-white/90 leading-tight">
                        Solved PYQs
                      </span>
                      <span className="text-[8px] text-white/50 mt-0.5">
                        RGPV & AKTU aligned
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 border border-white/5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                      <Target className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-white/90 leading-tight">
                        Smart Syllabus
                      </span>
                      <span className="text-[8px] text-white/50 mt-0.5">
                        Topic-wise tracking
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Back Right (Personal Dashboard) */}
              <div className="absolute top-12 right-0 sm:right-[5%] z-0 w-[200px] h-[300px] sm:w-[220px] sm:h-[320px] rotate-12 scale-[0.85] transition-transform duration-500 hover:rotate-0 hover:z-40 hover:scale-105 group flex flex-col p-5 rounded-[24px] border border-white/10 border-t-white/20 bg-[#151a23] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <h3 className="text-white/95 font-semibold text-sm leading-tight">
                    Personal
                    <br />
                    Dashboard
                  </h3>
                </div>
                {/* Real Content: Dashboard Stats */}
                <div className="flex flex-col gap-3 mt-auto w-full">
                  <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/50 uppercase tracking-wider">
                        Current SGPA
                      </span>
                      <span className="text-sm font-bold text-white mt-0.5">
                        8.75
                      </span>
                    </div>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-xl bg-white/5 p-3 border border-white/5">
                    <div className="flex justify-between items-center text-[9px] font-medium text-white/70">
                      <span>Course Progress</span>
                      <span className="text-purple-300">68%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[68%] bg-purple-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Center Front (AI Tutor) */}
              <div className="absolute top-0 z-20 w-[220px] h-[320px] sm:w-[240px] sm:h-[340px] transition-transform duration-500 hover:scale-105 group flex flex-col p-5 rounded-[28px] border border-white/10 border-t-white/20 bg-[#1e293b] shadow-2xl overflow-hidden">
                <div className="flex flex-col items-center mb-4 mt-2">
                  <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-[16px] bg-blue-600 text-white">
                    <BrainCircuit className="h-7 w-7" />
                    <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-[#1e293b]" />
                  </div>
                  <h3 className="text-white font-bold text-lg text-center leading-tight">
                    24/7 AI Tutor
                  </h3>
                  <p className="text-blue-200/60 text-xs mt-0.5 text-center font-medium">
                    Always ready to help
                  </p>
                </div>
                {/* Real Content: Chat Interface */}
                <div className="flex flex-col gap-3 w-full bg-black/30 rounded-2xl p-3 border border-white/5 mt-auto">
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] text-white/70">
                      U
                    </div>
                    <div className="bg-white/10 rounded-xl rounded-tl-sm border border-white/5 py-1.5 px-2.5">
                      <p className="text-[10px] text-white/90 leading-tight">
                        Explain Fourier transform simply.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 flex-row-reverse">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
                      <BrainCircuit className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-blue-600/20 border border-blue-500/20 rounded-xl rounded-tr-sm py-2 px-2.5">
                      <p className="text-[9px] text-blue-100/90 leading-relaxed">
                        It breaks a complex signal into its individual sine wave
                        frequencies, like separating chords into notes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Elements */}
              <div className="absolute top-[8%] left-[12%] z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-lg -rotate-12 animate-[bounce_4s_infinite]">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-white/90 tracking-wide">
                  EXAM READY
                </span>
              </div>
              <div className="absolute bottom-[15%] right-[10%] z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-lg rotate-12 animate-[bounce_5s_infinite_1s]">
                <Library className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] font-bold text-white/90 tracking-wide">
                  ALL BRANCHES
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        {/* Slightly different background for premium contrast */}
        <div className="relative flex w-full flex-col justify-center items-center bg-zinc-50 dark:bg-[#0A0A0A] p-6 sm:py-6 sm:px-12 lg:w-1/2">
          <div className="absolute inset-0 z-0 lg:hidden">
            <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
          </div>

          {/* Mobile Logo Header */}
          <div className="absolute top-6 left-6 z-10 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-600">
                <Image
                  src="/hl-logo.png"
                  alt="Hyper Learning Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Auth Container */}
          <div className="relative z-10 w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="w-full py-4 px-6 bg-zinc-50 dark:bg-black border-t border-border/40 text-[12px]">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-4 lg:gap-y-2 lg:text-left">
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Image
                src="/hl-logo.png"
                alt="Hyper Learning"
                width={16}
                height={16}
                className="object-contain opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:opacity-70 dark:brightness-[1.2]"
              />
              <span>
                © {new Date().getFullYear()} Hyper Learning. All rights
                reserved.
              </span>
            </Link>

            <div className="flex items-center gap-6 text-[12px] font-medium text-muted-foreground">
              <Link
                href="/about"
                className="relative group py-1 transition-all duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </Link>
              <Link
                href="/contact"
                className="relative group py-1 transition-all duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </Link>
              <Link
                href="/creators"
                className="relative group py-1 transition-all duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              >
                Creators
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </Link>
              <Link
                href="/#Contact"
                className="relative group py-1 transition-all duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              >
                Feedback
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </Link>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 max-w-[400px] lg:max-w-none text-center lg:text-left">
              <span>Disclaimer:</span>
              <span>
                Some content may contain errors. Please cross-check and share
                corrections via our feedback section.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
