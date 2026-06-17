"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
<Link
  href="/"
  className="flex items-center gap-3 transition-opacity hover:opacity-90"
>
  <Image
    src="/hl-logo.png"
    alt="Hyper Learning Logo"
    width={48}
    height={48}
    priority
    className="rounded-xl"
  />

  <div>
    <h1 className="text-lg font-bold text-white">
      Hyper Learning
    </h1>

    <p className="text-xs text-slate-500">
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
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/sign-in"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Sign In
            </Link>

            <Link
              href="/subjects"
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Start Learning
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-900 md:hidden"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
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
            className="overflow-hidden border-t border-slate-800 bg-black md:hidden"
          >
            <div className="space-y-2 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-4 py-3 text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-center text-slate-300"
                >
                  Sign In
                </Link>

                <Link
                  href="/subjects"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-center font-medium text-white"
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