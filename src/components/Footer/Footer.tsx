"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import styles from "./Footer.module.css";

export default function Footer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openAdminIngest = () => {
    // Custom event to trigger admin modal in the future
    const event = new CustomEvent("openAdminModal");
    window.dispatchEvent(event);
  };

  return (
    <footer className={styles.siteFooter}>
      <div className="container">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logoRow}>
              <span className={styles.footerLogo}>
                <Image 
                  src={mounted && theme === 'dark' ? '/assets/logo-aivur-dark.png' : '/assets/logo-aivur-light.png'} 
                  alt="AIVUR Logo" 
                  width={100} 
                  height={28} 
                  style={{ width: "100px", height: "auto" }} 
                />
              </span>
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
