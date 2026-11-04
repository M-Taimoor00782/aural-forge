import {
  Saira,
  Montserrat,
  Inter,
} from "next/font/google";

import "./globals.css";

/*
 * AURAL FORGE — ROOT LAYOUT
 *
 * Locked typography:
 * Headings — Saira
 * Body     — Montserrat
 * Buttons  — Inter
 *
 * Global theme:
 * Dark / Light
 *
 * The global UI theme is independent from
 * product-family and product-variant worlds.
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
        saira.variable,
        montserrat.variable,
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
