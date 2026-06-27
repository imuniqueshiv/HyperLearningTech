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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/50 dark:border-white/5 bg-background/85 dark:bg-[#0B1528]/85 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70 dark:supports-[backdrop-filter]:bg-[#0B1528]/70"
          : "bg-background dark:bg-gradient-to-r dark:from-[#0B1528] dark:to-[#0A101D] border-b border-border/50 dark:border-white/5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 md:h-[72px] items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3.5 transition-opacity duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-[#0B1528] rounded-lg"
          >
            <div className="relative h-10 w-10 md:h-11 md:w-11 flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.02]">
              <Image
                src="/hl-logo.png"
                alt="Hyper Learning Official Logo"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="block text-lg md:text-[20px] font-extrabold tracking-tighter text-foreground dark:text-[#F4F5F7]">
                Hyper Learning
              </span>
              <p className="text-[11px] md:text-xs font-medium text-muted-foreground dark:text-[#94A3B8] mt-0.5">
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
                  className={`relative px-3 py-1.5 text-[14px] font-medium tracking-[0.02em] transition-colors duration-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50 ${
                    isActive
                      ? "text-foreground dark:text-white"
                      : "text-muted-foreground hover:text-foreground dark:text-[#AFC8FF] dark:hover:text-white after:absolute after:bottom-[4px] after:left-3 after:right-3 after:h-[1px] after:bg-foreground/60 dark:after:bg-white/60 after:scale-x-0 after:origin-right hover:after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-black/[0.04] border border-black/10 dark:bg-white/[0.06] dark:border-white/10"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors duration-200 hover:bg-black/5 hover:text-foreground dark:text-white/90 dark:hover:bg-white/10 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
            >
              {mounted &&
                (theme === "dark" ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                ))}
            </button>

            <Link
              href="/sign-in"
              className="rounded-xl border border-border px-5 py-2 text-[14px] font-medium text-foreground transition-all duration-300 hover:border-border/80 hover:bg-muted dark:border-white/15 dark:text-[#F4F5F7] dark:hover:border-white/25 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
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
            className="rounded-xl p-2 text-foreground dark:text-white transition-colors hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50 md:hidden"
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
            className="overflow-hidden border-t border-border/50 dark:border-white/10 bg-background/95 dark:bg-[#0B1528]/95 backdrop-blur-md md:hidden"
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
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-foreground/90 transition-all duration-200 hover:bg-black/5 hover:text-foreground dark:border-white/15 dark:text-white/90 dark:hover:bg-white/5 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
                >
                  {mounted &&
                    (theme === "dark" ? (
                      <Sun className="h-[18px] w-[18px]" />
                    ) : (
                      <Moon className="h-[18px] w-[18px]" />
                    ))}
                </button>

                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-border px-4 py-3 text-center text-[15px] font-medium text-foreground transition-all duration-200 hover:bg-muted dark:border-white/15 dark:text-[#F4F5F7] dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
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
