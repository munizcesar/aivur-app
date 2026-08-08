"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import styles from "./Header.module.css";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Check initial theme from HTML attribute
    const currentTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    if (currentTheme) setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    // Custom event to sync with future Drawer component
    const event = new CustomEvent('toggleDrawer', { detail: { open: !drawerOpen } });
    window.dispatchEvent(event);
  };

  return (
    <header className={styles.siteHeader}>
      <div className="container">
        <div className={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Link href="/" className={styles.logo} aria-label="AIVUR - Voltar ao inicio">
              <Image 
                src="/assets/aivos-logo.png" 
                alt="AIVUR Logo" 
                width={180} 
                height={50} 
                className={styles.logoIcon}
                priority
              />
            </Link>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.drawerToggle} ${drawerOpen ? styles.open : ""}`} 
              onClick={toggleDrawer}
              role="dialog" 
              aria-modal="true" 
              aria-label={drawerOpen ? "Fechar painel" : "Abrir painel"}
            >
              <span></span><span></span><span></span>
            </button>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? (
                <Sun width={20} height={20} />
              ) : (
                <Moon width={20} height={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
