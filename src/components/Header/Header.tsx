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
    <header className={`${styles.siteHeader} backdrop-blur-md bg-background/80`}>
      <div className="container">
        <div className={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Link href="/" className={`${styles.logo} transition-transform duration-150 active:scale-95`} aria-label="AIVUR - Voltar ao inicio">
              <Image 
                src={mounted && theme === "dark" ? "/assets/logo-aivur-dark.png" : "/assets/logo-aivur-light.png"}
                alt="AIVUR Logo" 
                width={180} 
                height={50} 
                className={styles.logoIcon}
              />
            </Link>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.drawerToggle} ${isDrawerOpen ? styles.open : ""} transition-transform duration-150 active:scale-95`} 
              onClick={toggleDrawer}
              role="dialog" 
              aria-modal="true" 
              aria-label={isDrawerOpen ? "Fechar painel" : "Abrir painel"}
            >
              <span></span><span></span><span></span>
            </button>
            <button className={`${styles.themeToggle} transition-transform duration-150 active:scale-95`} onClick={toggleTheme} aria-label="Alternar tema">
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
