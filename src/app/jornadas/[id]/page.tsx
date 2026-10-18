import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import JornadaView, { type JornadaFullData } from "@/components/Jornadas/JornadaView";
import { verifySessionCookie } from "@/lib/session";
import type { JornadaDB, JornadaTopicoDB } from "@/lib/validations/jornada";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JornadaDetalhePage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");
  const session = await verifySessionCookie(sessionCookie?.value);

  if (!session.valid) {
    redirect(`/login?redirect=/jornadas/${id}`);
  }

  const userId = session.userId;
  let env: any = {};
  try {
    env = getRequestContext().env;
  } catch {
    // Local dev or SSR boundary fallback
  }

  const db = env?.D1_DB || env?.DB;
  if (!db) {
    // If DB is not available in local mock/test environment without Cloudflare bindings,
    // render a fallback or handle gracefully
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--color-text)]">Banco de Dados Indisponível</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Não foi possível conectar ao banco de dados D1 no momento.
          </p>
        </main>
        <Footer />
        <SideDrawer />
      </div>
    );
  }

  // 1. Verify existence and ownership (anti-IDOR)
  const jornada = ((await db
    .prepare("SELECT * FROM jornadas WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first()) as unknown) as JornadaDB | null;

  if (!jornada) {
    notFound();
  }

  // 2. Fetch topics in order
  const topicosRes = ((await db
    .prepare("SELECT * FROM jornada_topicos WHERE jornada_id = ? ORDER BY ordem_global ASC")
    .bind(id)
    .all()) as unknown) as { results?: JornadaTopicoDB[] };

  const topicos = topicosRes?.results || [];
  const total = topicos.length;
  const concluidos = topicos.filter((t: JornadaTopicoDB) => t.status === "concluido").length;
  const progresso_geral = total > 0 ? Math.round((concluidos * 100) / total) : 0;

  const fullJornada: JornadaFullData = {
    ...jornada,
    progresso_geral,
    topicos,
  };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm">
          Carregando jornada...
        </div>
      }
    >
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden pt-[80px]">
          <JornadaView initialJornada={fullJornada} />
        </main>
        <Footer />
        <SideDrawer />
      </div>
    </Suspense>
  );
}
