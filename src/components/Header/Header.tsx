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
            <Link className="flex items-center shrink-0" href="/trilhas">
              <Image
                alt="AIVUR"
                src={mounted && theme === "light" ? "/assets/logo-aivur-light.png" : "/assets/logo-aivur-dark.png"}
                width={120}
                height={40}
                priority
                style={{ width: 120, height: "auto", aspectRatio: "3 / 1", objectFit: "contain" }}
                className="object-contain"
              />
            </Link>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.drawerToggle} ${isDrawerOpen ? styles.open : ""} transition-transform duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center`} 
              onClick={toggleDrawer}
              role="dialog" 
              aria-modal="true" 
              aria-label={isDrawerOpen ? "Fechar painel" : "Abrir painel"}
            >
              <span></span><span></span><span></span>
            </button>
            <button className={`${styles.themeToggle} transition-transform duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center`} onClick={toggleTheme} aria-label="Alternar tema">
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
