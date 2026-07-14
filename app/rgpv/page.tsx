import UniversityHero from "@/components/university/university-hero";
import BranchGrid from "@/components/university/branch-grid";
import DashboardPage from "@/app/dashboard/page";

export default function RGPVPage() {
  return (
    <main className="relative min-h-screen dark:bg-background overflow-x-hidden">
      {/* Ultra-Premium Ambient Global Background (Light Mode) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden bg-[#FCFCFD]">
        {/* Intricate 3-Color Mesh Gradient (Hardware Accelerated) */}
        <div className="absolute -left-[15%] -top-[10%] h-[1000px] w-[1000px] rounded-full bg-sky-200/40 blur-[130px] transform-gpu"></div>
        <div className="absolute -right-[15%] top-[5%] h-[900px] w-[900px] rounded-full bg-fuchsia-200/30 blur-[130px] transform-gpu"></div>
        <div className="absolute left-[20%] -bottom-[20%] h-[800px] w-[800px] rounded-full bg-indigo-200/30 blur-[130px] transform-gpu"></div>

        {/* Pure white glow in the center-top to maintain high contrast for the main content */}
        <div className="absolute left-1/2 top-[-15%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-white/90 blur-[100px] transform-gpu"></div>

        {/* Premium Noise/Grain Texture Overlay (Apple-style) */}
        <div
          className="absolute inset-0 opacity-[0.02] transform-gpu"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.7%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
          }}
        ></div>
      </div>

      {/* Page Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <UniversityHero />

        {/* Branch Selection */}
        <BranchGrid />

        {/* Dashboard */}
        <DashboardPage />
      </div>
    </main>
  );
}
