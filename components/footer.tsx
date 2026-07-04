"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Zap, Shield, Users, Bell, Globe } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const SocialDropdown = ({
  icon: Icon,
  label,
  links,
  size = "sm",
  hoverClass,
}: {
  icon: React.ElementType;
  label: string;
  links: { name: string; url: string }[];
  size?: "sm" | "md";
  hoverClass?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseClasses =
    size === "md"
      ? "group flex h-[36px] w-[36px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 "
      : "group flex h-[32px] w-[32px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 ";

  const btnClasses =
    baseClasses +
    (hoverClass ||
      "hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]");

  const iconClasses =
    size === "md"
      ? "h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-105"
      : "h-[16px] w-[16px] transition-transform duration-300 group-hover:scale-105";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-label={label}
        className={btnClasses}
      >
        <Icon className={iconClasses} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[150px] rounded-[14px] border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0a101f]/90 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl z-50 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1.5 flex flex-col gap-1">
            {links.map((link: { name: string; url: string }, i: number) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 rounded-[10px] hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          {/* Small arrow indicator */}
          <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0a101f]/90 backdrop-blur-xl"></div>
        </div>
      )}
    </div>
  );
};

export default function Footer() {
  return (
    <footer className="relative -mt-10 border-t border-[#D8E2F0] dark:border-white/[0.04] bg-[#F5F7FF] dark:bg-[#020617] overflow-x-clip">
      {/* Light Mode Premium Dot Matrix Background */}
      <div
        className="hidden md:block absolute inset-0 pointer-events-none dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.25) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Light Mode Bottom Radial Glow */}
      <div className="hidden md:block absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-gradient-to-t from-blue-500/15 to-transparent blur-[100px] rounded-full pointer-events-none dark:hidden" />

      {/* Premium ambient light effect at the top */}
      <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
        <div className="w-[80%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 dark:via-blue-500/20 to-transparent" />
        <div className="hidden md:block absolute top-0 w-[40%] h-[150px] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Premium Outer wrapper */}
      <div className="relative mx-auto max-w-[1600px] px-6 py-10 md:px-12 lg:px-16 xl:px-20 z-10">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 lg:gap-8 xl:gap-16">
          {/* Brand - Flexible Width */}
          <div className="flex flex-col lg:max-w-[280px]">
            <Link
              href="/"
              className="group inline-flex items-center gap-3.5 w-fit"
            >
              <div className="relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[14px] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]">
                <Image
                  src="/hl-logo.png"
                  alt="Hyper Learning Logo"
                  width={46}
                  height={46}
                  className="object-contain dark:brightness-[1.8] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                />
              </div>
              <div>
                <h2 className="text-[23px] font-bold tracking-tight text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-white/70 dark:bg-clip-text transition-all duration-300">
                  <span className="transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Hyper
                  </span>{" "}
                  Learning
                </h2>
                <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-blue-500 dark:text-indigo-300 mt-0.5">
                  AI-Powered Learning
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-[240px] text-[12.5px] leading-[1.6] text-slate-700 dark:text-slate-200 font-medium">
              AI-powered learning platform for engineering students.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <a
                href="mailto:contact@hyperlearning.tech"
                className="group flex h-[40px] w-[40px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-red-500/40 hover:bg-blue-50 dark:hover:bg-red-500/5 hover:text-blue-600 dark:hover:text-red-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_15px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                aria-label="Email"
              >
                <Mail strokeWidth={2.5} className="h-[19px] w-[19px]" />
              </a>
              <a
                href="https://github.com/imuniqueshiv"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-[40px] w-[40px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-white/40 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                aria-label="GitHub"
              >
                <GithubIcon className="h-[19px] w-[19px] transition-transform duration-300 group-hover:scale-105" />
              </a>
              <a
                href="https://twitter.com/imuniqueshiv"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-[40px] w-[40px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-sky-500/40 hover:bg-blue-50 dark:hover:bg-sky-500/5 hover:text-blue-600 dark:hover:text-sky-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_15px_rgba(14,165,233,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-[19px] w-[19px] transition-transform duration-300 group-hover:scale-105" />
              </a>
              <a
                href="https://www.linkedin.com/in/shiv-raj-singh-387973299/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-[40px] w-[40px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-[#0A66C2]/40 hover:bg-blue-50 dark:hover:bg-[#0A66C2]/5 hover:text-blue-600 dark:hover:text-[#0A66C2] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_15px_rgba(10,102,194,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-[19px] w-[19px] transition-transform duration-300 group-hover:scale-105" />
              </a>
            </div>
          </div>

          {/* Navigation Container */}
          <div className="grid grid-cols-2 gap-12 sm:gap-20 xl:pr-10 w-full lg:w-auto mt-4 lg:mt-0">
            {/* Platform */}
            <div className="flex flex-col">
              <h3 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.15em] text-slate-900 dark:text-white">
                Platform
              </h3>
              <div className="mb-5 h-[1.5px] w-[23px] rounded-full bg-slate-200 dark:bg-transparent dark:bg-gradient-to-r dark:from-blue-500 dark:to-indigo-500/50" />
              <ul className="space-y-3.5">
                {[
                  { name: "Subjects", href: "/subjects" },
                  { name: "Universities", href: "/#Universities" },
                  { name: "Dashboard", href: "/dashboard" },
                  { name: "Student Login", href: "/sign-in" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group flex w-fit items-center text-[15px] font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:translate-x-1 hover:text-blue-600 dark:hover:text-white whitespace-nowrap"
                    >
                      <span className="mr-3 text-[15px] text-slate-400 dark:text-slate-600 transition-all duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]">
                        •
                      </span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="flex flex-col">
              <h3 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.15em] text-slate-900 dark:text-white">
                Company
              </h3>
              <div className="mb-5 h-[2px] w-[28px] rounded-full bg-slate-300 dark:bg-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-400/50" />
              <ul className="space-y-3.5">
                {[
                  { name: "About Us", href: "/about" },
                  { name: "Contact", href: "/contact" },
                  { name: "Creators", href: "/creators" },
                  { name: "Privacy Policy", href: "/" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group flex w-fit items-center text-[15px] font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:translate-x-1 hover:text-blue-600 dark:hover:text-white whitespace-nowrap"
                    >
                      <span className="mr-3 text-[15px] text-slate-400 dark:text-slate-600 transition-all duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]">
                        •
                      </span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature Cards — hidden on mobile to prevent GPU glitch */}
          <div className="hidden md:block w-full mt-8 lg:mt-0 lg:w-[320px] xl:w-[360px] shrink-0 lg:border-l lg:border-slate-200 dark:lg:border-white/[0.03] lg:pl-10">
            <div className="grid grid-cols-2 gap-3 h-full">
              {[
                {
                  title: "AI-Powered",
                  desc: "Smarter learning",
                  icon: Zap,
                },
                {
                  title: "Trusted & Secure",
                  desc: "Data protected",
                  icon: Shield,
                },
                {
                  title: "For Engineers",
                  desc: "Designed by learners",
                  icon: Users,
                },
                {
                  title: "Always Updated",
                  desc: "New content added",
                  icon: Bell,
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative flex h-full min-h-[90px] flex-col items-center justify-center overflow-hidden rounded-[12px] border border-[#D8E2F0] dark:border-white/[0.03] bg-gradient-to-b from-white to-[#FBFCFF] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-500/20"
                >
                  <div className="relative mb-2 flex items-center justify-center">
                    <feature.icon
                      className="h-[16px] w-[16px] text-blue-600/70 dark:text-blue-400/50 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-500 dark:group-hover:text-blue-300"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h4 className="text-[11px] font-semibold tracking-wide text-slate-700 dark:text-white/60">
                    {feature.title}
                  </h4>
                  <p className="mt-1 text-[9px] leading-[1.3] text-slate-400 dark:text-slate-400/60 font-medium">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-10 flex h-auto flex-col items-center justify-between gap-5 rounded-[20px] border border-[#C2D4EA] dark:border-white/[0.05] bg-[#EDF2F8] dark:bg-[#0a101f] md:dark:bg-white/[0.01] md:backdrop-blur-lg px-4 py-4 md:px-6 shadow-sm dark:shadow-none md:dark:shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.04)] lg:h-[48px] lg:flex-row lg:rounded-full lg:px-8 lg:py-0 transition-all hover:border-slate-300 dark:hover:border-white/[0.08]">
          {/* Left: Copyright */}
          <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400/80 shrink-0">
            © {new Date().getFullYear()} Hyper Learning. All rights reserved.
          </p>

          {/* Center: Disclaimer */}
          <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400/80 text-center flex-1 mx-4">
            <span className="text-slate-700 dark:text-slate-300">
              Disclaimer:
            </span>{" "}
            Some content may contain errors. Please cross-check and share
            corrections via our feedback section.
          </p>

          {/* Right: Socials */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-900 dark:text-slate-400/80">
              Follow Us
            </span>
            <div className="flex items-center gap-2">
              {[
                {
                  icon: InstagramIcon,
                  label: "Instagram",
                  hoverClass:
                    "hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-md dark:hover:border-pink-500/40 dark:hover:bg-pink-500/5 dark:hover:text-pink-400 dark:hover:shadow-[0_0_15px_rgba(236,72,153,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                  links: [
                    {
                      name: "Nitin's Instagram",
                      url: "https://www.instagram.com/nitin__.pandey/",
                    },
                    {
                      name: "Ramu's Instagram",
                      url: "https://www.instagram.com/frrr_ace/",
                    },
                  ],
                },
                {
                  icon: LinkedinIcon,
                  label: "LinkedIn",
                  hoverClass:
                    "hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-md dark:hover:border-[#0A66C2]/40 dark:hover:bg-[#0A66C2]/5 dark:hover:text-[#0A66C2] dark:hover:shadow-[0_0_15px_rgba(10,102,194,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                  links: [
                    {
                      name: "Nitin's LinkedIn",
                      url: "https://linkedin.com/in/nitin-mohan-9251ab328",
                    },
                    {
                      name: "Ramu's LinkedIn",
                      url: "https://www.linkedin.com/in/ramoo-kachhee-9b1616405/",
                    },
                  ],
                },
                {
                  icon: GithubIcon,
                  label: "GitHub",
                  hoverClass:
                    "hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-md dark:hover:border-white/40 dark:hover:bg-white/5 dark:hover:text-white dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                  links: [
                    {
                      name: "Nitin's GitHub",
                      url: "https://github.com/nitinmohan18",
                    },
                    {
                      name: "Ramu's GitHub",
                      url: "https://github.com/RamuuXfree",
                    },
                  ],
                },
              ].map((social, idx) => (
                <SocialDropdown
                  key={idx}
                  size="sm"
                  icon={social.icon}
                  label={social.label}
                  links={social.links}
                  hoverClass={social.hoverClass}
                />
              ))}

              {/* Direct Link to Nitin's Portfolio */}
              <a
                href="https://nitinpandey-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-[32px] w-[32px] items-center justify-center rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.01] text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-md dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/5 dark:hover:text-emerald-400 dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                aria-label="Portfolio"
              >
                <Globe
                  strokeWidth={2.5}
                  className="h-[16px] w-[16px] transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
