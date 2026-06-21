import SemesterOverview from "@/components/university/semester-overview";

interface BranchPageProps {
  params: Promise<{
    branch: string;
  }>;
}

export default async function BranchPage({
  params,
}: BranchPageProps) {
  const { branch } = await params;

  return (
    <main className="min-h-screen bg-background">
      <SemesterOverview branch={branch} />
    </main>
  );
}