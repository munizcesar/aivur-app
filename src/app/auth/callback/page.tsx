"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    if (!token) {
      setStatus("Token não encontrado.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        
        const data = await res.json();
        if (res.ok) {
          setStatus("Autenticado com sucesso! Redirecionando...");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          setStatus("Erro: " + data.error);
        }
      } catch (err: any) {
        setStatus("Erro na conexão: " + err.message);
      }
    }
    
    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">{status}</h2>
        {status.includes("Erro") && (
          <button 
            onClick={() => router.push("/login")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Voltar para o Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
