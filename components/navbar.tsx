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
  Mail,
  BookOpen,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { useRouter, usePathname } from "next/navigation";
import { universities } from "../features/landing/universities";
import { toast } from "sonner";

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
    icon: Mail,
  },
  {
    label: "About",
    href: "/about",
    icon: BookOpen,
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = mounted ? resolvedTheme : theme;
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>("/#Home");
  const isClickScrolling = useRef(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    window.dispatchEvent(
      new CustomEvent("university-search", { detail: value })
    );
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const element = document.getElementById("Universities");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push("/#Universities");
      }
      setIsOpen(false);
    }
  };

  const filteredUniversities = universities.filter((uni) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return false;
    return (
      uni.name.toLowerCase().includes(query) ||
      uni.fullName.toLowerCase().includes(query) ||
      uni.description.toLowerCase().includes(query) ||
      uni.branches.some((branch) => branch.toLowerCase().includes(query))
    );
  });

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
      className={`sticky top-0 z-50 transition-all duration-500 border-b border-black/10 dark:border-white/10 relative overflow-hidden ${
        scrolled
          ? "bg-[#0D33A6]/85 dark:bg-[#0D33A6]/75 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#0D33A6]/70 dark:supports-[backdrop-filter]:bg-[#0D33A6]/50"
          : "bg-[linear-gradient(90deg,#0E1736_0%,#081E6E_25%,#0D33A6_50%,#1153C4_75%,#006BDE_100%)]"
      }`}
    >
      {/* glow */}
      <div className="absolute -top-20 left-[55%] w-72 h-72 rounded-full bg-blue-500/30 blur-[60px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between gap-6 md:h-[72px]">
          {/* Left Side: Logo & Search */}
          <div className="flex flex-1 items-center gap-6 lg:gap-10">
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

            {/* Search Bar */}
            <div className="hidden max-w-md flex-1 items-center relative md:flex">
              <Search className="absolute left-3.5 h-[18px] w-[18px] text-white/50" />
              <input
                type="text"
                placeholder="Search universities..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-full border border-white/10 bg-black/20 py-2 pl-10 pr-4 text-[14px] text-white placeholder-white/50 outline-none transition-all focus:border-white/30 focus:bg-black/40 focus:ring-1 focus:ring-white/30"
              />

              {/* Desktop Search Dropdown */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B1528] z-[60]"
                  >
                    {filteredUniversities.length > 0 ? (
                      <div className="flex max-h-[300px] flex-col overflow-y-auto p-2">
                        {filteredUniversities.map((uni) => (
                          <button
                            key={uni.id}
                            onClick={() => {
                              setSearchQuery("");
                              window.dispatchEvent(
                                new CustomEvent("university-search", {
                                  detail: "",
                                })
                              );
                              if (uni.status === "Available") {
                                router.push(uni.href);
                              } else {
                                toast.info(`${uni.name} is coming soon!`, {
                                  description:
                                    "We are actively working on adding support for this university.",
                                });
                                if (pathname !== "/") {
                                  router.push("/#Universities");
                                } else {
                                  const element =
                                    document.getElementById("Universities");
                                  if (element)
                                    element.scrollIntoView({
                                      behavior: "smooth",
                                    });
                                }
                              }
                            }}
                            className="flex flex-col items-start rounded-lg p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <span className="text-[14px] font-semibold text-foreground dark:text-white">
                              {uni.name} - {uni.fullName}
                            </span>
                            <span className="mt-1 text-[12px] text-muted-foreground dark:text-white/60">
                              {uni.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground dark:text-white/60">
                        No universities found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center-Right: Desktop Navigation */}
          <div className="hidden items-center md:flex lg:gap-8 gap-4">
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive =
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeSection === link.href) ||
                  (pathname === link.href && !link.href.startsWith("/#"));

                const Icon = link.icon;

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="group relative flex flex-col items-center justify-center gap-1.5 outline-none"
                  >
                    <Icon
                      className={`transition-all duration-300 ${
                        link.label === "Contact"
                          ? "h-[19px] w-[19px]"
                          : "h-[22px] w-[22px]"
                      } ${
                        isActive
                          ? "text-white"
                          : "text-white/75 group-hover:text-white group-hover:scale-110"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={`text-[12px] font-semibold tracking-wide transition-colors duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-white/80 group-hover:text-white"
                      }`}
                    >
                      {link.label}
                    </span>

                    {/* Active Indicator Line (Premium Clean Style) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeMinimalLine"
                        className="absolute -bottom-[12px] h-[3px] w-full rounded-t-full bg-white shadow-[0_-1px_2px_rgba(255,255,255,0.1)]"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            {mounted && (
              <button
                onClick={() =>
                  setTheme(currentTheme === "dark" ? "light" : "dark")
                }
                aria-label="Toggle theme"
                className="flex h-[36px] w-[36px] items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:border-white/15 dark:bg-black/20 dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] dark:hover:border-white/25 dark:focus-visible:ring-white/50"
              >
                {currentTheme !== "dark" ? (
                  <Sun
                    strokeWidth={2.5}
                    className="h-[18px] w-[18px] text-amber-600 drop-shadow-sm"
                  />
                ) : (
                  <Moon
                    strokeWidth={2.5}
                    className="h-[18px] w-[18px] text-white drop-shadow-sm"
                  />
                )}
              </button>
            )}

            <Link
              href="/sign-in"
              className="flex h-[36px] items-center justify-center rounded-[18px] border border-black/10 bg-gradient-to-b from-black/[0.01] to-black/[0.05] px-6 text-[14px] font-semibold text-white shadow-[inset_0_1px_0px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-[0.5px] hover:border-black/20 hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.8),0_2px_6px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.01] dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)] dark:hover:border-white/20 dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.3)] dark:focus-visible:ring-white/50"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Actions (Search & Menu) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Search Icon */}
            <button
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                setIsOpen(false); // Close menu if search is opened
              }}
              aria-label="Toggle mobile search"
              className="rounded-xl p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsOpen(!isOpen);
                setIsMobileSearchOpen(false); // Close search if menu is opened
              }}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="rounded-xl p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:focus-visible:ring-white/50"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Drawer */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#091A40]/95 md:hidden"
          >
            <div className="px-6 py-4 relative z-50">
              <div className="relative">
                <Search className="absolute left-3.5 h-[18px] w-[18px] top-1/2 -translate-y-1/2 text-muted-foreground/70 dark:text-white/50" />
                <input
                  type="text"
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full rounded-full border border-black/10 bg-black/5 py-2.5 pl-10 pr-4 text-[14px] text-foreground placeholder-muted-foreground/70 outline-none transition-all focus:border-blue-500/50 focus:bg-background focus:ring-1 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder-white/50 dark:focus:border-white/30 dark:focus:bg-black/40"
                  autoFocus
                />

                {/* Mobile Search Dropdown */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0B1528]"
                    >
                      {filteredUniversities.length > 0 ? (
                        <div className="flex max-h-[300px] flex-col overflow-y-auto p-2">
                          {filteredUniversities.map((uni) => (
                            <button
                              key={uni.id}
                              onClick={() => {
                                setSearchQuery("");
                                setIsMobileSearchOpen(false);
                                window.dispatchEvent(
                                  new CustomEvent("university-search", {
                                    detail: "",
                                  })
                                );
                                if (uni.status === "Available") {
                                  router.push(uni.href);
                                } else {
                                  toast.info(`${uni.name} is coming soon!`, {
                                    description:
                                      "We are actively working on adding support for this university.",
                                  });
                                  if (pathname !== "/") {
                                    router.push("/#Universities");
                                  } else {
                                    const element =
                                      document.getElementById("Universities");
                                    if (element)
                                      element.scrollIntoView({
                                        behavior: "smooth",
                                      });
                                  }
                                }
                              }}
                              className="flex flex-col items-start rounded-lg p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <span className="text-[14px] font-semibold text-foreground dark:text-white">
                                {uni.name} - {uni.fullName}
                              </span>
                              <span className="mt-1 text-[12px] text-muted-foreground dark:text-white/60">
                                {uni.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground dark:text-white/60">
                          No universities found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="overflow-hidden border-t border-black/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#091A40]/95 md:hidden"
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
                        ? "bg-slate-100 text-slate-900 dark:bg-white/5 dark:text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-[#AFC8FF] dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-6 dark:border-white/10">
                <button
                  onClick={() =>
                    setTheme(currentTheme === "dark" ? "light" : "dark")
                  }
                  aria-label="Toggle theme"
                  className="flex w-full items-center justify-between rounded-xl p-3 text-base font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:text-white/90 dark:hover:bg-white/10"
                >
                  <span>Theme</span>
                  {mounted && (
                    <div className="flex h-[34px] w-[68px] items-center overflow-hidden rounded-xl border border-black/10 bg-transparent dark:border-white/25">
                      <div
                        className={`flex h-full w-1/2 items-center justify-center transition-colors ${currentTheme !== "dark" ? "bg-black/5 dark:bg-white/20" : ""}`}
                      >
                        <Sun
                          strokeWidth={2.5}
                          className={`h-[15px] w-[15px] ${currentTheme !== "dark" ? "text-amber-600" : "text-slate-400 dark:text-white/60"}`}
                        />
                      </div>
                      <div
                        className={`flex h-full w-1/2 items-center justify-center transition-colors ${currentTheme === "dark" ? "bg-black/10 dark:bg-white/20" : ""}`}
                      >
                        <Moon
                          strokeWidth={2.5}
                          className={`h-[15px] w-[15px] ${currentTheme === "dark" ? "text-white" : "text-slate-400 dark:text-white/60"}`}
                        />
                      </div>
                    </div>
                  )}
                </button>

                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-black/15 px-4 py-3 text-center text-[15px] font-semibold text-slate-900 transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/50 dark:border-white/25 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/50"
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
