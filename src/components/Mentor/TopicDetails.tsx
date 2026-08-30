import React, { useState } from "react";
import styles from "./Mentor.module.css";
import { useTopicContent, Flashcard, Questao } from "@/hooks/useTopicContent";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { useCourseContext } from "@/context/CourseContext";
import { useLocalCourses } from "@/hooks/useLocalCourses";
import ReactMarkdown from 'react-markdown';
import { FullscreenQuestion } from "@/components/UI/FullscreenQuestion";
import DesktopQuestionList from "@/components/Mentor/DesktopQuestionList";
import { Sparkles, ShieldCheck } from "lucide-react";

export function getDisclaimerAivur(subject: string) {
  const materia = subject?.toLowerCase() || "";

  if (materia.includes("português") || materia.includes("portuguesa") || materia.includes("redação")) {
    return "SÍNTESE DE ALTA PERFORMANCE (AIVUR MENTOR): Estruturada por IA com base em gramáticas normativas de referência (ex: Cegalla, Bechara) e regras da ABL. Excelente para retenção e revisão, mas valide sempre as minúcias com o edital oficial.";
  } 
  
  if (materia.includes("matemática") || materia.includes("raciocínio") || materia.includes("lógico") || materia.includes("rlm")) {
    return "SÍNTESE DE ALTA PERFORMANCE (AIVUR MENTOR): Passo a passo lógico e analítico estruturado por IA. Focado em aplicação direta de fórmulas, teoremas consolidados e nas armadilhas clássicas das bancas.";
  }

  if (materia.includes("informática") || materia.includes("tecnologia") || materia.includes("computação")) {
    return "SÍNTESE DE ALTA PERFORMANCE (AIVUR MENTOR): Material fundamentado em documentações técnicas oficiais (Windows, Linux, Pacote Office) e cartilhas de Segurança da Informação (ex: CERT.br).";
  }

  return "SÍNTESE DE ALTA PERFORMANCE (AIVUR MENTOR): Conteúdo estruturado por IA especializada com base na legislação oficial, jurisprudência e doutrinas. Utilize como acelerador de estudos, mantendo a leitura da lei seca (Vade Mecum) como validação final.";
}

interface TopicDetailsProps {
  topicId: string;
  topicLabel: string;
  subject: string;
  nicho: string;
}

type Tab = "teoria" | "flashcards" | "questoes";

export function TopicDetails({ topicId, topicLabel, subject, nicho }: TopicDetailsProps) {
  const { courseId, activeTab, setActiveTab, dificuldade, setDificuldade, banca, setBanca } = useCourseContext();
  const { courses } = useLocalCourses();
  const currentCourse = courses.find((c) => c.id === courseId);
  const isConcurso = currentCourse?.sourceType === "edital" || !currentCourse?.sourceType;

  const [showFlashcardsWarning, setShowFlashcardsWarning] = useState(false);

  const [mobileQuestionIndex, setMobileQuestionIndex] = useState(0);
  const [showMobileFullscreen, setShowMobileFullscreen] = useState(false);

  // Removido useEffect e estado local de activeTab, pois agora vem do contexto global.

  
  const {
    state,
    isLoadingTeoria,
    isLoadingFlashcards,
    isLoadingQuestoes,
    error,
    generateTeoria,
    generateFlashcards,
    generateQuestoes,
    markFlashcard,
    answerQuestao
  } = useTopicContent(topicId);

  const { logQuestaoAnswer, addReviewFlashcard, syncReviewQuestoes } = useCourseProgress(courseId);

  const handleRegerarQuestoes = async () => {
    const novasQuestoes = await generateQuestoes(topicLabel, subject, nicho, dificuldade, banca, true);
    if (novasQuestoes) {
      const ids = novasQuestoes.map((q: Questao) => q.id);
      syncReviewQuestoes(subject, topicId, ids);
    }
  };

  const handleMarkFlashcard = (fc: Flashcard, status: "sei" | "nao_sei") => {
    markFlashcard(fc.id, status);
    if (status === "nao_sei") {
      addReviewFlashcard(subject, {
        id: fc.id,
        type: "flashcard",
        topicId,
        topicLabel,
        subject,
        data: fc
      });
    }
  };

  const handleAnswerQuestao = (q: Questao, alternativa: string) => {
    // Evita contar duas vezes se já respondeu
    if (state.userResponses[q.id]) return;
    
    answerQuestao(q.id, alternativa);
    const isCorrect = q.correta === alternativa;
    
    logQuestaoAnswer(subject, isCorrect, {
      id: q.id,
      type: "questao",
      topicId,
      topicLabel,
      subject,
      data: q
    });
  };

  // --- Flashcard Component ---
  const FlashcardView = ({ fc }: { fc: Flashcard }) => {
    const [flipped, setFlipped] = useState(false);
    const status = state.flashcardStatus[fc.id];

    return (
      <div className={styles.flashcard} onClick={() => setFlipped(!flipped)}>
        <div className={styles.flashcardFront}>{fc.front}</div>
        {flipped && (
          <>
            <div className={styles.flashcardBack}>{fc.back}</div>
            <div className={styles.flashcardActions} onClick={(e) => e.stopPropagation()}>
              <button 
                className={`${styles.flashcardBtn} ${styles.btnNaoSei}`}
                style={{ opacity: status === "nao_sei" ? 1 : 0.6 }}
                onClick={() => handleMarkFlashcard(fc, "nao_sei")}
              >
                Não Sei
              </button>
              <button 
                className={`${styles.flashcardBtn} ${styles.btnSei}`}
                style={{ opacity: status === "sei" ? 1 : 0.6 }}
                onClick={() => handleMarkFlashcard(fc, "sei")}
              >
                Sei
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // --- Questao Component ---
  const QuestaoView = ({ q }: { q: Questao }) => {
    const respostaUser = state.userResponses[q.id];
    const isRespondida = !!respostaUser;
    const isCorreta = respostaUser === q.correta;

    return (
      <div className={styles.questaoCard}>
        <div className={styles.enunciado}>{q.enunciado}</div>
        <div className={styles.alternativas}>
          {Object.entries(q.alternativas).map(([letra, texto]) => {
            let classe = styles.alternativa;
            if (isRespondida) {
              if (letra === q.correta) classe += ` ${styles.alternativaCorreta}`;
              else if (letra === respostaUser) classe += ` ${styles.alternativaIncorreta}`;
            } else if (respostaUser === letra) {
              classe += ` ${styles.alternativaSelecionada}`;
            }

            return (
              <button 
                key={letra} 
                className={classe}
                disabled={isRespondida}
                onClick={() => handleAnswerQuestao(q, letra)}
              >
                <strong>{letra})</strong> {texto}
              </button>
            );
          })}
        </div>
        {isRespondida && (
          <div className={styles.justificativa}>
            <strong>{isCorreta ? "✅ Correto!" : "❌ Incorreto."}</strong> {q.justificativa}
          </div>
        )}
      </div>
    );
  };

  if (showMobileFullscreen && state.questoes && state.questoes[mobileQuestionIndex]) {
    return (
      <FullscreenQuestion
        question={state.questoes[mobileQuestionIndex]}
        index={mobileQuestionIndex + 1}
        total={state.questoes.length}
        subject={subject}
        userResponse={state.userResponses[state.questoes[mobileQuestionIndex].id]}
        onBack={() => setShowMobileFullscreen(false)}
        onPrev={() => setMobileQuestionIndex(prev => Math.max(0, prev - 1))}
        onNext={() => {
          if (mobileQuestionIndex + 1 < state.questoes!.length) setMobileQuestionIndex(prev => prev + 1);
          else setShowMobileFullscreen(false);
        }}
        onAnswer={(alt) => handleAnswerQuestao(state.questoes![mobileQuestionIndex], alt)}
      />
    );
  }

  return (
    <div className={styles.topicDetails}>
      <div className={styles.topicTabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === "teoria" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("teoria")}
          style={activeTab === "teoria" ? { color: "#f68b33", borderColor: "#f68b33" } : {}}
        >
          Resumo + Dicas
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "flashcards" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("flashcards")}
          style={activeTab === "flashcards" ? { color: "#f68b33", borderColor: "#f68b33" } : {}}
        >
          Flashcards
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "questoes" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("questoes")}
          style={activeTab === "questoes" ? { color: "#f68b33", borderColor: "#f68b33" } : {}}
        >
          Questões
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* TEORIA TAB */}
      {activeTab === "teoria" && (
        <div>
          <div className="flex items-start gap-3 p-4 bg-[#f68b33]/10 border border-[#f68b33]/20 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
            <ShieldCheck className="w-5 h-5 text-[#f68b33] mt-0.5 shrink-0" />
            <span><strong>{getDisclaimerAivur(subject)}</strong></span>
          </div>
          
          {state.teoria ? (
            <div className={styles.teoriaContentWrapper}>
              <div className={styles.teoriaMarkdownContent}>
                <ReactMarkdown>{state.teoria}</ReactMarkdown>
              </div>
              <div className={styles.teoriaCtaBlock}>
                <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                  Terminou a leitura? Vamos consolidar o conhecimento.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button 
                    className={`${styles.btnPrimary} ${styles.btnPrimaryLarge}`}
                    onClick={() => setActiveTab("questoes")}
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    Praticar com Questões ➔
                  </button>
                  <button 
                    className={styles.generateBtn}
                    onClick={() => setActiveTab("flashcards")}
                    style={{ flex: 1 }}
                  >
                    Ir para Flashcards
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              className="bg-[#f68b33] hover:brightness-110 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-[#f68b33]/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => generateTeoria(topicLabel, subject, nicho)}
              disabled={isLoadingTeoria}
            >
              <Sparkles className="w-5 h-5" />
              {isLoadingTeoria ? "Gerando Resumo..." : "Gerar Resumo + Dicas"}
            </button>
          )}
        </div>
      )}

      {/* FLASHCARDS TAB */}
      {activeTab === "flashcards" && (
        <div>
          {state.flashcards ? (
            <div className={styles.flashcardList}>
              {state.flashcards.map(fc => <FlashcardView key={fc.id} fc={fc} />)}
            </div>
          ) : (
            <div>
              <p style={{fontSize: 13, marginBottom: 12, color: "var(--color-text-muted)"}}>
                Gera cartões de frente e verso rápidos sobre {topicLabel}. Requer que a Teoria já tenha sido gerada para melhor contexto.
              </p>
              
              {showFlashcardsWarning && (
                <div style={{ color: "var(--color-danger, #d32f2f)", fontSize: 13, marginBottom: 12, padding: "8px", backgroundColor: "rgba(211, 47, 47, 0.1)", borderRadius: "4px" }}>
                  Por favor, gere a Teoria primeiro na aba "Teoria + Dicas". A IA precisa dela como base para criar os flashcards.
                </div>
              )}
              
              <button 
                className={styles.generateBtn}
                onClick={() => {
                  if (!state.teoria) {
                    setShowFlashcardsWarning(true);
                    setTimeout(() => setShowFlashcardsWarning(false), 4000);
                    return;
                  }
                  generateFlashcards(topicLabel, subject, nicho);
                }}
                disabled={isLoadingFlashcards}
              >
                {isLoadingFlashcards ? "Gerando Flashcards..." : "Gerar Flashcards com IA"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUESTOES TAB */}
      {activeTab === "questoes" && (
        <div>
          {!state.questoes ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.filters}>
                <select className={styles.select} value={dificuldade} onChange={e => setDificuldade(e.target.value)}>
                  <option value="Fácil">Fácil</option>
                  <option value="Média">Média</option>
                  <option value="Difícil">Difícil</option>
                </select>
                {isConcurso && (
                  <select className={styles.select} value={banca} onChange={e => setBanca(e.target.value)}>
                    <option value="Padrão/Geral">Padrão/Geral (Sem Banca Específica)</option>
                    <option value="Vunesp">Vunesp (Múltipla Escolha Direta)</option>
                    <option value="Cebraspe">Cebraspe (Complexa / Múltipla Escolha)</option>
                    <option value="FGV">FGV (Casos Práticos)</option>
                    <option value="FCC">FCC (Letra de Lei)</option>
                  </select>
                )}
              </div>
              <button 
                className={styles.generateBtn}
                onClick={() => generateQuestoes(topicLabel, subject, nicho, dificuldade, banca)}
                disabled={isLoadingQuestoes}
              >
                {isLoadingQuestoes ? "Gerando Questões..." : "Gerar Questões Inéditas"}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: 13, fontWeight: "bold" }}>Filtro Atual: {dificuldade} {isConcurso ? `/ ${banca}` : ''}</span>
                <button 
                  className={styles.generateBtn}
                  style={{ padding: "4px 8px", fontSize: 11 }}
                  onClick={handleRegerarQuestoes}
                  disabled={isLoadingQuestoes}
                >
                  Regerar
                </button>
              </div>
              <div className="hidden md:block">
                <DesktopQuestionList
                  questions={state.questoes}
                  userResponses={state.userResponses}
                  subject={subject}
                  nicho={nicho}
                  topicLabel={topicLabel}
                  dificuldade={dificuldade}
                  banca={banca}
                  onAnswer={handleAnswerQuestao}
                />
              </div>
              
              <div className="md:hidden mt-4">
                <button 
                  className={styles.btnPrimary} 
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", fontWeight: "bold" }}
                  onClick={() => { setMobileQuestionIndex(0); setShowMobileFullscreen(true); }}
                >
                  Resolver Questões (Modo Foco)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
