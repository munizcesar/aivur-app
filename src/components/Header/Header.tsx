"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Map } from "lucide-react";
import { useTheme } from "next-themes";
import styles from "./Header.module.css";
import { useQuizStore } from "@/store/useQuizStore";

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDrawerOpen = useQuizStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useQuizStore((state) => state.setDrawerOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
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
          <Link
            href="/mentor"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              color: pathname?.startsWith("/mentor") ? "var(--color-primary)" : "var(--color-text-muted)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: pathname?.startsWith("/mentor") ? "var(--color-surface-offset)" : "transparent",
              transition: "all 0.2s ease",
            }}
            aria-label="Trilhas de Curso"
            id="nav-trilhas"
          >
            <Map width={16} height={16} aria-hidden="true" />
            Trilhas
          </Link>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.drawerToggle} ${isDrawerOpen ? styles.open : ""}`} 
              onClick={toggleDrawer}
              role="dialog" 
              aria-modal="true" 
              aria-label={isDrawerOpen ? "Fechar painel" : "Abrir painel"}
            >
              <span></span><span></span><span></span>
            </button>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Alternar tema">
              {mounted ? (
                theme === "dark" ? (
                  <Sun width={20} height={20} />
                ) : (
                  <Moon width={20} height={20} />
                )
              ) : (
                <div style={{ width: 20, height: 20 }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
