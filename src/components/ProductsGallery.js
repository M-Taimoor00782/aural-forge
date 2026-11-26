"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getProductFamily, getProductFamilyVariant, getProductFinishImage, formatPrice } from "@/config/productFamilies";
import styles from "./ProductsGallery.module.css";

function photo(familyId, variant) {
  return getProductFinishImage(familyId, variant.id);
}

function PurchaseControls({ family, variant, onAdd, onVariantChange, disabled }) {
  const [quantity, setQuantity] = useState(1);
  const [receipt, setReceipt] = useState("");
  return (
    <div className={styles.info}>
      <h3>{family.label}</h3>
      <p className={styles.description}>{family.description}</p>
      <div className={styles.finishLine}><span>Finish</span> <strong>{variant.name}</strong></div>
      <div className={styles.swatches} role="group" aria-label="Choose a finish">
        {family.variants.map(option => (
          <button key={option.id} type="button" title={option.name} aria-label={option.name}
            disabled={disabled} aria-pressed={option.id === variant.id} style={{ "--chip": option.swatch }}
            onClick={() => { onVariantChange(family.id, option.id); setReceipt(""); }}>
            <span />
          </button>
        ))}
      </div>
      <p className={styles.finishNote}>{variant.description}</p>
      <div className={styles.order}>
        <div><span className={styles.label}>Unit price</span><strong className={styles.price}>{formatPrice(variant)} <small>{variant.currency}</small></strong></div>
        <div><span className={styles.label}>Quantity</span>
          <div className={styles.stepper} role="group" aria-label="Quantity">
            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(n => Math.max(1, n - 1))}>−</button>
            <output aria-label="Selected quantity">{quantity}</output>
            <button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity(n => Math.min(99, n + 1))}>+</button>
          </div>
        </div>
      </div>
      <button type="button" className={styles.add} disabled={disabled} onClick={event => {
        const added = onAdd(family.id, variant.id, quantity, event.currentTarget);
        setReceipt(added ? `${added} × ${variant.name} added to your cart.` : "This finish has reached the cart quantity limit.");
      }}>Add to Cart <span aria-hidden="true">＋</span></button>
      <p className={styles.receipt} role="status">{receipt}</p>
    </div>
  );
}

export default function ProductsGallery({ families, familyId, selectedVariantsByFamily, onFamilyChange, onVariantChange, onAdd, transitioning }) {
  const family = getProductFamily(familyId);
  const variant = getProductFamilyVariant(familyId, selectedVariantsByFamily[familyId]);
  const section = useRef(null);
  const gallery = useRef(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    });
    observer.observe(gallery.current);
    return () => observer.disconnect();
  }, []);
  function selectTab(id) {
    onFamilyChange(id);
    document.getElementById("finish-tab-" + id)?.focus({ preventScroll: true });
  }
  function moveTab(event, index) {
    const last = families.length - 1;
    const next = { ArrowRight: (index + 1) % families.length, ArrowLeft: (index + last) % families.length, Home: 0, End: last };
    if (next[event.key] === undefined) return;
    event.preventDefault();
    selectTab(families[next[event.key]].id);
  }
  return (
    <section id="products" ref={section} className={styles.section} data-finish={variant.id} aria-labelledby="af-products-heading">
      <div className="af-container">
        <h2 id="af-products-heading" className={styles.heading}>Find Your <span>Finish</span></h2>
        <div className={styles.tabs} role="tablist" aria-label="Product families">
          {families.map(({ id, label }, index) => (
            <button type="button" role="tab" key={id} id={"finish-tab-" + id} aria-controls="finish-panel"
              aria-selected={id === familyId} tabIndex={id === familyId ? 0 : -1} disabled={transitioning}
              onKeyDown={e => moveTab(e, index)} onClick={() => onFamilyChange(id)}>{label}</button>
          ))}
        </div>
        <div className={styles.presentation} id="finish-panel" role="tabpanel" aria-labelledby={"finish-tab-" + familyId}>
          <div ref={gallery} className={styles.gallery} data-entered={entered}>
            <div className={styles.studio} role="img" aria-label={family.label + " in " + variant.name}>
              {family.variants.map(option => (
                <Image key={photo(familyId, option)} src={photo(familyId, option)} alt="" width={920} height={920} unoptimized
                  className={styles.mainPhoto} data-selected={option?.id === variant?.id} />
              ))}
            </div>
            <div className={styles.thumbs} role="group" aria-label="Finish photographs">
              {family.variants.map(option => (
                <button type="button" key={option.id} disabled={transitioning} aria-label={"View " + option.name}
                  aria-pressed={variant.id === option.id} onClick={() => onVariantChange(familyId, option.id)}>
                  <Image src={photo(familyId, option)} alt="" width={64} height={64} unoptimized />
                </button>
              ))}
            </div>
          </div>
          <PurchaseControls key={familyId} family={family} variant={variant}
            onVariantChange={onVariantChange} onAdd={onAdd} disabled={transitioning} />
        </div>
        <div className={styles.explore}>
          <h3>Explore the <span>Collection</span></h3>
          <div className={styles.cards}>
            {families.filter(item => item.id !== familyId).map(({ id, label }) => {
              const finish = getProductFamilyVariant(id, selectedVariantsByFamily[id]);
              return <button key={id} type="button" disabled={transitioning} onClick={() => {
                selectTab(id);
                section.current.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
              }}>
                <Image src={photo(id, finish)} alt="" width={110} height={110} unoptimized />
                <span><strong>{label}</strong><small>{finish.name}</small></span>
                <span aria-hidden="true" className={`af-chevron af-chevron--right ${styles.arrow}`} />
              </button>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
