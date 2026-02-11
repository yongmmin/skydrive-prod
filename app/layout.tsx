import type { Metadata } from "next";
import { Bungee, Nunito, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "./components/ToastProvider";
import PageTransition from "./components/PageTransition";

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SkyDrive",
    template: "%s | SkyDrive",
  },
  description: "Arcade sky-flight game with live leaderboard.",
  icons: {
    icon: "/planes/plane-red.png",
    shortcut: "/planes/plane-red.png",
    apple: "/planes/plane-red.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "SkyDrive",
    description: "Arcade sky-flight game with live leaderboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyDrive",
    description: "Arcade sky-flight game with live leaderboard.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const shouldLoadAdsense = process.env.NODE_ENV === "production" && Boolean(adsenseClient);

  return (
    <html
      lang="en"
      className={`${bungee.variable} ${nunito.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-sky-50 text-slate-900 antialiased">
        {shouldLoadAdsense && (
          <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(191,231,255,0.8),_transparent_55%),radial-gradient(circle_at_20%_60%,_rgba(255,218,189,0.7),_transparent_50%),linear-gradient(180deg,_#f7fbff_0%,_#eaf4ff_45%,_#fdf4f1_100%)]" />
        <ToastProvider>
          <PageTransition>{children}</PageTransition>
        </ToastProvider>
      </body>
    </html>
  );
}
