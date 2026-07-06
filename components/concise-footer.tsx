import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Creators", href: "/creators" },
  { name: "Feedback", href: "/#Contact" },
];

export default function ConciseFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#D8E2F0] dark:border-white/[0.06] bg-[#F5F7FF] dark:bg-[#020617]">
      <div className="mx-auto max-w-[1280px] px-6 py-4">
        <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-4 lg:gap-y-2 lg:text-left">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 text-[12px] text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Image
              src="/hl-logo.png"
              alt="Hyper Learning"
              width={16}
              height={16}
              className="object-contain dark:brightness-[1.6]"
            />
            <span>© {year} Hyper Learning. All rights reserved.</span>
          </Link>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[12px] text-slate-500 transition-colors hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-500 lg:max-w-none">
            <span className="text-slate-600 dark:text-slate-400">
              Disclaimer:
            </span>{" "}
            Some content may contain errors. Please cross-check and share
            corrections via our feedback section.
          </p>
        </div>
      </div>
    </footer>
  );
}
