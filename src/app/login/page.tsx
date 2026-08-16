"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [simulatedToken, setSimulatedToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://studymaster-worker.cesarmuniz0816.workers.dev/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Acesso Multi-dispositivo
        </h2>
        
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Enviamos um Magic Link para <strong>{email}</strong>.
            </p>
            {simulatedToken && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  [Modo Simulação Ativo] Como não configuramos provedor de e-mail ainda, clique abaixo para simular o acesso:
                </p>
                <a 
                  href={`/auth/callback?token=${simulatedToken}`}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Simular Clique no E-mail
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail de Sincronização
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="seu@email.com"
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow disabled:opacity-50 transition-colors"
            >
              {loading ? "Enviando..." : "Receber Link de Acesso"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
