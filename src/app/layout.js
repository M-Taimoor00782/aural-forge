import {
  Saira,
  Montserrat,
  Inter,
} from "next/font/google";

import "./globals.css";

/*
 * Aural Forge — Locked Typography
 *
 * Headings: Saira
 * Body: Montserrat
 * Buttons / CTA: Inter
 *
 * Variable fonts allow multiple weights
 * without importing separate font files
 * for each weight.
 */

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-af-heading",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-af-body",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-af-button",
  display: "swap",
});

export const metadata = {
  title: "Aural Forge | Sound, Sculpted.",
  description:
    "Explore premium personal audio through the immersive Aural Forge 3D product experience.",
};

export default function RootLayout({
  children,
}) {
  return (
    <html
      lang="en"
      className={[
        saira.variable,
        montserrat.variable,
        inter.variable,
      ].join(" ")}
    >
      <body>{children}</body>
    </html>
  );
}
