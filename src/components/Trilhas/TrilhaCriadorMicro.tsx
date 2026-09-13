"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  BookOpen,
  Video,
  CreditCard,
  ClipboardList,
} from "lucide-react";


interface FlashcardDraft { frente: string; verso: string; }
interface QuestaoOpcao { texto: string; }
interface QuestaoDraft {
  enunciado: string;
  opcoes: QuestaoOpcao[];
  corretaIdx: number;
  justificativa: string;
}

const MAX_FLASHCARDS = 10;
const MAX_QUESTOES = 5;

export default function TrilhaCriadorMicro() {
  // Bloco A
  const [titulo, setTitulo] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [descricao, setDescricao] = useState("");

  // Bloco B
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");

  // Bloco C
  const [flashcards, setFlashcards] = useState<FlashcardDraft[]>([{ frente: "", verso: "" }]);
  const [questoes, setQuestoes] = useState<QuestaoDraft[]>([
    { enunciado: "", opcoes: [{ texto: "" }, { texto: "" }, { texto: "" }], corretaIdx: 0, justificativa: "" },
  ]);

  // Alerts
  const [showFlashcardAlert, setShowFlashcardAlert] = useState(false);
  const [showQuestaoAlert, setShowQuestaoAlert] = useState(false);
  const [saved, setSaved] = useState(false);

  // Extract YouTube video ID from URL
  useEffect(() => {
    if (!videoUrl) { setVideoId(""); return; }
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    setVideoId(match ? match[1] : "");
  }, [videoUrl]);

  // ── Flashcard handlers ──
  const addFlashcard = () => {
    if (flashcards.length >= MAX_FLASHCARDS) { setShowFlashcardAlert(true); return; }
    setFlashcards((prev) => [...prev, { frente: "", verso: "" }]);
    setShowFlashcardAlert(false);
  };
  const updateFlashcard = (idx: number, field: keyof FlashcardDraft, value: string) => {
    setFlashcards((prev) => prev.map((fc, i) => i === idx ? { ...fc, [field]: value } : fc));
  };
  const removeFlashcard = (idx: number) => {
    setFlashcards((prev) => prev.filter((_, i) => i !== idx));
    setShowFlashcardAlert(false);
  };

  // ── Questao handlers ──
  const addQuestao = () => {
    if (questoes.length >= MAX_QUESTOES) { setShowQuestaoAlert(true); return; }
    setQuestoes((prev) => [
      ...prev,
      { enunciado: "", opcoes: [{ texto: "" }, { texto: "" }, { texto: "" }], corretaIdx: 0, justificativa: "" },
    ]);
    setShowQuestaoAlert(false);
  };
  const updateQuestao = (qIdx: number, field: keyof Omit<QuestaoDraft, "opcoes">, value: string | number) => {
    setQuestoes((prev) => prev.map((q, i) => i === qIdx ? { ...q, [field]: value } : q));
  };
  const updateOpcao = (qIdx: number, oIdx: number, value: string) => {
    setQuestoes((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opcoes = q.opcoes.map((o, j) => j === oIdx ? { texto: value } : o);
      return { ...q, opcoes };
    }));
  };
  const addOpcao = (qIdx: number) => {
    setQuestoes((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.opcoes.length >= 5) return q;
      return { ...q, opcoes: [...q.opcoes, { texto: "" }] };
    }));
  };
  const removeOpcao = (qIdx: number, oIdx: number) => {
    setQuestoes((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.opcoes.length <= 2) return q;
      const opcoes = q.opcoes.filter((_, j) => j !== oIdx);
      const corretaIdx = q.corretaIdx >= opcoes.length ? 0 : q.corretaIdx;
      return { ...q, opcoes, corretaIdx };
    }));
  };
  const removeQuestao = (idx: number) => {
    setQuestoes((prev) => prev.filter((_, i) => i !== idx));
    setShowQuestaoAlert(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-[rgba(107,153,179,0.25)] bg-[#020C14]/70 text-[#F8FAFC] placeholder:text-slate-500 text-sm focus:border-[#C41230] focus:ring-1 focus:ring-[#C41230] outline-none transition-colors";
  const labelClass = "block text-sm font-bold text-[#FBEBD0] mb-1.5";
  const blockClass = "rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/30 p-5 md:p-6 backdrop-blur-sm";

  return (
    <div className="min-h-screen bg-[#020C14]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[rgba(107,153,179,0.2)] bg-[#020C14]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link href="/trilhas" className="flex items-center gap-1.5 text-xs font-semibold text-[#6B99B3] hover:text-[#FBEBD0] transition-colors">
            <ArrowLeft size={15} className="shrink-0 flex-none" /> Voltar
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-[#FBEBD0]">Nova Trilha de Microlearning</h1>
            <p className="text-[11px] text-[#6B99B3]">Foco em retencao · max {MAX_FLASHCARDS} flashcards · max {MAX_QUESTOES} questoes</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-32">

        {/* BLOCO A — IDENTIDADE */}
        <section className={blockClass}>
          <div className="flex items-center gap-2 mb-5 text-[#C9A84C]">
            <BookOpen size={16} className="shrink-0 flex-none" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Bloco A — Identidade</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Titulo da Trilha *</label>
              <input required className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Principios da Administracao Publica" />
            </div>
            <div>
              <label className={labelClass}>Disciplina / Banca</label>
              <input className={inputClass} value={disciplina} onChange={(e) => setDisciplina(e.target.value)} placeholder="Ex: Direito Administrativo — CESPE" />
            </div>
            <div>
              <label className={labelClass}>Descricao</label>
              <textarea rows={3} className={inputClass + " resize-none"} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o objetivo desta trilha em 1-2 frases..." />
            </div>
          </div>
        </section>

        {/* BLOCO B — MIDIA */}
        <section className={blockClass}>
          <div className="flex items-center gap-2 mb-5 text-[#C9A84C]">
            <Video size={16} className="shrink-0 flex-none" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Bloco B — Midia (Video)</h2>
          </div>
          <div>
            <label className={labelClass}>URL do Video (YouTube ou Vimeo)</label>
            <input className={inputClass} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          {videoId && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[#6B99B3] uppercase tracking-wider">Preview</p>
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-[rgba(107,153,179,0.2)] bg-black">
                <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} title="Preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
              </div>
            </div>
          )}
          {videoUrl && !videoId && (
            <p className="mt-2 text-xs text-rose-400">URL invalida. Use um link do YouTube (youtube.com/watch?v=... ou youtu.be/...)</p>
          )}
        </section>

        {/* BLOCO C — FIXACAO */}
        <section className={blockClass}>
          <div className="flex items-center gap-2 mb-1 text-[#C9A84C]">
            <CreditCard size={16} className="shrink-0 flex-none" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Bloco C — Fixacao</h2>
          </div>
          <p className="mb-5 text-xs text-[#6B99B3]">O foco e microlearning — conteudo curto e denso para maxima retencao.</p>

          {/* FLASHCARDS */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="shrink-0 flex-none text-[#6B99B3]" />
                <span className="text-sm font-bold text-[#FBEBD0]">Flashcards ({flashcards.length}/{MAX_FLASHCARDS})</span>
              </div>
              <button type="button" onClick={addFlashcard} className="flex items-center gap-1.5 rounded-lg bg-[#122338] px-3 py-1.5 text-xs font-bold text-[#C9A84C] hover:bg-[#1a3048] transition-colors">
                <Plus size={12} className="shrink-0 flex-none" /> Adicionar
              </button>
            </div>

            {showFlashcardAlert && (
              <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <AlertTriangle size={16} className="shrink-0 flex-none text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Limite de microlearning atingido</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    Trilhas eficazes tem no maximo {MAX_FLASHCARDS} flashcards. Para mais conteudo, crie uma nova trilha separada.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {flashcards.map((fc, idx) => (
                <div key={idx} className="rounded-lg border border-[rgba(107,153,179,0.15)] bg-[#020C14]/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#6B99B3]">Card {idx + 1}</span>
                    {flashcards.length > 1 && (
                      <button type="button" onClick={() => removeFlashcard(idx)} className="text-[#6B99B3] hover:text-rose-400 transition-colors">
                        <Trash2 size={14} className="shrink-0 flex-none" />
                      </button>
                    )}
                  </div>
                  <input className={inputClass + " mb-2"} value={fc.frente} onChange={(e) => updateFlashcard(idx, "frente", e.target.value)} placeholder="Frente (pergunta)" />
                  <input className={inputClass} value={fc.verso} onChange={(e) => updateFlashcard(idx, "verso", e.target.value)} placeholder="Verso (resposta)" />
                </div>
              ))}
            </div>
          </div>

          {/* QUESTOES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="shrink-0 flex-none text-[#6B99B3]" />
                <span className="text-sm font-bold text-[#FBEBD0]">Questoes ({questoes.length}/{MAX_QUESTOES})</span>
              </div>
              <button type="button" onClick={addQuestao} className="flex items-center gap-1.5 rounded-lg bg-[#122338] px-3 py-1.5 text-xs font-bold text-[#C9A84C] hover:bg-[#1a3048] transition-colors">
                <Plus size={12} className="shrink-0 flex-none" /> Adicionar
              </button>
            </div>

            {showQuestaoAlert && (
              <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <AlertTriangle size={16} className="shrink-0 flex-none text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Limite de microlearning atingido</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    Trilhas eficazes tem no maximo {MAX_QUESTOES} questoes. Isso garante foco e previne fadiga cognitiva. Crie outra trilha para mais conteudo.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {questoes.map((q, qIdx) => (
                <div key={qIdx} className="rounded-lg border border-[rgba(107,153,179,0.15)] bg-[#020C14]/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#6B99B3]">Questao {qIdx + 1}</span>
                    {questoes.length > 1 && (
                      <button type="button" onClick={() => removeQuestao(qIdx)} className="text-[#6B99B3] hover:text-rose-400 transition-colors">
                        <Trash2 size={14} className="shrink-0 flex-none" />
                      </button>
                    )}
                  </div>
                  <textarea rows={3} className={inputClass + " resize-none mb-3"} value={q.enunciado} onChange={(e) => updateQuestao(qIdx, "enunciado", e.target.value)} placeholder="Enunciado da questao..." />

                  <div className="space-y-2 mb-3">
                    <p className="text-xs font-semibold text-[#6B99B3]">Alternativas (selecione a correta)</p>
                    {q.opcoes.map((opcao, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestao(qIdx, "corretaIdx", oIdx)}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                            q.corretaIdx === oIdx ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-[#122338] text-[#6B99B3] border border-[rgba(107,153,179,0.2)]"
                          }`}
                          title="Marcar como correta"
                        >
                          {["A","B","C","D","E"][oIdx]}
                        </button>
                        <input className={inputClass + " flex-1"} value={opcao.texto} onChange={(e) => updateOpcao(qIdx, oIdx, e.target.value)} placeholder={`Alternativa ${["A","B","C","D","E"][oIdx]}`} />
                        {q.opcoes.length > 2 && (
                          <button type="button" onClick={() => removeOpcao(qIdx, oIdx)} className="text-[#6B99B3] hover:text-rose-400 transition-colors flex-shrink-0">
                            <Trash2 size={13} className="shrink-0 flex-none" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.opcoes.length < 5 && (
                      <button type="button" onClick={() => addOpcao(qIdx)} className="flex items-center gap-1 text-xs text-[#6B99B3] hover:text-[#C9A84C] transition-colors">
                        <Plus size={11} className="shrink-0 flex-none" /> Adicionar alternativa
                      </button>
                    )}
                  </div>

                  <textarea rows={2} className={inputClass + " resize-none"} value={q.justificativa} onChange={(e) => updateQuestao(qIdx, "justificativa", e.target.value)} placeholder="Justificativa / gabarito comentado..." />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(107,153,179,0.2)] bg-[#020C14]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <p className="hidden sm:block text-xs text-[#6B99B3]">
              {flashcards.length} flashcard{flashcards.length !== 1 ? "s" : ""} · {questoes.length} questao{questoes.length !== 1 ? "es" : ""} criada{questoes.length !== 1 ? "s" : ""}
            </p>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${
                saved ? "bg-emerald-600 text-white" : "bg-[#C41230] text-white hover:bg-[#6B0000]"
              }`}
            >
              <Save size={16} className="shrink-0 flex-none" />
              {saved ? "Salvo com sucesso!" : "Salvar e Publicar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
