"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";

const navLinks = [
  {
    label: "Home",
    href: "/#Home",
  },
  {
    label: "Universities",
    href: "/#Universities",
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = mounted ? resolvedTheme : theme;
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>("/#Home");
  const isClickScrolling = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      if (!isClickScrolling.current) {
        const sections = navLinks
          .filter((link) => link.href.startsWith("/#"))
          .map((link) => link.href.substring(2));

        let current = "";
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 120 && rect.bottom >= 120) {
              current = section;
              break;
            }
          }
        }

        if (current) {
          setActiveSection(`/#${current}`);
        } else if (window.scrollY < 100) {
          setActiveSection("/#Home");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // If it's a hash link on the same page
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);

      if (element) {
        isClickScrolling.current = true;
        setActiveSection(href);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        // Close mobile menu if open
        setIsOpen(false);

        setTimeout(() => {
          isClickScrolling.current = false;
        }, 800);
      } else {
        // If element not found, navigate to home and then scroll
        router.push("/");
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            isClickScrolling.current = true;
            setActiveSection(href);
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(() => {
              isClickScrolling.current = false;
            }, 800);
          }
        }, 100);
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 border-b border-black/10 dark:border-white/10 ${
        scrolled
          ? "bg-[#091A40]/85 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#091A40]/70"
          : "bg-gradient-to-r from-[#061126] via-[#0D245A] to-[#061126]"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 md:h-[72px] items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3.5 transition-opacity duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-[#0B1528] rounded-lg"
          >
            <div className="relative h-10 w-10 md:h-11 md:w-11 flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.02] bg-white/95 rounded-[12px] p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] border border-black/5 dark:bg-transparent dark:p-0 dark:shadow-none dark:border-transparent flex items-center justify-center">
              <Image
                src="/hl-logo.png"
                alt="Hyper Learning Official Logo"
                width={44}
                height={44}
                className="object-contain drop-shadow-sm dark:drop-shadow-none transition-all"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="block text-lg md:text-[20px] font-extrabold tracking-tighter text-[#F4F5F7]">
                Hyper Learning
              </span>
              <p className="text-[11px] md:text-xs font-medium text-[#94A3B8] mt-0.5">
                AI-Powered Learning Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const isActive =
                (pathname === "/" &&
                  link.href.startsWith("/#") &&
                  activeSection === link.href) ||
                (pathname === link.href && !link.href.startsWith("/#"));

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`group relative px-4 py-2 text-[14.5px] tracking-[0.01em] transition-colors duration-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-slate-300 font-medium hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.2)] backdrop-blur-md"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>

                  {/* Hover Underline */}
                  {!isActive && (
                    <span className="absolute bottom-1.5 left-1/2 h-[1.5px] w-[calc(100%-1.5rem)] -translate-x-1/2 origin-center scale-x-0 bg-gradient-to-r from-transparent via-blue-600/80 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-x-100 dark:via-white/70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {mounted && (
              <button
                onClick={() =>
                  setTheme(currentTheme === "dark" ? "light" : "dark")
                }
                aria-label="Toggle theme"
                className="flex h-[34px] w-[68px] items-center overflow-hidden rounded-full border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-black/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] transition-all hover:border-black/20 dark:hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
              >
                <div
                  className={`flex h-full w-1/2 items-center justify-center transition-all duration-300 ${
                    currentTheme !== "dark"
                      ? "bg-white dark:bg-white/15 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Sun
                    strokeWidth={2.5}
                    className={`h-[15px] w-[15px] ${currentTheme !== "dark" ? "text-amber-600 drop-shadow-sm" : "text-slate-500 dark:text-white/40"}`}
                  />
                </div>
                <div
                  className={`flex h-full w-1/2 items-center justify-center transition-all duration-300 ${
                    currentTheme === "dark"
                      ? "bg-white dark:bg-white/15 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Moon
                    strokeWidth={2.5}
                    className={`h-[15px] w-[15px] ${currentTheme === "dark" ? "text-white drop-shadow-sm" : "text-slate-500 dark:text-white/40"}`}
                  />
                </div>
              </button>
            )}

            <Link
              href="/sign-in"
              className="flex h-[34px] items-center justify-center rounded-[14px] border border-black/10 dark:border-white/10 px-5 text-[14px] font-semibold text-white transition-all duration-300 bg-gradient-to-b from-black/[0.01] to-black/[0.05] dark:from-white/[0.08] dark:to-white/[0.01] backdrop-blur-md shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.8),0_2px_6px_rgba(0,0,0,0.08)] dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.3)] hover:-translate-y-[0.5px] hover:border-black/20 dark:hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
            >
              Sign In
            </Link>

            <Link
              href="/subjects"
              className="rounded-xl bg-[#1D4ED8] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#1E40AF] hover:scale-[1.01] hover:shadow dark:bg-white dark:text-[#0B1528] dark:hover:bg-[#F4F5F7] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
            >
              Start Learning
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="rounded-xl p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50 md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="region"
            aria-label="Mobile Navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/50 dark:border-white/10 bg-background/95 dark:bg-[#091A40]/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-6 py-6">
              {navLinks.map((link) => {
                const isActive =
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeSection === link.href) ||
                  (pathname === link.href && !link.href.startsWith("/#"));

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      handleNavClick(e, link.href);
                      setIsOpen(false);
                    }}
                    className={`block rounded-xl px-4 py-3 text-[15px] font-medium tracking-[0.02em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50 ${
                      isActive
                        ? "text-foreground bg-black/5 dark:text-white dark:bg-white/5"
                        : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:text-[#AFC8FF] dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-6 flex flex-col gap-3 border-t border-border/50 dark:border-white/10 pt-6">
                <button
                  onClick={() =>
                    setTheme(currentTheme === "dark" ? "light" : "dark")
                  }
                  aria-label="Toggle theme"
                  className="flex w-full items-center justify-between rounded-xl p-3 text-base font-medium text-foreground transition-colors hover:bg-black/5 dark:text-white/90 dark:hover:bg-white/10"
                >
                  <span>Theme</span>
                  {mounted && (
                    <div className="flex h-[34px] w-[68px] items-center overflow-hidden rounded-full border border-black/20 dark:border-white/25 bg-transparent">
                      <div
                        className={`flex h-full w-1/2 items-center justify-center transition-colors ${currentTheme !== "dark" ? "bg-black/10 dark:bg-white/20" : ""}`}
                      >
                        <Sun
                          strokeWidth={2.5}
                          className={`h-[15px] w-[15px] ${currentTheme !== "dark" ? "text-amber-600" : "text-slate-500 dark:text-white/60"}`}
                        />
                      </div>
                      <div
                        className={`flex h-full w-1/2 items-center justify-center transition-colors ${currentTheme === "dark" ? "bg-black/10 dark:bg-white/20" : ""}`}
                      >
                        <Moon
                          strokeWidth={2.5}
                          className={`h-[15px] w-[15px] ${currentTheme === "dark" ? "text-white" : "text-slate-500 dark:text-white/60"}`}
                        />
                      </div>
                    </div>
                  )}
                </button>

                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-black/20 px-4 py-3 text-center text-[15px] font-semibold text-foreground transition-all duration-200 hover:bg-black/5 dark:border-white/25 dark:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
                >
                  Sign In
                </Link>

                <Link
                  href="/subjects"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl bg-[#1D4ED8] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-sm transition-all duration-250 hover:bg-[#1E40AF] active:scale-[0.98] dark:bg-white dark:text-[#0B1528] dark:hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
                >
                  Start Learning
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
