import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full bg-background pb-20 animate-in fade-in duration-700">
      {/* 1. Premium Welcome Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card/30 dark:bg-card/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-[10%] -top-[10%] h-[400px] w-[400px] rounded-full bg-[#1D4ED8]/10 blur-[120px] dark:bg-blue-500/20" />
          <div className="absolute -right-[10%] -bottom-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/20" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex flex-col gap-4 lg:max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-sm font-medium text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 w-fit">
              Student Dashboard
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Welcome Back 👋
            </h1>
            <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
              Continue your learning journey with Hyper Learning. Access your
              subjects, AI notes, and PYQs.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-12 space-y-16">
        {/* 2. Quick Action Cards */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Action 1 */}
            <Link
              href="/#Universities"
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1D4ED8]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:hover:border-blue-500/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] transition-colors group-hover:bg-[#1D4ED8] group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground transition-colors group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
                  Browse Universities
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  Explore available institutions and branches.
                </p>
              </div>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400" />
            </Link>

            {/* Action 2 */}
            <Link
              href="/rgpv"
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:border-indigo-500/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:group-hover:bg-indigo-500 dark:group-hover:text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  View Syllabus
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  Access detailed syllabus breakdowns.
                </p>
              </div>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </Link>

            {/* Action 3 */}
            <Link
              href="/rgpv"
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:border-emerald-500/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Explore PYQs
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  Practice with past year questions.
                </p>
              </div>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
            </Link>

            {/* Action 4 */}
            <Link
              href="/rgpv"
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:hover:border-purple-500/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-500/10 dark:text-purple-400 dark:group-hover:bg-purple-500 dark:group-hover:text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  AI Assistant
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  Get instant help from the AI tutor.
                </p>
              </div>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
            </Link>
          </div>
        </section>

        {/* 3. Continue Learning / Recent Activity */}
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Continue Learning
            </h2>
            <Link
              href="/rgpv"
              className="text-sm font-medium text-[#1D4ED8] hover:underline dark:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-md px-1"
            >
              View all history
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Placeholder Card 1 */}
            <Link
              href="/rgpv/cse/semester-4/bt-401"
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-[#1D4ED8]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:hover:border-blue-500/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-[#1D4ED8]/10 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
                      Mathematics-III (BT-401)
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      RGPV • CSE • Semester 4
                    </p>
                  </div>
                </div>
                <div className="flex w-fit items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground self-start">
                  <Clock className="h-3.5 w-3.5" />
                  <span>2 hours ago</span>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Unit 2: Laplace Transform
                </div>
                <div className="flex items-center text-sm font-medium text-[#1D4ED8] transition-colors dark:text-blue-400">
                  Resume{" "}
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Placeholder Card 2 */}
            <Link
              href="/rgpv/cse/semester-4/bt-402"
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-[#1D4ED8]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:hover:border-blue-500/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-[#1D4ED8]/10 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
                      Data Structures (BT-402)
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      RGPV • CSE • Semester 4
                    </p>
                  </div>
                </div>
                <div className="flex w-fit items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground self-start">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Yesterday</span>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Viewing June-2024 PYQ
                </div>
                <div className="flex items-center text-sm font-medium text-[#1D4ED8] transition-colors dark:text-blue-400">
                  Resume{" "}
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
