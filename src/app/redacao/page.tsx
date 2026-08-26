import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Sparkles, PenTool } from "lucide-react";

export default function RedacaoPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, padding: "4rem 0", minHeight: "85vh", background: "var(--color-bg, #0B0F17)" }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginBottom: '4rem' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(217, 107, 84, 0.08)",
                  border: "1px solid rgba(217, 107, 84, 0.25)",
                  color: "#F4A261",
                  padding: "0.3rem 0.85rem",
                  borderRadius: 9999,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                  width: "fit-content"
                }}
              >
                <Sparkles width={12} height={12} /> Em breve
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-heading, #F9F6F0)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Redação Coach
              </h1>
              <p style={{ color: 'var(--color-text-muted, rgba(249, 246, 240, 0.7))', fontSize: '1.1rem' }}>
                Correção instantânea com nota e feedback detalhado focado nas competências da sua banca.
              </p>
            </div>
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
              {/*eslint-disable-next-line @next/next/no-img-element*/}
              <img src="/images/aivur/redacao.png" alt="Aivur Redação 3D" style={{ width: '220px', height: 'auto', objectFit: 'contain', background: 'transparent', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))' }} />
            </div>
          </div>
          
          <div style={{ textAlign: 'center', background: 'rgba(217, 107, 84, 0.05)', border: '1px solid rgba(217, 107, 84, 0.15)', borderRadius: '12px', padding: '4rem 2rem' }}>
            <PenTool width={48} height={48} color="rgba(217, 107, 84, 0.4)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
            <h2 style={{ color: 'var(--color-heading, #F9F6F0)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Módulo em Desenvolvimento</h2>
            <p style={{ color: 'var(--color-text-muted, rgba(249, 246, 240, 0.6))' }}>O nosso laboratório de redação com IA está recebendo os últimos ajustes.</p>
            <Link href="/" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--elite-red, #D96B54)', color: 'white', fontWeight: 700, borderRadius: '4px', textDecoration: 'none' }}>
              Voltar ao Início
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
