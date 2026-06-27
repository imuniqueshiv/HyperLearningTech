import Image from "next/image";
import Link from "next/link";
import { Sparkles, BookOpen, GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] w-full">
      {/* Left Side - Brand & Features (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#00008B] lg:flex">
        {/* Background Gradients & Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="absolute -right-[10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 p-10">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/10 backdrop-blur-md">
              <Image
                src="/hl-logo.png"
                alt="Hyper Learning Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Hyper Learning
            </span>
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col justify-center p-10 xl:p-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl">
            Welcome to the future of learning.
          </h1>
          <p className="mt-6 text-lg text-blue-100/80 leading-relaxed max-w-md">
            Join thousands of engineering students who are studying smarter with
            AI-powered notes, mapped syllabus, and instant tutor assistance.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200 backdrop-blur-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI-Powered Notes</h3>
                <p className="text-sm text-blue-200/70">
                  Concept explanations tailored for exams.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200 backdrop-blur-sm">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mapped PYQs</h3>
                <p className="text-sm text-blue-200/70">
                  Previous year questions mapped to topics.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200 backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Instant AI Tutor</h3>
                <p className="text-sm text-blue-200/70">
                  Clear your doubts 24/7 on any subject.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 p-10 text-sm text-blue-200/50">
          © {new Date().getFullYear()} Hyper Learning. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="relative flex w-full flex-col justify-center items-center bg-background p-6 sm:p-12 lg:w-1/2">
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
  );
}
