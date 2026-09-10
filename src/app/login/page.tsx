"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [simulatedToken, setSimulatedToken] = useState("");

  const handleDevLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/dev-bypass", {
        method: "POST"
      });
      if (res.ok) {
        localStorage.setItem("aivur_logged_in", "true");
        window.location.href = "/";
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Erro no dev bypass");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://aivur-worker.cesarmuniz0816.workers.dev/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json() as { error?: string; token_simulated?: string };
      
      if (!res.ok) throw new Error(data.error || "Falha ao enviar link");
      
      setSent(true);
      // SIMULATION: Since we don't have real email configured right now, we display the token to click on
      if (data.token_simulated) {
        setSimulatedToken(data.token_simulated);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.emblemFrame} aria-hidden="true">
            <Image className={styles.emblem} src="/logo-aivur.png" alt="" width={1024} height={1024} priority />
          </div>
          <div className={styles.brandName}>AIVUR</div>
          <div className={styles.brandTagline}>Inteligência que evolui resultados</div>
        </div>

        <h2 className={styles.title}>
          Acesso Multi-dispositivo
        </h2>
        <p className={styles.subtitle}>Entre no seu ambiente de estudos e continue sua evolução.</p>
        
        {sent ? (
          <div className="text-center space-y-4">
            <div className={`${styles.successIcon} w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl`}>
              ✓
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Enviamos um Magic Link para <strong>{email}</strong>.
            </p>
            {simulatedToken && (
              <div className={`${styles.simulationBox} mt-4 p-4 border rounded-lg`}>
                <p className={`${styles.simulationText} text-sm mb-2`}>
                  [Modo Simulação Ativo] Como não configuramos provedor de e-mail ainda, clique abaixo para simular o acesso:
                </p>
                <a 
                  href={`/auth/callback?token=${simulatedToken}`}
                  className={`${styles.simulationLink} hover:underline font-bold`}
                >
                  Simular Clique no E-mail
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="loginLabel block text-sm font-medium mb-1">
                E-mail de Sincronização
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="loginInput w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                placeholder="seu@email.com"
              />
            </div>
            
            {error && (
              <p className={`${styles.error} text-sm`}>{error}</p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="loginButton w-full py-2 px-4 text-white font-semibold rounded-lg shadow disabled:opacity-50 transition-colors"
            >
              {loading ? "Enviando..." : "Receber Link de Acesso"}
            </button>
          </form>
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="loginDivider mt-8 pt-4 border-t">
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="loginDevButton w-full py-2 px-4 font-semibold rounded-lg shadow transition-colors"
            >
              🚀 Login Rápido (Dev)
            </button>
          </div>
        )}
        <p className={styles.footerNote}>Ambiente seguro para sua jornada de aprovação.</p>
      </div>
    </div>
  );
}
