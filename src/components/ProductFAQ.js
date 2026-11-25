"use client";

import { useRef, useState } from "react";
import styles from "./SiteClosingSections.module.css";

const QUESTIONS = {
  headphones: [
    ["How do the headphones sit around the ear?", "The sculpted earcups use padded rings that sit around the ear. The headband has its own cushion."],
    ["What comes apart in the 3D reveal?", "The ear pads and outer covers separate from the earcups so you can see how those layers fit together."],
    ["Does the reveal show how to service the headphones?", "The sequence is a visual study of the earcup layers. It shows their position in the model and how they sit together."],
    ["Which parts display the selected finish?", "The metallic surfaces change with the finish. The dark cushions provide contrast in each version."],
    ["Why do headphone prices vary by finish?", "The gallery lists a price for each headphone finish. Choose a swatch to see its unit price before adding it to your cart."],
    ["How can I compare the covers in different finishes?", "Open Find Your Finish to compare the three finish thumbnails. Choose a swatch for a larger view of that finish."],
  ],
  earbuds: [
    ["What is shown with the Wireless Earbuds?", "The model shows two earbuds with tips seated in a sculpted charging case with a hinged lid."],
    ["How do the earbuds come out of the case?", "During the reveal, the lid opens first. The earbuds rise from their sockets with a slight stagger, then turn outward."],
    ["How do the earbuds return to the case?", "Scroll back through the reveal to see both buds retrace their paths into the sockets before the lid closes."],
    ["What can I see inside the open case?", "The open case shows the shaped recesses that cradle the earbuds and the inner surface of the lid."],
    ["Does the charging case change with the finish?", "Yes. The 3D model and gallery images show the case alongside the earbuds in the selected finish."],
    ["What does the case animation tell me about charging?", "It shows how the buds sit in the case. Charging times and battery figures are outside the scope of this preview."],
  ],
  "product-03": [
    ["What does the Smartwatch dial look like?", "Slender hands sit over a dark, square dial with twelve raised hour markers."],
    ["Where can I see the crown?", "Watch the dial inspection turn. The watch starts at an angle that brings the crown and side of the case into view."],
    ["Does the watch come apart in the 3D inspection?", "The watch stays assembled as it turns from the side profile toward the dial."],
    ["How is the strap shaped?", "The strap curves behind the case, with the free end passing through two keepers."],
    ["Can I interact with the dial like a real watch?", "The dial is part of the 3D model. The inspection shows its hands and markers without simulating a working display or apps."],
    ["Where can I see the Smartwatch price?", "Find Your Finish lists the unit price. Your cart shows the selected finish, quantity, and subtotal."],
  ],
};

export default function ProductFAQ({ families, activeFamilyId }) {
  const tabs = useRef([]);
  const [selection, setSelection] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);
  const selected = selection ?? activeFamilyId;

  function select(id) {
    setSelection(id);
    setOpenQuestion(null);
  }

  function moveTab(event, index) {
    const last = families.length - 1;
    const destinations = { ArrowLeft: (index + last) % families.length,
      ArrowRight: (index + 1) % families.length, Home: 0, End: last };
    const next = destinations[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(families[next].id);
    tabs.current[next]?.focus();
  }

  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-heading">
      <div className={`af-container ${styles.faqLayout}`}>
        <div>
          <p className={styles.eyebrow}>Product guide</p>
          <h2 id="faq-heading" className={styles.editorialHeading}>Questions, Answered.</h2>
        </div>
        <div>
          <div className={styles.tabs} role="tablist" aria-label="Product FAQs">
            {families.map(({ id, label }, index) => (
              <button key={id} ref={node => { tabs.current[index] = node; }} type="button"
                role="tab" id={`faq-tab-${id}`} aria-controls={`faq-panel-${id}`}
                tabIndex={selected === id ? 0 : -1} aria-selected={selected === id}
                onClick={() => select(id)} onKeyDown={event => moveTab(event, index)}>
                {label}
              </button>
            ))}
          </div>
          {families.map(({ id }) => (
            <div key={id} role="tabpanel" id={`faq-panel-${id}`}
              aria-labelledby={`faq-tab-${id}`} hidden={selected !== id}>
              {QUESTIONS[id].map(([question, answer], index) => {
                const key = `faq-${id}-${index + 1}`;
                const open = openQuestion === key;
                return (
                  <div className={styles.question} key={key}>
                    <h3>
                      <button className={styles.disclosure} type="button" id={key}
                        aria-controls={`${key}-answer`} aria-expanded={open}
                        onClick={() => setOpenQuestion(open ? null : key)}>
                        {question}<span className={styles.chevron} aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`${key}-answer`} role="region" aria-labelledby={key}
                      className={styles.answer} inert={!open} data-open={open}>
                      <div><p>{answer}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

