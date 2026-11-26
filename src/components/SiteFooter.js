"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CONTACT, POLICIES } from "@/config/policies";
import { HEADER_FAMILIES } from "./PremiumHeader";
import BrandLockup from "./BrandLockup";
import styles from "./SiteClosingSections.module.css";

const SOCIALS = [
  ["Instagram", "M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm6 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm6-1h.01"],
  ["TikTok", "M14 3v12.5a4.5 4.5 0 1 1-4.5-4.5M14 3c1 4 3.5 6 7 6"],
  ["Facebook", "M15 22v-9h3l.5-3H15V7.5c0-1 .4-1.5 1.5-1.5H19V3a16 16 0 0 0-2.5-.2C13.8 2.8 12 4.5 12 7v3H9v3h3v9"],
  ["LinkedIn", "M3 9v12M3 4h.01M9 21V9m0 5a5 5 0 0 1 10 0v7"],
];

const mobileQuery = "(max-width: 700px)";
function subscribeToMobile(onChange) {
  const media = matchMedia(mobileQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function FooterGroup({ id, title, mobile, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.footerGroup}>
      <h3 className={styles.footerHeading}>{title}</h3>
      <h3 className={styles.footerMobileHeading}>
        <button className={styles.disclosure} type="button" aria-expanded={open}
          aria-controls={id} onClick={() => setOpen(!open)}>
          {title}<span className={`af-chevron ${styles.chevron}`} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className={styles.footerPanel} inert={mobile && !open} data-open={open}>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function SiteFooter({ families = HEADER_FAMILIES, activeFamilyId, transitioning, onFamilySelect, activePolicy }) {
  const mobile = useSyncExternalStore(subscribeToMobile, () => matchMedia(mobileQuery).matches, () => false);

  return (
    <footer id="site-footer" className={styles.footer}>
      <div className={`af-container ${styles.footerGrid}`}>
        <div className={styles.footerBrand}>
          <Link href={onFamilySelect ? "#hero" : "/#hero"} aria-label="Aural Forge, back to the beginning">
            <BrandLockup />
          </Link>
          <p>Audio and wearables shaped by the details you see and feel.</p>
          <ul className={styles.socials} aria-label="Social profiles without verified links">
            {SOCIALS.map(([name, path]) => (
              <li key={name} title={`${name} profile unavailable`}>
                <svg viewBox="0 0 24 24" role="img" aria-label={name} fill="none"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path} />
                </svg>
              </li>
            ))}
          </ul>
        </div>

        <FooterGroup id="footer-legal" title="Legal" mobile={mobile}>
          <ul className={styles.linkList}>
            {POLICIES.map(({ slug, title }) => (
              <li key={slug}>
                <Link href={`/${slug}`} aria-current={activePolicy === slug ? "page" : undefined}>{title}</Link>
              </li>
            ))}
          </ul>
        </FooterGroup>

        <FooterGroup id="footer-products" title="Products" mobile={mobile}>
          <nav aria-label="Footer product navigation">
            <ul className={styles.linkList}>
              {families.map(({ id, label }) => (
                <li key={id}>
                  {onFamilySelect ? (
                    <button type="button" disabled={transitioning} aria-pressed={activeFamilyId === id}
                      onClick={() => onFamilySelect(id)}>{label}</button>
                  ) : <Link href={`/?family=${id}#hero`}>{label}</Link>}
                </li>
              ))}
            </ul>
          </nav>
        </FooterGroup>

        <FooterGroup id="footer-contact" title="Contact" mobile={mobile}>
          <ul className={`${styles.linkList} ${styles.contacts}`}>
            <li>
              <span>Email</span>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <span>Phone</span>
              <a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a>
            </li>
          </ul>
        </FooterGroup>
      </div>
      <div className={`af-container ${styles.footerBottom}`}>
        <span>© 2026 Aural Forge. Made by Muhammad Taimoor.</span>
        <span>A concept product experience.</span>
      </div>
    </footer>
  );
}

