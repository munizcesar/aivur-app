"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const openAdminIngest = () => {
    const event = new CustomEvent("openAdminModal");
    window.dispatchEvent(event);
  };

  return (
    <footer className={styles.siteFooter}>
      <div className="container">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logoRow}>
              <Link className={styles.logoLink} href="/trilhas" aria-label="AIVUR — Trilhas de estudo">
                <Image
                  alt="AIVUR"
                  src="/assets/logo-aivur-light.webp"
                  width={152}
                  height={51}
                  priority
                  className={`${styles.footerLogoImage} ${styles.lightLogo}`}
                />
                <Image
                  alt=""
                  src="/assets/logo-aivur-dark.webp"
                  width={152}
                  height={51}
                  priority
                  className={`${styles.footerLogoImage} ${styles.darkLogo}`}
                  aria-hidden="true"
                />
              </Link>
              <button type="button" onClick={openAdminIngest} className={styles.adminButton}>
                Admin
              </button>
            </div>
            <p className={styles.footerTagline}>Inteligência que evolui resultados.</p>
          </div>

          <div className={styles.footerMeta} aria-label="Informações do AIVUR">
            <span>Powered by <strong>Groq AI</strong></span>
            <span className={styles.footerDivider} aria-hidden="true">•</span>
            <span>© {new Date().getFullYear()} AIVUR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
