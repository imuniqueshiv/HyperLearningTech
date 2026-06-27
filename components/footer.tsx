import Link from "next/link";
import { Mail, BookOpen, GraduationCap } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[#00008B]/20 bg-[#00008B]/95 backdrop-blur-xl supports-[backdrop-filter]:bg-[#00008B]/90">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                <Image
                  src="/hl-logo.png"
                  alt="Hyper Learning Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#F4F5F7]">
                  Hyper Learning
                </h2>

                <p className="text-sm text-[#AFC8FF]">
                  AI-Powered Learning Platform
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-[#AFC8FF]/70">
              Hyper Learning helps engineering students learn smarter through
              AI-powered notes, syllabus mapping, previous year questions,
              interactive tutoring, and exam-focused preparation resources.
            </p>

            <div className="mt-4 flex items-center gap-4">
              <a
                href="mailto:contact@hyperlearning.tech"
                className="rounded-xl border border-white/20 p-3 text-[#AFC8FF] transition-colors hover:border-white/40 hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#F4F5F7]">
              Platform
            </h3>

            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/rgpv"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Subjects
                </Link>
              </li>

              <li>
                <Link
                  href="/#Universities"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Universities
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  href="/sign-in"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#F4F5F7]">
              Learning
            </h3>

            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/rgpv"
                  className="flex items-center gap-2 text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  AI Notes
                </Link>
              </li>

              <li>
                <Link
                  href="/rgpv"
                  className="flex items-center gap-2 text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  <GraduationCap className="h-4 w-4" />
                  PYQs
                </Link>
              </li>

              <li>
                <Link
                  href="/rgpv"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  AI Tutor
                </Link>
              </li>

              <li>
                <Link
                  href="/rgpv"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Syllabus
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#F4F5F7]">
              Company
            </h3>

            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>

              <li>
                <a
                  href="https://github.com/imuniqueshiv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  GitHub
                </a>
              </li>

              <li>
                <Link
                  href="/"
                  className="text-sm text-[#AFC8FF]/70 transition-colors hover:text-white"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="text-center text-xs text-[#AFC8FF]/50 md:text-left">
              © {new Date().getFullYear()} Hyper Learning. All rights reserved.
            </p>

            <p className="text-center text-xs text-[#AFC8FF]/50 md:text-right">
              Built with Next.js, TypeScript, PostgreSQL, Redis & AI.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-center text-xs leading-5 text-[#AFC8FF]/50">
              Disclaimer: Some content may contain errors. Please cross-check
              and share corrections via our feedback section.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
