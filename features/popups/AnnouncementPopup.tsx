"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface AnnouncementPopupProps {
  imageSrc: string;
  imageAlt?: string;
  registrationUrl: string;

  delayMs?: number;
  deadlineText?: string;
  buttonText?: string;

  enabled?: boolean;
  maxWidth?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Accept only absolute HTTPS URLs without embedded credentials.
 * This prevents unsafe schemes such as javascript: and data:.
 */
function getSafeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────

export default function AnnouncementPopup({
  imageSrc,
  imageAlt = "Announcement poster",
  registrationUrl,
  delayMs = 800,
  deadlineText,
  buttonText = "Register Now",
  enabled = true,
  maxWidth = 440,
}: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const dialogId = useId();
  const prefersReducedMotion = useReducedMotion();

  const safeRegistrationUrl = getSafeHttpsUrl(registrationUrl);

  const safeDelay = Number.isFinite(delayMs) ? Math.max(0, delayMs) : 800;

  const safeMaxWidth = Number.isFinite(maxWidth)
    ? Math.min(720, Math.max(280, maxWidth))
    : 440;

  // ─── Schedule popup ───────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) {
      // Defer the state update to avoid synchronous setState in an effect.
      const timer = window.setTimeout(() => {
        setIsOpen(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, safeDelay);

    return () => window.clearTimeout(timer);
  }, [enabled, safeDelay]);

  // ─── Close popup ──────────────────────────────────────────────────────

  const closePopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ─── Keyboard accessibility and focus management ─────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    previousFocusRef.current = previouslyFocused;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const getFocusableElements = (): HTMLElement[] => {
      const dialog = dialogRef.current;

      if (!dialog) return [];

      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(",")
        )
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !dialog.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (
        activeElement === lastElement ||
        !dialog.contains(activeElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = previousOverflow;

      // Restore focus only when the previous element still exists.
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }

      previousFocusRef.current = null;
    };
  }, [isOpen, closePopup]);

  // ─── Disabled state ───────────────────────────────────────────────────

  if (!enabled) return null;

  // ─── Animation settings ───────────────────────────────────────────────

  const animationDuration = prefersReducedMotion ? 0 : 0.25;

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: animationDuration,
            ease: "easeOut",
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePopup();
            }
          }}
        >
          {/* ─── Dialog ─────────────────────────────────────────────── */}

          <motion.div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative flex max-h-[94dvh] w-full flex-col items-center overflow-y-auto overscroll-contain rounded-[18px] border border-white/15 bg-white p-2.5 shadow-[0_24px_100px_rgba(0,0,0,0.4)] outline-none dark:bg-[#080f25] sm:rounded-[22px] sm:p-3"
            style={{ maxWidth: `${safeMaxWidth}px` }}
            initial={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : 0.96,
              y: prefersReducedMotion ? 0 : 16,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : 0.97,
              y: prefersReducedMotion ? 0 : 10,
            }}
            transition={{
              duration: animationDuration,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Accessible dialog title */}

            <h2 id={titleId} className="sr-only">
              {imageAlt}
            </h2>

            {/* ─── Close button ─────────────────────────────────────── */}

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closePopup}
              aria-label="Close announcement"
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-md backdrop-blur-md transition-all duration-200 hover:rotate-90 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X
                className="h-[18px] w-[18px]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

            {/* ─── Poster ───────────────────────────────────────────── */}

            {safeRegistrationUrl ? (
              <a
                href={safeRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open hackathon registration website"
                className="block w-full overflow-hidden rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={1088}
                  height={1360}
                  priority
                  sizes="(max-width: 480px) 94vw, 440px"
                  className="mx-auto block h-auto w-auto max-w-full max-h-[calc(94dvh-150px)] object-contain"
                />
              </a>
            ) : (
              <div className="w-full overflow-hidden rounded-[12px]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={1088}
                  height={1360}
                  priority
                  sizes="(max-width: 480px) 94vw, 440px"
                  className="mx-auto block h-auto w-auto max-w-full max-h-[calc(94dvh-150px)] object-contain"
                />
              </div>
            )}

            {/* ─── Registration action ──────────────────────────────── */}

            {safeRegistrationUrl && (
              <a
                href={safeRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-orange-700 to-rose-700 px-5 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(194,65,12,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:from-orange-800 hover:to-rose-800 hover:shadow-[0_7px_20px_rgba(190,18,60,0.35)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <span>{buttonText}</span>

                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </a>
            )}

            {/* ─── Optional deadline ────────────────────────────────── */}

            {deadlineText && (
              <p className="mt-2 text-center text-[11px] font-medium tracking-[0.01em] text-slate-500 dark:text-slate-400">
                {deadlineText}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
