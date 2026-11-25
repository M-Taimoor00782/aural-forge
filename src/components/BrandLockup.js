import Image from "next/image";
import styles from "./BrandLockup.module.css";
import darkLogo from "../../public/aural-forge-dark.webp";
import lightLogo from "../../public/aural-forge-light.webp";

export default function BrandLockup() {
  return (
    <span className={styles.lockup} aria-hidden="true">
      <Image src={darkLogo} alt="" loading="eager" unoptimized
        className={styles.dark} />
      <Image src={lightLogo} alt="" loading="eager" unoptimized
        className={styles.light} />
    </span>
  );
}

