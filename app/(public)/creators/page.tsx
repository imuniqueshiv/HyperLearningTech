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
    isFounder: true,
  },
  {
    id: "nitin",
    name: "Nitin Pandey",
    role: "UI/UX Designer & Frontend Developer",
    bio: "Designs intuitive user interfaces and improves the overall user experience of Hyper Learning.",
    image: "https://avatars.githubusercontent.com/u/272735419?v=4",
    socials: {
      github: "https://github.com/nitinmohan18",
      linkedin: "https://linkedin.com/in/nitin-mohan-9251ab328",
      instagram: "https://www.instagram.com/nitin__.pandey/",
      portfolio: "https://nitinpandey-portfolio.vercel.app/",
      email: "mailto:mohannitin494@gmail.com",
    },
    icon: Palette,
    isFounder: false,
  },
  {
    id: "ramoo",
    name: "Ramoo Kachhee",
    role: "Frontend Developer",
    bio: "Builds responsive user interfaces and implements frontend components for Hyper Learning.",
    image: "https://avatars.githubusercontent.com/u/231412959?v=4",
    socials: {
      github: "https://github.com/RamuuXfree",
      linkedin: "https://www.linkedin.com/in/ramoo-kachhee-9b1616405/",
      instagram: "https://www.instagram.com/frrr_ace/",
      email: "mailto:ramoo@hyperlearning.tech",
    },
    icon: Code2,
    isFounder: false,
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
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
              Meet the Team
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              The People Behind
              <br />
              <span className="bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
                Hyper Learning
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A small team of dedicated individuals working together to make
              engineering education more accessible and effective through
              AI-powered learning.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {teamMembers.map((member) => {
              const Icon = member.icon;

              return (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  className={`group relative overflow-hidden rounded-3xl border border-border bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl ${
                    member.isFounder ? "ring-1 ring-blue-500/20" : ""
                  }`}
                >
                  {/* Founder Badge */}
                  {member.isFounder && (
                    <div className="absolute right-4 top-4 z-10 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Founder
                    </div>
                  )}

                  {/* Glow */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/30 blur-3xl dark:bg-blue-500/10" />
                  </div>

                  {/* Avatar */}
                  <div className="relative z-10 mb-6 h-20 w-20 overflow-hidden rounded-2xl">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-foreground">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="mt-6 flex items-center gap-3">
                      {member.socials.github && (
                        <a
                          href={member.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-blue-700 hover:text-white hover:shadow-lg"
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
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-blue-700 hover:text-white hover:shadow-lg"
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
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-blue-700 hover:text-white hover:shadow-lg"
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
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-blue-700 hover:text-white hover:shadow-lg"
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
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-blue-700 hover:text-white hover:shadow-lg"
                          aria-label="Portfolio"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}

                      {member.socials.email && (
                        <a
                          href={member.socials.email}
                          className="rounded-lg p-2 text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-blue-700 hover:text-white hover:shadow-lg"
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
            className="mt-16 rounded-3xl border border-border bg-card/40 p-8 text-center backdrop-blur-sm md:p-12"
          >
            <h2 className="text-2xl font-bold text-foreground">
              Want to Join the Team?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Hyper Learning is open-source and community-driven. Contributions
              are always welcome!
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://github.com/imuniqueshiv/HyperLearningTech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 font-medium text-white transition hover:bg-[#1E40AF]"
              >
                <FaGithub size={20} />
                View on GitHub
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-6 py-3 font-medium text-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5"
              >
                <Mail className="h-4 w-4" />
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
