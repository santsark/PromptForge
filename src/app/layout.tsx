import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PromptForge — AI Prompt Engineering",
  description: "Enterprise-grade prompt management. Generate, compare, and rank AI prompts across Gemini, Claude, and DeepSeek using proven frameworks.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider session={session}>
            {children}
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
