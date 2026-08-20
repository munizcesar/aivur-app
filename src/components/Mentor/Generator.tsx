"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalCourses } from "@/hooks/useLocalCourses";
import type { Course, CourseSubject, CourseNicho, CourseTopic } from "@/types/course";
import styles from "./Mentor.module.css";
import Link from "next/link";

export default function Generator() {
  const router = useRouter();
  const { saveCourse } = useLocalCourses();
  
  const [step, setStep] = useState<"input" | "loading" | "review">("input");
  const [error, setError] = useState<string | null>(null);
  
  // Input states
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Review states
  const [draftCourse, setDraftCourse] = useState<Course | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);

  const loadingPhrases = [
    "Lendo conteúdo do edital...",
    "Mapeando pesos das disciplinas...",
    "Estruturando leis e matérias específicas...",
    "Finalizando cronograma..."
  ];
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);

  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => {
      setLoadingPhraseIdx(prev => (prev + 1) % loadingPhrases.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [step]);

  const toggleSubject = (sIdx: number) => {
    setExpandedSubjects(prev => 
      prev.includes(sIdx) ? prev.filter(idx => idx !== sIdx) : [...prev, sIdx]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError("Preencha o título da trilha.");
      return;
    }
    if (!text && !file) {
      setError("Por favor, cole o texto do edital ou envie um PDF para gerar a trilha.");
      return;
    }

    setError(null);
    setStep("loading");

    try {
      const formData = new FormData();
      formData.append("title", title);
      if (text) formData.append("text", text);
      if (file) formData.append("file", file);

      const res = await fetch("/api/mentor/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || "Erro ao gerar trilha");
      }

      const generatedCourse = await res.json() as Course;
      generatedCourse.userId = null;
      setDraftCourse(generatedCourse);
      setStep("review");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStep("input");
    }
  };

  const handleSave = async () => {
    if (!draftCourse) return;
    await saveCourse(draftCourse);
    router.push("/mentor");
  };

  const handleUpdateSubject = (sIdx: number, field: keyof CourseSubject, value: string) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx] = { ...updated.subjects[sIdx], [field]: value };
    setDraftCourse(updated);
  };

  const handleDeleteSubject = (sIdx: number) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects.splice(sIdx, 1);
    setDraftCourse(updated);
  };

  const handleUpdateNicho = (sIdx: number, nIdx: number, title: string) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos[nIdx].title = title;
    setDraftCourse(updated);
  };

  const handleDeleteNicho = (sIdx: number, nIdx: number) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos.splice(nIdx, 1);
    setDraftCourse(updated);
  };

  const handleUpdateTopic = (sIdx: number, nIdx: number, iIdx: number, label: string) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos[nIdx].items[iIdx].label = label;
    setDraftCourse(updated);
  };

  const handleDeleteTopic = (sIdx: number, nIdx: number, iIdx: number) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos[nIdx].items.splice(iIdx, 1);
    setDraftCourse(updated);
  };

  return (
    <div className={styles.page}>
      <Link href="/mentor" className={styles.backLink}>
        ← Voltar para Trilhas
      </Link>

      <div className={styles.listHeader}>
        <p className={styles.listEyebrow}>Gerador IA</p>
        <h1 className={styles.listTitle}>Criar Trilha Personalizada</h1>
      </div>

      {error && <div style={{ color: "#ff4444", marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(255,0,0,0.1)", borderRadius: "8px" }}>{error}</div>}

      {step === "input" && (
        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Nome do Concurso/Trilha</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Polícia Federal 2026"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", backgroundColor: "var(--background-card, #1e293b)", border: "1px solid #334155", color: "white" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Edital, Matéria ou Tópicos de Estudo</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole aqui o edital completo, uma matéria específica ou a lista de assuntos que você precisa estudar..."
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", backgroundColor: "var(--background-card, #1e293b)", border: "1px solid #334155", color: "white", minHeight: "200px" }}
            />
          </div>

          <div style={{ textAlign: "center", color: "#94a3b8" }}>OU</div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Upload de Edital ou Material (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ width: "100%" }}
            />
          </div>

          <button 
            type="submit" 
            disabled={!title || (!text && !file)}
            style={{ 
              marginTop: "1rem", 
              backgroundColor: (!title || (!text && !file)) ? "#334155" : "white", 
              color: (!title || (!text && !file)) ? "#94a3b8" : "black", 
              padding: "1rem", 
              borderRadius: "8px", 
              fontWeight: "bold", 
              cursor: (!title || (!text && !file)) ? "not-allowed" : "pointer", 
              border: "none" 
            }}
          >
            Gerar Trilha com IA
          </button>
        </form>
      )}

      {step === "loading" && (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="spinner" style={{ border: "4px solid rgba(255,255,255,0.1)", width: "40px", height: "40px", borderRadius: "50%", borderLeftColor: "white", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
          <h2>Processando Edital...</h2>
          <p style={{ color: "#94a3b8", marginTop: "1rem", minHeight: "24px", transition: "all 0.3s ease" }}>
            {loadingPhrases[loadingPhraseIdx]}
          </p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === "review" && draftCourse && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h2>Revisão da Trilha: {draftCourse.title}</h2>
            <button onClick={handleSave} style={{ backgroundColor: "#10b981", color: "white", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
              Salvar e Iniciar Trilha
            </button>
          </div>

          {draftCourse.subjects.map((subject, sIdx) => {
            const isExpanded = expandedSubjects.includes(sIdx);
            return (
            <div key={sIdx} style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid #334155", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", cursor: "pointer" }} onClick={() => toggleSubject(sIdx)}>
                <div style={{ flex: 1, fontWeight: "bold", fontSize: "1.1rem" }}>
                  {subject.subject} <span style={{ color: "#94a3b8", fontSize: "0.9rem", marginLeft: "0.5rem" }}>({subject.nichos.reduce((acc, n) => acc + n.items.length, 0)} tópicos)</span>
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  {isExpanded ? "▲ Ocultar" : "▼ Revisar"}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Matéria</label>
                      <input
                        value={subject.subject}
                        onChange={(e) => handleUpdateSubject(sIdx, "subject", e.target.value)}
                        style={{ width: "100%", padding: "0.5rem", backgroundColor: "transparent", border: "1px solid #334155", color: "white", borderRadius: "4px" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Termo de Busca YouTube</label>
                      <input
                        value={subject.ytTerm}
                        onChange={(e) => handleUpdateSubject(sIdx, "ytTerm", e.target.value)}
                        style={{ width: "100%", padding: "0.5rem", backgroundColor: "transparent", border: "1px solid #334155", color: "white", borderRadius: "4px" }}
                      />
                    </div>
                    <button onClick={() => handleDeleteSubject(sIdx)} style={{ backgroundColor: "transparent", color: "#ef4444", border: "none", padding: "0", marginTop: "1.2rem", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}>
                      Excluir Matéria
                    </button>
                  </div>

                  <div style={{ paddingLeft: "1rem", borderLeft: "2px solid #334155" }}>
                    {subject.nichos.map((nicho, nIdx) => (
                      <div key={nIdx} style={{ marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.8rem" }}>
                          <input
                            value={nicho.title}
                            onChange={(e) => handleUpdateNicho(sIdx, nIdx, e.target.value)}
                            style={{ flex: 1, padding: "0.5rem", backgroundColor: "transparent", border: "1px solid #334155", color: "white", borderRadius: "4px", fontWeight: "bold" }}
                          />
                          <button onClick={() => handleDeleteNicho(sIdx, nIdx)} style={{ backgroundColor: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "1.2rem" }} title="Remover Nicho">
                            ×
                          </button>
                        </div>

                        <div style={{ paddingLeft: "1rem" }}>
                          {nicho.items.map((item, iIdx) => (
                            <div key={item.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                              <input
                                value={item.label}
                                onChange={(e) => handleUpdateTopic(sIdx, nIdx, iIdx, e.target.value)}
                                style={{ flex: 1, padding: "0.4rem", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", borderRadius: "4px", fontSize: "0.9rem", transition: "border 0.2s" }}
                              />
                              <button onClick={() => handleDeleteTopic(sIdx, nIdx, iIdx)} style={{ backgroundColor: "transparent", color: "#ef4444", border: "none", cursor: "pointer", opacity: 0.7 }} title="Remover Tópico">
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
