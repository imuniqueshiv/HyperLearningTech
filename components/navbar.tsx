"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

const navLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Universities",
    href: "/universities",
  },
  {
    label: "Subjects",
    href: "/subjects",
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#00008B]/20 bg-[#00008B]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#00008B]/80">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90"
          >
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src="/hl-logo.png"
                alt="Hyper Learning Official Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#F4F5F7]">
                Hyper Learning
              </h1>

              <p className="text-xs text-[#AFC8FF]">
                AI-Powered Learning Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[15px] font-medium text-[#AFC8FF] transition-all duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="relative flex h-10 w-10 items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:text-[#AFC8FF]"
            >
              {mounted &&
                (theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                ))}
            </button>

            <Link
              href="/sign-in"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-[#F4F5F7] transition-all duration-200 hover:border-white/40 hover:bg-white/10"
            >
              Sign In
            </Link>

            <Link
              href="/subjects"
              className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-[#00008B] shadow-sm transition-all duration-200 hover:bg-slate-100"
            >
              Start Learning
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="overflow-hidden border-t border-white/10 bg-[#00008B]/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-2 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[#AFC8FF] transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-4 flex flex-col gap-3">
                {/* Mobile Theme Toggle - Icon Only */}
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-[#F4F5F7] transition-all duration-200 hover:bg-white/10"
                >
                  {mounted &&
                    (theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    ))}
                </button>

                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-white/20 px-4 py-3 text-center text-[#F4F5F7]"
                >
                  Sign In
                </Link>

                <Link
                  href="/subjects"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-white px-4 py-3 text-center font-semibold text-[#00008B]"
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
