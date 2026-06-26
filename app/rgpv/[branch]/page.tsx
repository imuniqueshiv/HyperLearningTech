import SemesterOverview from "@/components/university/semester-overview";
import { branches } from "@/lib/data/branches";

export function generateStaticParams() {
  return branches.map((branch) => ({
    branch: branch.id,
  }));
}

interface BranchPageProps {
  params: Promise<{
    branch: string;
  }>;
}

export default async function BranchPage({ params }: BranchPageProps) {
  const { branch } = await params;

  return (
    <main className="min-h-screen bg-background">
      <SemesterOverview branch={branch} />
    </main>
  );
}
