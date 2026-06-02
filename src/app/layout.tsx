import type { Metadata } from "next";
import { Inter, Calistoga, JetBrains_Mono, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const calistoga = Calistoga({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-calistoga",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LeadFlow | WhatsApp AI Automation Dashboard",
  description: "Automate WhatsApp conversations with AI. Manage leads, train your AI brain, and handle customer inquiries — all from one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${calistoga.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans min-h-full flex flex-col`}
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
