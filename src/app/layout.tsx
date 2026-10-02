import type { Metadata } from "next";
import { Inter, Calistoga, JetBrains_Mono, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import NavigationProgressBar from "@/components/ui/NavigationProgressBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const calistoga = Calistoga({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-calistoga",
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  preload: false,
});

export const metadata: Metadata = {
  title: "LeadFlow | WhatsApp AI Automation Dashboard",
  description: "Automate WhatsApp conversations with AI. Manage leads, train your AI brain, and handle customer inquiries — all from one dashboard.",
  icons: {
    icon: "/Logo.png",
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${calistoga.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans min-h-full flex flex-col`}
      >
        <NavigationProgressBar />
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
