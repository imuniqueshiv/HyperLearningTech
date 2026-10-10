import type { Metadata } from "next";

import SemesterOverview from "@/components/university/semester-overview";
import { branches } from "@/lib/data/branches";
import { buildPageMetadata } from "@/lib/seo/metadata";

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

export async function generateMetadata({
  params,
}: BranchPageProps): Promise<Metadata> {
  const { branch } = await params;
  const branchInfo = branches.find((item) => item.id === branch);
  const branchName = branchInfo?.name ?? branch.toUpperCase();

  return buildPageMetadata({
    title: `${branchName} · RGPV Semesters`,
    description: `Browse semester-wise RGPV subjects, syllabus, and previous-year questions for ${branchName} on Hyper Learning Tech.`,
    path: `/rgpv/${branch}`,
  });
}

export default async function BranchPage({ params }: BranchPageProps) {
  const { branch } = await params;

  return (
    <main className="bg-background">
      <SemesterOverview branch={branch} />
    </main>
  );
}
