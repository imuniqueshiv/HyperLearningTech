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
  BrainCircuit,
  Award,
  GraduationCap,
} from "lucide-react";
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from "react-icons/fa";

const teamMembers = [
  {
    id: "shiv",
    name: "Shiv Raj Singh",
    role: "Founder & Full-Stack Engineer",
    bio: "Creator of Hyper Learning. Built the entire platform from scratch, designed the architecture, AI systems, and leads product development.",
    image: "https://avatars.githubusercontent.com/u/144125626?v=4",
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
    image: "https://avatars.githubusercontent.com/u/272735419?v=4",
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
    role: "Content Contributor",
    bio: "Actively contributes to Hyper Learning by curating and uploading essential study materials, including PYQs, syllabuses, and question papers.",
    image: "https://avatars.githubusercontent.com/u/231412959?v=4",
    socials: {
      github: "https://github.com/RamuuXfree",
      linkedin: "https://www.linkedin.com/in/ramoo-kachhee-9b1616405/",
      instagram: "https://www.instagram.com/frrr_ace/",
      email: "mailto:ramoo@hyperlearning.tech",
    },
    icon: GraduationCap,
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
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
              Meet the Team
            </span>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              The People Behind
              <br />
              <span className="bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
                Hyper Learning
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-lg">
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
              const Icon = member.icon;

              return (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#060b19]/80 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)] lg:p-6"
                >
                  {/* Subtle top edge highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Top-Right Surface Glow Orb */}
                  <div className="absolute -right-12 -top-12 z-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                  {/* Top-Right animated gradient background glow */}
                  <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                  {/* Premium Badge */}
                  {member.badge && (
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                      <span className="relative flex h-1 w-1">
                        <span className="relative inline-flex h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]"></span>
                      </span>
                      {member.badge}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl lg:h-16 lg:w-16">
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/10" />
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
                    <h3 className="text-[22px] font-bold tracking-tight text-white transition-colors">
                      {member.name}
                    </h3>
                    <p className="mt-1.5 text-[13px] font-medium text-blue-400">
                      {member.role}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-gray-400 transition-colors group-hover:text-gray-300">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="mt-6 flex items-center gap-3">
                      {member.socials.github && (
                        <a
                          href={member.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-white/5"
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
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-[3px] hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-white/5"
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
            className="mx-auto mt-16 max-w-3xl rounded-[24px] border border-border bg-card/40 p-8 text-center backdrop-blur-sm md:p-12"
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Want to Join the Team?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Hyper Learning is open-source and community-driven. Contributions
              are always welcome!
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <a
                href="https://github.com/imuniqueshiv/HyperLearningTech"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                <FaGithub size={18} className="relative z-10" />
                <span className="relative z-10">View on GitHub</span>
              </a>
              <Link
                href="/contact"
                className="group/link inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-foreground backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              >
                <Mail className="h-4 w-4 text-blue-400 transition-colors group-hover/link:text-blue-300" />
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
