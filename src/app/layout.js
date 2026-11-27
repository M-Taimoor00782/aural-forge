import localFont from "next/font/local";
import { Inter } from "next/font/google";

import "./globals.css";

/*
 * AURAL FORGE — ROOT LAYOUT
 *
 * Locked typography:
 * Pattanakarn Medium is used for headings and controls. Inter is used for body text.
 *
 * Global theme:
 * Dark / Light
 *
 * The global UI theme is independent from
 * product-family and product-variant worlds.
 */

const pattanakarn = localFont({
  src: "../../public/Font/fonnts.com-Pattanakarn_Medium.ttf",
  weight: "500",
  style: "normal",
  display: "swap",
  variable: "--font-af-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-af-body",
  display: "swap",
});

/*
 * Shared storage key.
 *
 * The future header theme toggle must use
 * this exact key when saving the selection.
 */

const THEME_STORAGE_KEY =
  "aural-forge-theme";

/*
 * Restore the selected theme before
 * React hydrates the page.
 *
 * Default: dark
 *
 * Invalid values fall back to dark.
 * Storage errors do not prevent rendering.
 *
 * The script only controls data-af-theme.
 * It never changes product-world variables.
 */

const themeBootstrap = `
(function () {
  var theme = "dark";

  try {
    var stored = window.localStorage.getItem(
      "${THEME_STORAGE_KEY}"
    );

    if (stored === "light" || stored === "dark") {
      theme = stored;
    }
  } catch (error) {
    theme = "dark";
  }

  document.documentElement.setAttribute(
    "data-af-theme",
    theme
  );
})();
`;

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
      data-af-theme="dark"
      suppressHydrationWarning
      className={[
        pattanakarn.variable,
        inter.variable,
      ].join(" ")}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrap,
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
