"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  House,
  GraduationCap,
  MessageSquare,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";

const navLinks = [
  {
    label: "Home",
    href: "/#Home",
    icon: House,
  },
  {
    label: "Universities",
    href: "/#Universities",
    icon: GraduationCap,
  },
  {
    label: "Contact",
    href: "/#Contact",
    icon: MessageSquare,
  },
  {
    label: "About",
    href: "/about",
    icon: Info,
  },
];

function MagneticNavItem({
  children,
  isActive,
  onClick,
  href,
  label,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  href: string;
  label: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    if (!ref.current) return;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        reset();
        setIsHovered(false);
      }}
      onClick={(e) => onClick(e, href)}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`group relative flex h-[40px] cursor-pointer items-center justify-center rounded-[12px] outline-none transition-all duration-500 ease-out ${
        isActive ? "" : "hover:-translate-y-[2px]"
      }`}
    >
      <div className="relative z-10 flex items-center justify-center px-[16px]">
        {children}
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
              animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              className={`overflow-hidden whitespace-nowrap text-[13px] font-semibold tracking-wide ${
                isActive ? "text-[#60A5FA]" : "text-blue-100"
              }`}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.a>
  );
}

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
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);

      if (element) {
        isClickScrolling.current = true;
        setActiveSection(href);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsOpen(false);

        setTimeout(() => {
          isClickScrolling.current = false;
        }, 800);
      } else {
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
        <div className="relative flex h-16 items-center justify-between md:h-[72px]">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3.5 rounded-lg transition-opacity duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-[#0B1528]"
          >
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] md:h-11 md:w-11">
              <Image
                src="/hl-logo.png"
                alt="Hyper Learning Official Logo"
                width={44}
                height={44}
                className="object-contain drop-shadow-sm transition-all dark:drop-shadow-none"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="block text-lg font-extrabold tracking-tighter text-[#F4F5F7] md:text-[20px]">
                Hyper Learning
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-[#94A3B8] md:text-xs">
                AI-Powered Learning Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - Ultra Premium Floating Dock */}
          <div className="absolute left-1/2 top-1/2 z-50 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            {/* Outer pill styling removed for borderless test */}
            <nav className="relative flex h-[56px] items-center gap-[10px] rounded-full px-[11px]">
              {/* Dock Background & Shimmer (Disabled for test) */}
              {/* <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden rounded-full bg-gradient-to-b from-[#102B5C]/80 to-[#081426]/90 backdrop-blur-[24px]">
                <motion.div
                  className="absolute -inset-x-full inset-0 h-full w-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "linear",
                    repeatDelay: 12,
                  }}
                />
              </div> */}

              {navLinks.map((link, index) => {
                const isActive =
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeSection === link.href) ||
                  (pathname === link.href && !link.href.startsWith("/#"));

                const Icon = link.icon;

                return (
                  <div key={link.label} className="flex h-full items-center">
                    {/* Vertical Divider (Except for the first item) */}
                    {index > 0 && (
                      <div className="mx-[3px] h-[20px] w-[1px] bg-gradient-to-b from-transparent via-white/[0.15] to-transparent" />
                    )}

                    <div className="relative z-10 flex h-full items-center justify-center px-[2px]">
                      {/* Active Capsule Glass Background */}
                      {isActive && (
                        <motion.div
                          layoutId="dockActiveBackground"
                          className="pointer-events-none absolute inset-0 my-auto h-[32px] w-full rounded-[10px] border border-white/[0.18] bg-white/[0.06] shadow-[inset_0_1px_4px_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        >
                          {/* Ultra-premium top edge light strip instead of bottom bar */}
                          <div className="absolute top-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 shadow-[0_1px_8px_rgba(255,255,255,0.9)]" />
                          {/* Soft ambient light beneath active capsule */}
                          <div className="absolute inset-0 -z-10 rounded-[14px] bg-white/5 blur-[8px]" />
                        </motion.div>
                      )}

                      {/* Inactive Dot (Only shown when not active) */}
                      {!isActive && (
                        <div className="pointer-events-none absolute bottom-[6px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/[0.12]" />
                      )}

                      <MagneticNavItem
                        isActive={isActive}
                        href={link.href}
                        label={link.label}
                        onClick={handleNavClick}
                      >
                        <Icon
                          className={`relative z-10 transition-all duration-500 ease-out ${
                            isActive
                              ? "h-[22px] w-[22px] scale-110 text-[#60A5FA] drop-shadow-[0_0_12px_rgba(96,165,250,0.8)]"
                              : "h-[20px] w-[20px] text-blue-100/60 group-hover:scale-110 group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(219,234,254,0.6)]"
                          }`}
                          strokeWidth={1.5}
                        />
                      </MagneticNavItem>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {mounted && (
              <button
                onClick={() =>
                  setTheme(currentTheme === "dark" ? "light" : "dark")
                }
                aria-label="Toggle theme"
                className="flex h-[34px] w-[68px] items-center overflow-hidden rounded-full border border-black/10 bg-black/[0.02] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:border-white/15 dark:bg-black/20 dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] dark:hover:border-white/25 dark:focus-visible:ring-white/50"
              >
                <div
                  className={`flex h-full w-1/2 items-center justify-center transition-all duration-300 ${
                    currentTheme !== "dark"
                      ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:bg-white/15 dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
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
                      ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:bg-white/15 dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
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
              className="flex h-[34px] items-center justify-center rounded-[14px] border border-black/10 bg-gradient-to-b from-black/[0.01] to-black/[0.05] px-5 text-[14px] font-semibold text-white shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-[0.5px] hover:border-black/20 hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.8),0_2px_6px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.01] dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)] dark:hover:border-white/20 dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.3)] dark:focus-visible:ring-white/50"
            >
              Sign In
            </Link>

            <Link
              href="/subjects"
              className="rounded-xl bg-[#1D4ED8] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.01] hover:bg-[#1E40AF] hover:shadow active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:bg-white dark:text-[#0B1528] dark:hover:bg-[#F4F5F7] dark:focus-visible:ring-white/50"
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
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#091A40]/95 md:hidden"
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
                        ? "bg-black/5 text-foreground dark:bg-white/5 dark:text-white"
                        : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:text-[#AFC8FF] dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-6 flex flex-col gap-3 border-t border-border/50 pt-6 dark:border-white/10">
                <button
                  onClick={() =>
                    setTheme(currentTheme === "dark" ? "light" : "dark")
                  }
                  aria-label="Toggle theme"
                  className="flex w-full items-center justify-between rounded-xl p-3 text-base font-medium text-foreground transition-colors hover:bg-black/5 dark:text-white/90 dark:hover:bg-white/10"
                >
                  <span>Theme</span>
                  {mounted && (
                    <div className="flex h-[34px] w-[68px] items-center overflow-hidden rounded-full border border-black/20 bg-transparent dark:border-white/25">
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
                  className="w-full rounded-xl border border-black/20 px-4 py-3 text-center text-[15px] font-semibold text-foreground transition-all duration-200 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:border-white/25 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/50"
                >
                  Sign In
                </Link>

                <Link
                  href="/subjects"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl bg-[#1D4ED8] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-sm transition-all duration-250 hover:bg-[#1E40AF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:bg-white dark:text-[#0B1528] dark:hover:bg-[#F4F5F7] dark:focus-visible:ring-white/50"
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
