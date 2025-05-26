import StructuredData from '@/components/StructuredData';
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://focusmnn.vercel.app'), // Update with your actual domain
  title: {
    default: "Focus0 - YouTube Study Tool | Distraction-Free Learning",
    template: "%s | Focus0"
  },
  description: "Transform YouTube into a laser-focused study tool with distraction-free video experience, focus tracking, and Pomodoro timer integration. Perfect for students, professionals, and lifelong learners.",
  keywords: [
    "study tool", "youtube study", "focus app", "pomodoro timer", 
    "productivity", "education", "learning", "distraction-free", 
    "video learning", "study sessions", "time management", "concentration",
    "educational technology", "student productivity", "online learning"
  ],
  authors: [{ name: "devmnn", url: "https://github.com/manan0209" }],
  creator: "devmnn",
  publisher: "Focus0",
  category: "Education Technology",
  classification: "Education, Productivity, Study Tools",
  
  // Open Graph for social media sharing
  openGraph: {
    title: "Focus0 - YouTube Study Tool | Distraction-Free Learning",
    description: "Transform YouTube into a laser-focused study tool with distraction-free video experience, focus tracking, and Pomodoro timer integration.",
    type: "website",
    locale: "en_US",
    url: "https://focusmnn.vercel.app",
    siteName: "Focus0",
    images: [
      {
        url: "/favicon/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Focus0 - YouTube Study Tool Logo"
      }
    ]
  },
  
  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Focus0 - YouTube Study Tool | Distraction-Free Learning",
    description: "Transform YouTube into a laser-focused study tool with distraction-free video experience, focus tracking, and Pomodoro timer integration.",
    creator: "@devmnn",
    images: ["/favicon/web-app-manifest-512x512.png"]
  },
  
  // Search engine directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Additional SEO metadata
  alternates: {
    canonical: "https://focusmnn.vercel.app",
  },
  
  // App-specific metadata
  applicationName: "Focus0",
  referrer: "origin-when-cross-origin",
  
  // Apple-specific metadata
  appleWebApp: {
    capable: true,
    title: "Focus0",
    statusBarStyle: "black-translucent",
  },
  
  // Verification (add your verification codes when available)
  verification: {
    // google: "your-google-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" href="/favicon/web-app-manifest-192x192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon/web-app-manifest-512x512.png" sizes="512x512" type="image/png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
