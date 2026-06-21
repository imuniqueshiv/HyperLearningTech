"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
GraduationCap,
ArrowRight,
BookOpen,
} from "lucide-react";

export default function SemesterOverview({
branch,
}: {
branch: string;
}) {
const semesters =
branch === "common"
? [
{
year: "1st Year",
description:
"Common curriculum for all engineering branches under RGPV.",
semesters: [
{
name: "Semester 1",
href: "/rgpv/common/semester-1",
},
{
name: "Semester 2",
href: "/rgpv/common/semester-2",
},
],
},
]
: [
{
year: "2nd Year",
description:
"Branch-specific core subjects and foundational engineering concepts.",
semesters: [
{
name: "Semester 3",
href: `/rgpv/${branch}/semester-3`,
},
{
name: "Semester 4",
href: `/rgpv/${branch}/semester-4`,
},
],
},
{
year: "3rd Year",
description:
"Advanced technical subjects, electives, practical learning, and projects.",
semesters: [
{
name: "Semester 5",
href: `/rgpv/${branch}/semester-5`,
},
{
name: "Semester 6",
href: `/rgpv/${branch}/semester-6`,
},
],
},
{
year: "4th Year",
description:
"Industry-focused subjects, major projects, internships, and specialization.",
semesters: [
{
name: "Semester 7",
href: `/rgpv/${branch}/semester-7`,
},
{
name: "Semester 8",
href: `/rgpv/${branch}/semester-8`,
},
],
},
];

return ( <section className="relative overflow-hidden border-b border-border bg-background py-24">
<div className="absolute inset-0 -z-10"> <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" /> <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" /> </div>


  <div className="mx-auto max-w-7xl px-6 lg:px-8">
    {/* Header */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-16 max-w-3xl text-center"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
        <GraduationCap className="h-4 w-4" />
        Academic Structure
      </div>

 <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl leading-tight"> 
  Semester Wise 
  <span className="block bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent pt-1 pb-2"> 
    Learning Path 
  </span> 
</h2>


      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Navigate through your engineering journey semester by semester.
        Access syllabus, previous year questions, Hyper AI, and learning
        resources organized according to the official RGPV curriculum.
      </p>
    </motion.div>

    {/* Year Cards */}
    <div
      className={`grid gap-8 ${
        branch === "common"
          ? "max-w-3xl mx-auto"
          : "lg:grid-cols-2"
      }`}
    >
      {semesters.map((year, index) => (
        <motion.div
          key={year.year}
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: index * 0.08,
          }}
          className="rounded-[2rem] border border-border bg-card/50 p-8 backdrop-blur-xl"
        >
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D4ED8]/10">
              <BookOpen className="h-7 w-7 text-[#1D4ED8]" />
            </div>

            <div>
              <h3 className="text-3xl font-bold text-foreground">
                {year.year}
              </h3>

              <p className="mt-2 text-muted-foreground">
                {year.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {year.semesters.map((semester) => (
              <Link
                key={semester.name}
                href={semester.href}
                className="group"
              >
                <div className="rounded-2xl border border-border bg-background/80 p-5 transition-all duration-300 hover:border-[#1D4ED8]/30 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {semester.name}
                      </h4>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Explore Subjects
                      </p>
                    </div>

                    <ArrowRight className="h-5 w-5 text-[#1D4ED8] transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      ))}
    </div>

    {/* Bottom Section */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-16 rounded-[2rem] border border-border bg-card/40 p-10 text-center backdrop-blur-xl"
    >
      <h3 className="text-2xl font-bold text-foreground">
        Structured For Long-Term Learning
      </h3>

      <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
        Every semester is connected with subjects, syllabus topics,
        previous year questions, and Hyper AI resources to create a
        complete academic learning ecosystem.
      </p>
    </motion.div>
  </div>
</section>


);
}
