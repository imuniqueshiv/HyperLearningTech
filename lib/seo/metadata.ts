import type { Metadata } from "next";

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  absoluteUrl,
} from "@/lib/seo/site";

type BuildPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  index?: boolean;
  follow?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  index = true,
  follow = true,
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const resolvedTitle = absoluteTitle
    ? { absolute: title }
    : title;

  return {
    title: resolvedTitle,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index,
      follow,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: SITE_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OG_IMAGE_PATH],
    },
  };
}

export function formatSemesterLabel(semester: string): string {
  const match = semester.match(/semester-(\d+)/i);
  if (match) {
    return `Semester ${match[1]}`;
  }
  return semester
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function defaultPublicDescription(topic: string): string {
  return `${topic} on ${SITE_NAME}. ${SITE_DESCRIPTION}`;
}
