"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import {
  Globe,
  Mail,
  Users,
  Code2,
  Palette,
  GraduationCap,
} from "lucide-react";
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from "react-icons/fa";

const teamMembers = [
  {
    id: "shiv",
    name: "Shiv Raj Singh",
    role: "Founder & Full-Stack Engineer",
    bio: "Creator of Hyper Learning. Built the entire platform from scratch, designed the architecture, AI systems, and leads product development.",
    image: "https://github.com/imuniqueshiv.png",
    socials: {
      github: "https://github.com/imuniqueshiv",
      linkedin: "https://www.linkedin.com/in/shiv-raj-singh-387973299/",
      twitter: "https://x.com/imuniqueshiv",
      portfolio: "https://imuniqueshiv-portfolio.vercel.app/",
      email: "mailto:singhshivraj89969@gmail.com",
    },
    icon: Code2,
    badge: "Founder",
  },
  {
    id: "nitin",
    name: "Nitin Mohan",
    role: "Co-Founder, UI/UX Designer & Full Stack Developer",
    bio: "Designs intuitive user interfaces and improves the overall user experience of Hyper Learning.",
    image: "https://github.com/nitinmohan18.png",
    socials: {
      github: "https://github.com/nitinmohan18",
      linkedin: "https://linkedin.com/in/nitin-mohan-9251ab328",
      instagram: "https://www.instagram.com/nitin__.pandey/",
      twitter: "https://x.com/nitinmohan18",
      portfolio: "https://nitinpandey-portfolio.vercel.app/",
      email: "mailto:mohannitin494@gmail.com",
    },
    icon: Palette,
    badge: "Co-Founder",
  },
  {
    id: "ramoo",
    name: "Ramoo Kachhee",
    role: "Co-Founder & Content Contributor & Full Stack Developer  ",
    bio: "Actively contributes to Hyper Learning by curating and uploading essential study materials, including PYQs, syllabuses, and question papers.",
    image: "https://github.com/RamuuXfree.png",
    socials: {
      github: "https://github.com/RamuuXfree",
      linkedin: "https://www.linkedin.com/in/ramoo-kachhee-9b1616405/",
      instagram: "https://www.instagram.com/frrr_ace/",
      email: "mailto:ramoo@hyperlearning.tech",
    },
    icon: GraduationCap,
    badge: "Co-Founder",
  },
];

export default function TeamPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-4 lg:pt-14 lg:pb-6">
        {/* Subtle Ambient Glows */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-5%] top-[-10%] h-[300px] w-[300px] rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-[100px]" />
          <div className="absolute right-[20%] top-[-10%] h-[300px] w-[300px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-50/80 dark:bg-blue-500/10 px-4 py-1.5 text-[13px] font-semibold text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              </span>
              Meet the Team
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              The People Behind
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 bg-clip-text text-transparent">
                Hyper Learning
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              A small team of dedicated individuals working together to make
              engineering education more accessible and effective through
              AI-powered learning.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {teamMembers.map((member) => {
              return (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/40 p-5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500/40 dark:hover:border-blue-400/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.2)] lg:p-6"
                >
                  {/* Subtle top edge highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/20 to-transparent" />

                  {/* Top-Right Surface Glow Orb */}
                  <div className="absolute -right-12 -top-12 z-0 h-48 w-48 rounded-full bg-blue-400/20 dark:bg-blue-500/20 blur-3xl opacity-40 transition-opacity duration-700 group-hover:opacity-100" />

                  {/* Top-Right animated gradient background glow */}
                  <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 dark:from-blue-600/10 via-transparent to-transparent opacity-50 transition-opacity duration-700 group-hover:opacity-100" />

                  {/* Premium Badge */}
                  {member.badge && (
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-blue-500/20 dark:border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                      <span className="relative flex h-1 w-1">
                        <span className="relative inline-flex h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]"></span>
                      </span>
                      {member.badge}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl lg:h-16 lg:w-16 shadow-sm">
                    <div className="absolute inset-0 rounded-2xl border-2 border-slate-200/80 dark:border-white/10 transition-colors duration-500 group-hover:border-blue-400/40 dark:group-hover:border-blue-500/50" />
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="relative z-10 h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
                      {member.name}
                    </h3>
                    <p className="mt-1.5 text-[13px] font-medium text-blue-600 dark:text-blue-400">
                      {member.role}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-gray-300">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="mt-6 flex items-center gap-3">
                      {member.socials.github && (
                        <a
                          href={member.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:shadow-md hover:shadow-slate-200 dark:hover:shadow-white/5"
                          aria-label="GitHub"
                        >
                          <FaGithub size={20} />
                        </a>
                      )}

                      {member.socials.linkedin && (
                        <a
                          href={member.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-[#0A66C2]/15 hover:text-[#0A66C2] hover:shadow-md hover:shadow-[#0A66C2]/15"
                          aria-label="LinkedIn"
                        >
                          <FaLinkedin size={20} />
                        </a>
                      )}

                      {member.socials.twitter && (
                        <a
                          href={member.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:shadow-md hover:shadow-slate-200 dark:hover:shadow-white/5"
                          aria-label="X (Twitter)"
                        >
                          <FaTwitter size={20} />
                        </a>
                      )}

                      {member.socials.instagram && (
                        <a
                          href={member.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-[#E1306C]/15 hover:text-[#E1306C] hover:shadow-md hover:shadow-[#E1306C]/15"
                          aria-label="Instagram"
                        >
                          <FaInstagram size={20} />
                        </a>
                      )}

                      {member.socials.portfolio && (
                        <a
                          href={member.socials.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-[#10B981]/15 hover:text-[#10B981] hover:shadow-md hover:shadow-[#10B981]/15"
                          aria-label="Portfolio"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}

                      {member.socials.email && (
                        <a
                          href={member.socials.email}
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-[#EA4335]/15 hover:text-[#EA4335] hover:shadow-md hover:shadow-[#EA4335]/15"
                          aria-label="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="relative mx-auto mt-20 lg:mt-24 max-w-4xl text-center"
          >
            {/* Elegant glowing orb behind text */}
            <div className="absolute left-1/2 top-1/2 -z-10 h-[150px] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-blue-500/10 dark:bg-blue-500/20 blur-[80px]" />

            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-[3.5rem] leading-tight">
              <span className="bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Want to Join the Team?
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              Hyper Learning is open-source and community-driven.
              <br className="hidden sm:block" />
              Contributions are always welcome!
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              <a
                href="https://github.com/imuniqueshiv/HyperLearningTech"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-900 dark:bg-white px-7 py-3 text-sm font-semibold text-white dark:text-slate-900 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <FaGithub
                  size={18}
                  className="relative z-10 transition-transform duration-300 group-hover:text-white group-hover:rotate-12"
                />
                <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                  View on GitHub
                </span>
              </a>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-transparent px-7 py-3 text-sm font-semibold text-slate-900 dark:text-white transition-all duration-300 hover:scale-105 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <Mail className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500 dark:group-hover:text-cyan-400" />
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
