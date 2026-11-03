import fs from "fs/promises";
import Link from "next/link";
import type { Metadata } from "next";
import { getSubjectsBySemester, type Subject } from "@/lib/data/subjects";
import { branches } from "@/lib/data/branches";
import { getRgpvSubjectFile } from "@/lib/content/rgpv-paths";
import { ArrowRight } from "lucide-react";
import { buildPageMetadata, formatSemesterLabel } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

interface SemesterPageProps {
  params: Promise<{
    branch: string;
    semester: string;
  }>;
}

export async function generateMetadata({
  params,
}: SemesterPageProps): Promise<Metadata> {
  const { branch, semester } = await params;
  const branchInfo = branches.find((item) => item.id === branch);
  const branchName = branchInfo?.name ?? branch.toUpperCase();
  const semesterLabel = formatSemesterLabel(semester);

  return buildPageMetadata({
    title: `${branch.toUpperCase()} · ${semesterLabel}`,
    description: `Subjects, syllabus, and previous-year questions for ${branchName} ${semesterLabel} on Hyper Learning Tech.`,
    path: `/rgpv/${branch}/${semester}`,
  });
}

function subjectSegment(subject: Subject) {
  return subject.contentSlug ?? subject.code.toLowerCase();
}

async function subjectHasPyqs(
  branch: string,
  semester: string,
  subject: Subject
) {
  try {
    const filePath = getRgpvSubjectFile(
      branch,
      semester,
      subjectSegment(subject),
      "pyqs.json"
    );
    const raw = await fs.readFile(
      /* turbopackIgnore: true */ filePath,
      "utf8"
    );
    const data = JSON.parse(raw) as { papers?: unknown[] };
    return Array.isArray(data.papers) && data.papers.length > 0;
  } catch {
    return false;
  }
}

function SubjectCard({
  subject,
  href,
  hasPyqs,
}: {
  subject: Subject;
  href: string;
  hasPyqs: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-3xl border border-border bg-card p-7 transition-[border-color,box-shadow] duration-300 ease-out hover:shadow-lg",
        hasPyqs ? "hover:border-blue-500/20" : "hover:border-red-500"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {subject.code}
          </p>

          <h3 className="mt-2 text-xl font-bold text-foreground">
            {subject.name}
          </h3>
        </div>

        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Syllabus
        </span>

        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          PYQs
        </span>

        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Hyper AI
        </span>
      </div>
    </Link>
  );
}

function buildSubjectSections(subjects: Subject[]) {
  const core = subjects.filter((subject) => !subject.group);
  const groupNames: string[] = [];

  for (const subject of subjects) {
    if (subject.group && !groupNames.includes(subject.group)) {
      groupNames.push(subject.group);
    }
  }

  const sections: {
    key: string;
    title: string;
    description: string;
    subjects: Subject[];
  }[] = [];

  if (core.length > 0) {
    sections.push({
      key: "core",
      title: "Core Subjects",
      description: "Compulsory subjects for this semester.",
      subjects: core,
    });
  }

  for (const name of groupNames) {
    const groupSubjects = subjects.filter((subject) => subject.group === name);
    const groupCode = groupSubjects.find(
      (subject) => subject.groupCode
    )?.groupCode;

    sections.push({
      key: name,
      title: groupCode ? `${name} · ${groupCode}` : name,
      description: groupCode
        ? `Choose one subject from ${groupCode}. The other options are alternatives, not additional compulsory subjects.`
        : "Choose one subject from this group. The other options are alternatives, not additional compulsory subjects.",
      subjects: groupSubjects,
    });
  }

  return sections;
}

export default async function SemesterPage({ params }: SemesterPageProps) {
  const { branch, semester } = await params;

  const subjects = getSubjectsBySemester(branch, semester);
  const pyqsFlags = await Promise.all(
    subjects.map(async (subject) => [
      subject.id,
      await subjectHasPyqs(branch, semester, subject),
    ] as const)
  );
  const hasPyqsById = new Map(pyqsFlags);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              RGPV Learning Hub
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              {branch.toUpperCase()} · {formatSemesterLabel(semester)}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              RGPV subjects for{" "}
              <span className="font-semibold uppercase text-foreground">
                {branch}
              </span>
            </p>

            <p className="mt-6 max-w-2xl text-muted-foreground">
              Access syllabus, previous year questions, AI notes, and Hyper AI
              assistance for every subject.
            </p>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">Subjects</h2>

            <p className="mt-3 text-muted-foreground">
              Select a subject to access syllabus, PYQs, AI notes, and learning
              resources.
            </p>
          </div>

          {subjects.some((subject) => subject.group) ? (
            <div className="space-y-14">
              {buildSubjectSections(subjects).map((section) => (
                <div key={section.key}>
                  <h3 className="text-2xl font-bold text-foreground">
                    {section.title}
                  </h3>
                  <p className="mt-2 max-w-3xl text-muted-foreground">
                    {section.description}
                  </p>
                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {section.subjects.map((subject) => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        href={`/rgpv/${branch}/${semester}/${subjectSegment(subject)}`}
                        hasPyqs={hasPyqsById.get(subject.id) ?? false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  href={`/rgpv/${branch}/${semester}/${subjectSegment(subject)}`}
                  hasPyqs={hasPyqsById.get(subject.id) ?? false}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
