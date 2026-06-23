import Link from "next/link";
import { getSubjectsBySemester } from "@/lib/data/subjects";
import { ArrowRight } from "lucide-react";

interface SemesterPageProps {
  params: Promise<{
    branch: string;
    semester: string;
  }>;
}

export default async function SemesterPage({ params }: SemesterPageProps) {
  const { branch, semester } = await params;

  const subjects = getSubjectsBySemester(branch, semester);

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
              {semester.replace("-", " ").toUpperCase()}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              Branch:{" "}
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

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject.code}
                href={`/rgpv/${branch}/${semester}/${subject.code.toLowerCase()}`}
                className="group rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:border-blue-500/20 hover:shadow-lg"
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
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
