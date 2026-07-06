import Link from "next/link";
import { GraduationCap, BookOpen, FileText, Sparkles } from "lucide-react";

import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";

export default function DashboardPage() {
  return (
    <div className="w-full bg-background pb-12 animate-in fade-in duration-700">
      {/* 1. Premium Welcome Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card/30 dark:bg-card/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-[10%] -top-[10%] h-[400px] w-[400px] rounded-full bg-[#1D4ED8]/10 blur-[120px] dark:bg-blue-500/20" />
          <div className="absolute -right-[10%] -bottom-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/20" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-col gap-4 lg:max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-sm font-medium text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 w-fit">
              Student Dashboard
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Welcome Back 👋
            </h1>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
              Continue your learning journey with Hyper Learning. Access your
              subjects, AI notes, and PYQs.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-8 space-y-10">
        {/* 2. Quick Action Cards */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Browse Universities"
              description="Explore available institutions and branches."
              href="/#Universities"
              icon={GraduationCap}
              colorVariant="blue"
            />
            <QuickActionCard
              title="View Syllabus"
              description="Access detailed syllabus breakdowns."
              href="/rgpv"
              icon={BookOpen}
              colorVariant="indigo"
            />
            <QuickActionCard
              title="Explore PYQs"
              description="Practice with past year questions."
              href="/rgpv"
              icon={FileText}
              colorVariant="emerald"
            />
            <QuickActionCard
              title="AI Assistant"
              description="Get instant help from the AI tutor."
              href="/rgpv"
              icon={Sparkles}
              colorVariant="purple"
            />
          </div>
        </section>

        {/* 3. Continue Learning / Recent Activity */}
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
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
            <RecentActivityCard
              title="Mathematics-III (BT-401)"
              subtitle="RGPV • CSE • Semester 4"
              href="/rgpv/cse/semester-4/bt-401"
              timeAgo="2 hours ago"
              progressText="Unit 2: Laplace Transform"
              statusColor="bg-emerald-500"
              type="book"
            />
            <RecentActivityCard
              title="Data Structures (BT-402)"
              subtitle="RGPV • CSE • Semester 4"
              href="/rgpv/cse/semester-4/bt-402"
              timeAgo="Yesterday"
              progressText="Viewing June-2024 PYQ"
              statusColor="bg-orange-500"
              type="file"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
