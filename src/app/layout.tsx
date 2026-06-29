import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "briefly — AI summaries for the articles you save",
    template: "%s · briefly",
  },
  description:
    "Paste a URL, get a 3-sentence TL;DR, key points, and tags. Powered by Claude.",
  openGraph: {
    title: "briefly — The shorter way to read the web.",
    description:
      "Paste any article. Get a 3-sentence TL;DR, 5 key points, and tags — powered by Claude.",
    type: "website",
    url: siteUrl,
    siteName: "briefly",
  },
  twitter: {
    card: "summary_large_image",
    title: "briefly — The shorter way to read the web.",
    description:
      "Paste any article. Get a 3-sentence TL;DR, 5 key points, and tags — powered by Claude.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full font-sans antialiased", inter.variable, jetbrainsMono.variable)}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
