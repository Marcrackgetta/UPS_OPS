import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "../components/AudioProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kawsay Eco-Dash",
  description:
    "Plataforma web interactiva de monitoreo ambiental y bienestar estudiantil alineada a los ODS 3, 4 y 13 — Concurso Intercolegial Multimedia Teens 2026 (UPS).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
