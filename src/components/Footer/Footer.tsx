"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";


export default function Footer() {
  const openAdminIngest = () => {
    // Custom event to trigger admin modal in the future
    const event = new CustomEvent("openAdminModal");
    window.dispatchEvent(event);
  };

  return (
    <footer className={`${styles.siteFooter} bg-[#091422]`}>
      <div className="container">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logoRow}>
              <Link className="flex items-center shrink-0" href="/trilhas">
                <Image alt="AIVUR" src="/assets/logo-aivur-dark.png" width={102} height={34} priority style={{ height: 34, width: 'auto', maxWidth: 102 }} className="object-contain" />
              </Link>
              <button 
                onClick={openAdminIngest} 
                className={styles.adminButton}
              >
                Admin
              </button>
            </div>
            <p className={styles.footerTagline}>Inteligência que evolui resultados.</p>
          </div>
          <div className={styles.footerMeta}>
            <span>Powered by <strong>Groq AI</strong></span>
            <span className={styles.footerDivider}>·</span>
            <span>© {new Date().getFullYear()} AIVUR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
