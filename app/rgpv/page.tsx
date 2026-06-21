import UniversityHero from "@/components/university/university-hero";
// import UniversityStats from "@/components/university/university-stats";
import BranchGrid from "@/components/university/branch-grid";
import QuickAccess from "@/components/university/quick-access";

export default function RGPVPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <UniversityHero />

      {/* Branch Selection */}
      <BranchGrid />

      {/* Academic Navigation */}
      <QuickAccess />

    </main>
  );
}
