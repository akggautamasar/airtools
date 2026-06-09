import { Metadata } from "next";
import { Tool } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://airtools.app";
const SITE_NAME = "AirTools";
const SITE_DESCRIPTION =
  "All Your PDF, Image & Utility Tools in One Place. Compress, Convert, Edit and Optimize PDFs, Images and Files in Seconds.";

export function generateToolMetadata(tool: Tool): Metadata {
  const title = `${tool.name} - Free Online ${tool.name} Tool | AirTools`;
  const description = `${tool.description} Free, fast, and secure. No installation required.`;

  return {
    title,
    description,
    keywords: [tool.name, ...tool.tags, "free", "online", "tool"].join(", "),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tools/${tool.slug}`,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og/tools/${tool.slug}.png`,
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og/tools/${tool.slug}.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/tools/${tool.slug}`,
    },
  };
}

export function generatePageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}${path}`,
    },
  };
}

export const defaultMetadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Every Tool You Need. One Platform.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords:
    "PDF tools, image tools, compress PDF, merge PDF, convert images, online tools, free tools",
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Every Tool You Need. One Platform.`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Every Tool You Need. One Platform.`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};
