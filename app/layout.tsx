import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hyperlearningtech.in"),

  title: {
    default: "Hyper Learning",
    template: "%s | Hyper Learning",
  },

  description:
    "Hyper Learning is an AI-powered engineering learning platform that helps students learn smarter through syllabus mapping, AI-generated explanations, previous year question analysis, and exam-focused preparation.",

  applicationName: "Hyper Learning",

  keywords: [
    "Hyper Learning",
    "Engineering Notes",
    "RGPV",
    "AI Learning Platform",
    "Previous Year Questions",
    "Engineering Education",
    "Semester Notes",
    "Exam Preparation",
    "AI Tutor",
    "HyperLearningTech",
  ],

  authors: [
    {
      name: "Shiv Raj Singh",
      url: "https://www.hyperlearningtech.in",
    },
  ],

  creator: "Shiv Raj Singh",

  publisher: "Hyper Learning",

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
    title: "Hyper Learning",
    description:
      "AI-powered engineering learning platform for syllabus-driven learning and exam preparation.",
    url: "https://www.hyperlearningtech.in",
    siteName: "Hyper Learning",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/HL-social-share-image.png",
        width: 1200,
        height: 630,
        alt: "Hyper Learning",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Hyper Learning",
    description: "AI-powered engineering learning platform for students.",
    images: ["/HL-social-share-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="flex min-h-[100dvh] flex-col overflow-x-hidden"
        suppressHydrationWarning
      >
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
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <Toaster richColors closeButton position="top-center" offset={72} />
        </ThemeProvider>
      </body>
    </html>
  );
}
