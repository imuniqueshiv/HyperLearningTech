import Link from "next/link";
import {
  BrainCircuit,
  Mail,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Hyper Learning
                </h2>

                <p className="text-sm text-slate-500">
                  AI-Powered Learning Platform
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              Hyper Learning helps engineering students learn smarter through
              AI-powered notes, syllabus mapping, previous year questions,
              interactive tutoring, and exam-focused preparation resources.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <a
                href="mailto:contact@hyperlearning.tech"
                className="rounded-xl border border-slate-800 p-3 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Platform
            </h3>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/subjects"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Subjects
                </Link>
              </li>

              <li>
                <Link
                  href="/universities"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Universities
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  href="/sign-in"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning */}
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Learning
            </h3>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/subjects"
                  className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  AI Notes
                </Link>
              </li>

              <li>
                <Link
                  href="/subjects"
                  className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
                >
                  <GraduationCap className="h-4 w-4" />
                  PYQs
                </Link>
              </li>

              <li>
                <Link
                  href="/subjects"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  AI Tutor
                </Link>
              </li>

              <li>
                <Link
                  href="/subjects"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Syllabus
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </h3>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>

              <li>
                <a
                  href="https://github.com/imuniqueshiv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  GitHub
                </a>
              </li>

              <li>
                <Link
                  href="/privacy"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-slate-500 md:text-left">
              © {new Date().getFullYear()} Hyper Learning. All rights reserved.
            </p>

            <p className="text-center text-sm text-slate-500 md:text-right">
              Built with Next.js, TypeScript, PostgreSQL, Redis & AI.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-center text-xs leading-6 text-slate-500">
              Disclaimer: AI-generated content may occasionally contain
              inaccuracies. Students should verify important academic
              information using official university resources and faculty
              guidance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}