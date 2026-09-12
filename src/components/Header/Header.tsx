"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu } from "lucide-react";
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
          <button
            className={`${styles.drawerToggle} ${isDrawerOpen ? styles.open : ""} transition-transform duration-150 active:scale-95`}
            onClick={toggleDrawer}
            aria-label={isDrawerOpen ? "Fechar painel" : "Abrir painel"}
            aria-expanded={isDrawerOpen}
          >
            <Menu width={22} height={22} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Link className="flex items-center shrink-0" href="/" aria-label="AIVUR — Página principal">
              <Image
                alt="AIVUR"
                src={mounted && theme === "light" ? "/assets/logo-aivur-light.webp" : "/assets/logo-aivur-dark.webp"}
                width={180}
                height={60}
                priority
                className={`${styles.logoImage} object-contain`}
              />
            </Link>
          </div>
          <div className={styles.headerActions}>
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
