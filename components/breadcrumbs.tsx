"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathNames = pathname.split("/").filter((path) => path);

  if (pathNames.length <= 1) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
      <nav aria-label="breadcrumb" className="py-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="flex items-center transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
          {pathNames.length > 0 && <ChevronRight className="h-4 w-4" />}
          {pathNames.map((link, index) => {
            const href = `/${pathNames.slice(0, index + 1).join("/")}`;
            const isLast = index === pathNames.length - 1;
            const label = decodeURIComponent(link)
              .replace(/-/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase());

            return (
              <li key={href} className="flex items-center gap-1.5">
                {isLast ? (
                  <span
                    className="font-medium text-foreground"
                    aria-current="page"
                  >
                    {label}
                  </span>
                ) : (
                  <>
                    <Link
                      href={href}
                      className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      {label}
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
