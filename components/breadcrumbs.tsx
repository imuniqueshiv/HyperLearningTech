"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathNames = pathname.split("/").filter((path) => path);
  const isWorkspaceFocusRoute = /^\/rgpv\/[^/]+\/[^/]+\/[^/]+\/ai$/.test(
    pathname
  );

  if (isWorkspaceFocusRoute) {
    return null;
  }

  if (pathNames.length <= 1) {
    return null;
  }

  return (
    <div
      className={`mx-auto w-full ${isWorkspaceFocusRoute ? "max-w-[1500px] px-4 sm:px-4 lg:px-6" : "max-w-7xl px-6 lg:px-8"}`}
    >
      <nav
        aria-label="breadcrumb"
        className={isWorkspaceFocusRoute ? "py-2" : "py-4"}
      >
        <ol
          className={`flex flex-wrap items-center gap-1.5 text-muted-foreground ${isWorkspaceFocusRoute ? "text-xs" : "text-sm"}`}
        >
          <li>
            <Link
              href="/"
              className="flex items-center transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="Home"
            >
              <Home
                className={isWorkspaceFocusRoute ? "h-3.5 w-3.5" : "h-4 w-4"}
              />
            </Link>
          </li>
          {pathNames.length > 0 && (
            <ChevronRight
              className={isWorkspaceFocusRoute ? "h-3.5 w-3.5" : "h-4 w-4"}
            />
          )}
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
                    <ChevronRight
                      className={
                        isWorkspaceFocusRoute ? "h-3.5 w-3.5" : "h-4 w-4"
                      }
                    />
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
