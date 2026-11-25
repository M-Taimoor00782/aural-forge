import Link from "next/link";
import { CONTACT } from "@/config/policies";
import PremiumHeader from "./PremiumHeader";
import SiteFooter from "./SiteFooter";
import ExperienceCursor from "./ExperienceCursor";
import styles from "./PolicyPage.module.css";

export default function PolicyPage({ policy }) {
  return (
    <>
      <PremiumHeader />
      <main id="policy-content" className={`af-container ${styles.main}`} aria-labelledby="policy-title">
        <article className={styles.article}>
          <div className={styles.intro}>
            <Link href="/" className={styles.back}>Back to Aural Forge</Link>
            <p className={styles.eyebrow}>Portfolio information</p>
            <h1 id="policy-title">{policy.title}</h1>
            <p className={styles.lead}>{policy.intro}</p>
          </div>
          {policy.sections.map(({ title, text }) => (
            <section className={styles.section} key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          <section className={styles.contact} aria-labelledby="policy-contact-heading">
            <h2 id="policy-contact-heading">Questions about Aural Forge?</h2>
            <ul>
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li><a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a></li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter activePolicy={policy.slug} />
      <ExperienceCursor />
    </>
  );
}

