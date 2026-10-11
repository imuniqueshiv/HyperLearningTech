import fs from "fs/promises";
import type { MetadataRoute } from "next";

import { branches } from "@/lib/data/branches";
import { subjects } from "@/lib/data/subjects";
import {
  getRgpvSubjectDir,
  joinUnderAbsoluteRoot,
} from "@/lib/content/rgpv-paths";
import { toPaperSlug } from "@/lib/content/paper-slug";
import { SITE_ORIGIN, absoluteUrl } from "@/lib/seo/site";

function semesterIdsForBranch(branchId: string): string[] {
  if (branchId === "common") {
    return ["semester-1", "semester-2"];
  }
  return [
    "semester-3",
    "semester-4",
    "semester-5",
    "semester-6",
    "semester-7",
    "semester-8",
  ];
}

function subjectSegment(subject: {
  contentSlug?: string;
  code: string;
}): string {
  return (subject.contentSlug ?? subject.code).toLowerCase();
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(/* turbopackIgnore: true */ filePath);
    return true;
  } catch {
    return false;
  }
}

async function readPaperSlugs(pyqsPath: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(/* turbopackIgnore: true */ pyqsPath, "utf8");
    const data = JSON.parse(raw) as {
      papers?: Array<{ month?: string; year?: number }>;
    };

    return (data.papers ?? [])
      .filter(
        (paper): paper is { month: string; year: number } =>
          Boolean(paper.month) && typeof paper.year === "number"
      )
      .map((paper) => toPaperSlug(paper.month, paper.year));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const availableBranches = branches.filter(
    (branch) => branch.status === "Available"
  );
  const availableBranchIds = new Set(
    availableBranches.map((branch) => branch.id)
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/rgpv"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/subjects"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/creators"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/cgpa-calculator"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const branchRoutes: MetadataRoute.Sitemap = availableBranches.map(
    (branch) => ({
      url: absoluteUrl(`/rgpv/${branch.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    })
  );

  const semesterRoutes: MetadataRoute.Sitemap = availableBranches.flatMap(
    (branch) =>
      semesterIdsForBranch(branch.id).map((semester) => ({
        url: absoluteUrl(`/rgpv/${branch.slug}/${semester}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
  );

  const indexableSubjects = subjects.filter((subject) =>
    availableBranchIds.has(subject.branchId)
  );

  const subjectRoutes: MetadataRoute.Sitemap = [];

  for (const subject of indexableSubjects) {
    const segment = subjectSegment(subject);
    const subjectBase = `/rgpv/${subject.branchId}/${subject.semesterId}/${segment}`;
    const subjectDir = getRgpvSubjectDir(
      subject.branchId,
      subject.semesterId,
      segment
    );
    const syllabusPath = joinUnderAbsoluteRoot(subjectDir, "syllabus.json");
    const pyqsPath = joinUnderAbsoluteRoot(subjectDir, "pyqs.json");
    const hasSyllabus = await pathExists(syllabusPath);
    const hasPyqs = await pathExists(pyqsPath);

    // Include subject hubs that resolve in-app; deepen sitemap only when content exists.
    subjectRoutes.push({
      url: absoluteUrl(subjectBase),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });

    if (hasSyllabus) {
      subjectRoutes.push({
        url: absoluteUrl(`${subjectBase}/syllabus`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    if (hasPyqs) {
      const papers = await readPaperSlugs(pyqsPath);
      for (const paper of papers) {
        subjectRoutes.push({
          url: absoluteUrl(`${subjectBase}/pyqs/${paper}`),
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.65,
        });
      }
    }
  }

  return [...staticRoutes, ...branchRoutes, ...semesterRoutes, ...subjectRoutes]
    .filter((item) => item.url.startsWith(SITE_ORIGIN))
    .map((item) => ({
      ...item,
      url:
        item.url.endsWith("/") && item.url !== `${SITE_ORIGIN}/`
          ? item.url.slice(0, -1)
          : item.url,
    }));
}
