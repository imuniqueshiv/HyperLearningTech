import Link from "next/link";
import { GraduationCap, BookOpen, FileText, Sparkles } from "lucide-react";

import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";

export default function DashboardPage() {
  return (
    <div className="relative w-full bg-background pt-16 pb-12 animate-in fade-in duration-700">
      {/* Top Section Divider for visual separation from Universities */}
      <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          {/* 1. Premium Welcome Banner (Full Width) */}
          <div className="relative w-full overflow-hidden rounded-[24px] border border-border/80 bg-gradient-to-br from-card to-background p-8 sm:p-10 shadow-sm group">
            <div className="absolute inset-0 -z-10 opacity-30 transition-opacity duration-500 group-hover:opacity-60">
              <div className="absolute -left-[5%] -top-[10%] h-[300px] w-[300px] rounded-full bg-blue-600/20 blur-[100px]" />
              <div className="absolute right-[5%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-indigo-600/20 blur-[100px]" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 w-fit">
                  Student Dashboard
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Welcome Back 👋
                </h1>
                <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground font-medium">
                  Pick up where you left off. Access your syllabus, study your
                  AI-generated notes, and practice with past year questions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 2. Continue Learning Section (Left side) */}
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Continue Learning
                </h2>
                <Link
                  href="/rgpv"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  View all history &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5">
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
            </div>

            {/* 3. Quick Actions (Right side grid) */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Quick Actions
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <QuickActionCard
                  title="Universities"
                  description="Explore institutions."
                  href="/#Universities"
                  icon={GraduationCap}
                  colorVariant="blue"
                />
                <QuickActionCard
                  title="Syllabus"
                  description="View breakdowns."
                  href="/rgpv"
                  icon={BookOpen}
                  colorVariant="indigo"
                />
                <QuickActionCard
                  title="PYQs"
                  description="Practice questions."
                  href="/rgpv"
                  icon={FileText}
                  colorVariant="emerald"
                />
                <QuickActionCard
                  title="AI Tutor"
                  description="Get instant help."
                  href="/rgpv"
                  icon={Sparkles}
                  colorVariant="purple"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
