export const SITE_ORIGIN = "https://www.hyperlearningtech.in";

export const SITE_NAME = "HyperLearningTech";

export const SITE_ALTERNATE_NAMES = [
  "Hyper Learning Tech",
  "hyperlearningtech.in",
] as const;

export const SITE_TITLE =
  "HyperLearningTech — RGPV B.Tech Previous Year Questions with AI Solutions & Personalized AI Learning";

export const SITE_DESCRIPTION =
  "AI-powered RGPV B.Tech learning with syllabus-mapped subjects, previous year question papers and AI-powered study tools.";

export const SITE_LOGO_PATH = "/hl-logo.png";

export const SITE_OG_IMAGE_PATH = "/HL-social-share-image.png";

export function absoluteUrl(pathname = "/"): string {
  if (!pathname || pathname === "/") {
    return `${SITE_ORIGIN}/`;
  }

  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_ORIGIN}${normalized}`;
}
