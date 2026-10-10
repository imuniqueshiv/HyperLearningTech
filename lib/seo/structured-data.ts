import {
  SITE_ALTERNATE_NAMES,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_ORIGIN,
  absoluteUrl,
} from "@/lib/seo/site";

export function getHomeStructuredData() {
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: absoluteUrl("/"),
        logo: absoluteUrl(SITE_LOGO_PATH),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: absoluteUrl("/"),
        publisher: {
          "@id": organizationId,
        },
        inLanguage: "en",
      },
    ],
  };
}
