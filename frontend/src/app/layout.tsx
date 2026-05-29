import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TalentMatch AI – Resume Screening & Candidate Ranking",
    template: "%s | TalentMatch AI",
  },
  description:
    "AI-powered resume screening and candidate ranking platform for modern recruiters. Upload resumes, analyze with AI, rank candidates automatically.",
  keywords: [
    "ATS", "resume screening", "candidate ranking", "AI recruitment",
    "applicant tracking", "talent matching", "HR tech",
  ],
  authors: [{ name: "TalentMatch AI" }],
  creator: "TalentMatch AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://talentmatch.ai",
    title: "TalentMatch AI – Intelligent Resume Screening",
    description: "AI-powered resume screening and candidate ranking for recruiters",
    siteName: "TalentMatch AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "TalentMatch AI",
    description: "AI-powered resume screening and candidate ranking",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: "14px",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
