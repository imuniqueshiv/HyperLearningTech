import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  FileText,
  GraduationCap,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

interface AIPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;
}

export default async function AIPage({
  params,
}: AIPageProps) {
  const { branch, semester, subject } = await params;

  const prompts = [
    "Explain AVL Tree with Diagram",
    "Generate Unit 3 Revision Notes",
    "Predict Important Exam Questions",
    "Explain Big O Notation",
    "Generate 10 Mark Answer",
    "Create Last Minute Revision Sheet",
  ];

  const tools = [
    {
      title: "Topic Explanation",
      description:
        "Understand difficult concepts with detailed explanations and examples.",
      icon: BookOpen,
    },
    {
      title: "Answer Generator",
      description:
        "Generate structured 2, 5, and 10 mark exam answers instantly.",
      icon: FileText,
    },
    {
      title: "Revision Notes",
      description:
        "Create concise revision notes for any topic or complete unit.",
      icon: GraduationCap,
    },
    {
      title: "Question Analysis",
      description:
        "Analyze previous year questions and discover important patterns.",
      icon: Sparkles,
    },
  ];

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
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <BrainCircuit className="h-4 w-4" />
              Hyper AI
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Learn With Hyper AI
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              {subject.toUpperCase()} • {branch.toUpperCase()} •{" "}
              {semester.toUpperCase()}
            </p>

            <p className="mt-6 max-w-3xl text-muted-foreground">
              Ask questions, generate notes, create exam answers,
              understand concepts, and prepare smarter with AI-powered
              academic assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Chat Interface */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">

            {/* Main Chat */}
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">

              {/* Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                  <BrainCircuit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h2 className="font-bold text-foreground">
                    Hyper AI
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Online • Ready To Help
                  </p>
                </div>
              </div>

              {/* Example Chat */}
              <div className="space-y-5">

                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#1D4ED8] px-5 py-3 text-sm text-white">
                    Explain AVL Tree with an example.
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-background px-5 py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Hyper AI
                      </span>
                    </div>

                    <p className="text-sm leading-7 text-foreground/80">
                      AVL Tree is a self-balancing Binary Search Tree
                      where the height difference between left and right
                      subtrees cannot exceed one.
                    </p>

                    <p className="mt-3 text-sm leading-7 text-foreground/80">
                      This balancing ensures efficient searching,
                      insertion, and deletion operations with
                      O(log n) complexity.
                    </p>
                  </div>
                </div>

                {/* Input */}
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Ask Hyper AI anything...
                    </span>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-bold text-foreground">
                  Suggested Prompts
                </h3>

                <div className="mt-5 space-y-3">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-blue-500/20"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-bold text-foreground">
                  AI Usage
                </h3>

                <div className="mt-5 flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />

                  <div>
                    <p className="font-semibold text-foreground">
                      Unlimited Learning
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Ask questions anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Hyper AI Tools
            </h2>

            <p className="mt-3 text-muted-foreground">
              Everything you need to learn and prepare effectively.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <div
                  key={tool.title}
                  className="rounded-3xl border border-border bg-card p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-foreground">
                    {tool.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}