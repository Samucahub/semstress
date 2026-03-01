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
  title: "Cromometro — Gestão de Estágios",
  description: "Plataforma de gestão de tempo e tarefas para estágios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      {/* <!-- TODO: remover antes de produção - painel de debug em /antixerox-secret --> */}
      <head>
        <meta name="generator" content="cromometro-v2.1.4-dev" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <div
          data-debug-info="/antixerox-secret"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </body>
    </html>
  );
}
