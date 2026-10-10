import "./globals.css";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalClerkProvider } from "@/components/providers/conditional-clerk-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  SITE_ORIGIN,
  SITE_TITLE,
  absoluteUrl,
} from "@/lib/seo/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),

  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "Hyper Learning Tech",
    "HyperLearningTech",
    "RGPV",
    "RGPV B.Tech",
    "Previous Year Questions",
    "Engineering Notes",
    "AI Learning Platform",
    "Syllabus",
    "Exam Preparation",
    "AI Tutor",
  ],

  authors: [
    {
      name: "Shiv Raj Singh",
      url: SITE_ORIGIN,
    },
  ],

  creator: "Shiv Raj Singh",

  publisher: SITE_NAME,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],

    apple: "/apple-touch-icon.png",

    shortcut: "/favicon.ico",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "en_US",
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-y-scroll" suppressHydrationWarning>
      <body className="flex min-h-[100dvh] flex-col" suppressHydrationWarning>
        <ConditionalClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:font-semibold"
            >
              Skip to content
            </a>
            <Navbar />
            <main
              id="main-content"
              className="flex min-h-0 flex-1 flex-col"
              tabIndex={-1}
            >
              {children}
            </main>
            <Footer />
            <Toaster richColors closeButton position="top-center" offset={72} />
          </ThemeProvider>
        </ConditionalClerkProvider>
      </body>
    </html>
  );
}
