import Link from "next/link";
import { Mail, BookOpen, GraduationCap } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/5 bg-[#020617] pt-12 pb-6">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/5 p-1.5 shadow-sm ring-1 ring-white/10 transition-all group-hover:bg-blue-500/10 group-hover:ring-blue-500/30">
                <Image
                  src="/hl-logo.png"
                  alt="Hyper Learning Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-blue-400">
                  Hyper Learning
                </h2>
                <p className="text-xs font-semibold tracking-wide text-blue-500/80">
                  AI-Powered Learning
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Transforming how engineering students learn. Get ahead with
              AI-generated notes, precise syllabus mapping, and interactive exam
              preparation.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:contact@hyperlearning.tech"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-[#EA4335]/50 hover:bg-[#EA4335]/10 hover:text-[#EA4335] hover:shadow-[0_0_12px_rgba(234,67,53,0.15)]"
              >
                <Mail className="h-4 w-4 transition-transform group-hover:scale-110" />
              </a>
              <a
                href="https://github.com/imuniqueshiv"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:scale-110"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-6 text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">
              Platform
            </h3>
            <ul className="space-y-4">
              {["Subjects", "Universities", "Dashboard", "Student Login"].map(
                (item, i) => (
                  <li key={i}>
                    <Link
                      href={
                        item === "Universities"
                          ? "/#Universities"
                          : item === "Student Login"
                            ? "/sign-in"
                            : `/${item.toLowerCase()}`
                      }
                      className="group relative flex w-fit items-center text-[15px] font-medium text-slate-400 transition-all duration-300 hover:text-white"
                    >
                      <span className="relative mr-3 flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-0 transition-all duration-500 group-hover:scale-[2.5] group-hover:opacity-20" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/30 transition-colors duration-300 group-hover:bg-blue-400" />
                      </span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        {item}
                      </span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Learning */}
          <div>
            <h3 className="mb-6 text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">
              Learning
            </h3>
            <ul className="space-y-4">
              {["AI Notes", "PYQs", "AI Tutor", "Syllabus"].map((item, i) => (
                <li key={i}>
                  <Link
                    href="/rgpv"
                    className="group relative flex w-fit items-center text-[15px] font-medium text-slate-400 transition-all duration-300 hover:text-white"
                  >
                    <span className="relative mr-3 flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-0 transition-all duration-500 group-hover:scale-[2.5] group-hover:opacity-20" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/30 transition-colors duration-300 group-hover:bg-blue-400" />
                    </span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      {item}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-6 text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">
              Company
            </h3>
            <ul className="space-y-4">
              {["About", "Contact", "Creators", "Privacy"].map((item, i) => (
                <li key={i}>
                  <Link
                    href={item === "Privacy" ? "/" : `/${item.toLowerCase()}`}
                    className="group relative flex w-fit items-center text-[15px] font-medium text-slate-400 transition-all duration-300 hover:text-white"
                  >
                    <span className="relative mr-3 flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-0 transition-all duration-500 group-hover:scale-[2.5] group-hover:opacity-20" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/30 transition-colors duration-300 group-hover:bg-blue-400" />
                    </span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      {item}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider & Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-6 pb-2">
          <p className="text-center text-xs font-medium text-white/40">
            © {new Date().getFullYear()} Hyper Learning. All rights reserved.
          </p>
          <p className="max-w-xl text-center text-[11px] font-medium text-white/30">
            Disclaimer: Some content may contain errors. Please cross-check and
            share corrections via our feedback section.
          </p>
        </div>
      </div>
    </footer>
  );
}
