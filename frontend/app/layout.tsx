import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import type { ReactNode } from "react";
import { SpaceBackground } from "@/components/layout/SpaceBackground";
import { Providers } from "./providers";
import "./globals.css";

const displayFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Pixelify_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rota 404",
    template: "%s | Rota 404",
  },
  description: "Rota 404: explore o universo da tecnologia a bordo de um foguete, com o Bonzi Buddy como co-piloto.",
  applicationName: "Rota 404",
};

export const viewport: Viewport = {
  themeColor: "#070716",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <SpaceBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
