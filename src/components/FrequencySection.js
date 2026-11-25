import Image from "next/image";
import Link from "next/link";
import { getProductFinishImage } from "@/config/productFamilies";
import styles from "./SiteClosingSections.module.css";

const CARDS = [
  {
    family: "Headphones",
    id: "headphones",
    finish: "signature-red",
    title: "Listen a little closer.",
    description: "Soft cushions and sculpted earcups set the scene for a more deliberate listen.",
  },
  {
    family: "Wireless Earbuds",
    id: "earbuds",
    finish: "ice-silver",
    title: "Take sound with you.",
    description: "Two earbuds and a compact charging case fit into the rhythm of a day on the move.",
  },
  {
    family: "Smartwatch",
    id: "product-03",
    finish: "burnished-copper",
    title: "Make time your own.",
    description: "A clear dial and curved strap bring a little character to everyday moments.",
  },
];

export default function FrequencySection({ onFamilySelect }) {
  return (
    <section id="frequency" className={styles.frequency} aria-labelledby="frequency-heading">
      <div className="af-container">
        <div className={styles.frequencyIntro}>
          <h2 id="frequency-heading" className={styles.editorialHeading}>Find Your Frequency.</h2>
          <p>Three different forms for the way you listen, move, and spend your time.</p>
        </div>
        <ul className={styles.frequencyStack}>
          {CARDS.map(card => (
            <li key={card.id}>
              <article className={styles.frequencyCard} data-family={card.id}>
                <div className={styles.frequencyCopy}>
                  <p className={styles.eyebrow}>{card.family}</p>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <Link href={`/?family=${card.id}#hero`} onNavigate={event => {
                    event.preventDefault();
                    onFamilySelect(card.id);
                  }}>
                    Explore {card.family}
                  </Link>
                </div>
                <div className={styles.frequencyArtwork}>
                  <Image src={getProductFinishImage(card.id, card.finish)} alt=""
                    width={260} height={260} unoptimized />
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

