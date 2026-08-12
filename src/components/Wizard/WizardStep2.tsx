"use client";
import { useState } from "react";

import { useQuizStore } from "@/store/useQuizStore";
import { concursosFilters, concursoTopicMap, bancas, agencias, niveis } from "@/lib/constants";
import { BookOpen, Landmark, Calendar, Brain, ListChecks, SlidersHorizontal, ClipboardList, Rows3 } from "lucide-react";
import styles from "./Wizard.module.css";

export default function WizardStep2() {
  const mode = useQuizStore((state) => state.mode);
  const filters = useQuizStore((state) => state.filters);
  const setFilters = useQuizStore((state) => state.setFilters);
  const freeStudy = useQuizStore((state) => state.freeStudy);
  const setFreeStudy = useQuizStore((state) => state.setFreeStudy);
  const setStep = useQuizStore((state) => state.setStep);
  const [essayText, setEssayText] = useState("");
  const [aivosHours, setAivosHours] = useState(4);
  const [aivosDate, setAivosDate] = useState("");

  const handleSelectChange = (field: string, value: string) => {
    setFilters({ [field]: value });
  };

  const handleFreeStudyChange = (value: string) => {
    setFreeStudy({ text: value });
  };

  const handleNextStep = () => {
    if (mode === 'redacao') {
      setFreeStudy({ text: essayText });
    } else if (mode === 'aivos360') {
      const editalText = useQuizStore.getState().editalText;
      const nivelInicial = filters.nivel === 'Todos' ? 'iniciante' : filters.nivel;
      setFreeStudy({ text: JSON.stringify({ hours: aivosHours, date: aivosDate, daysOff: [], editalText, nivelInicial }) });
    }
    setStep(3);
  };

  const renderConcursoFilters = () => {
    const disciplineOptions = Object.entries(concursosFilters).map(([key, v]) => {
      const suffix = key.replace('concursos.', '');
      return (
        <option key={suffix} value={suffix}>
          {v.label}
        </option>
      );
    });

    const topicsForDiscipline = filters.materia && filters.materia !== 'Todas' 
      ? (concursoTopicMap[filters.materia] || []) 
      : [];

    return (
      <>
        <div className={styles.cafSection}>
          <div className={styles.cafSectionTitle}>
            <BookOpen width={14} height={14} /> Conteúdo
          </div>
          <div className={styles.cafGrid}>
            <div className={styles.cafField} style={{ gridColumn: "1 / -1" }}>
              <label className={styles.cafLabel}>Disciplina *</label>
              <select 
                className={styles.cafSelect} 
                value={filters.materia === 'Todas' ? '' : filters.materia}
                onChange={(e) => {
                  handleSelectChange('materia', e.target.value || 'Todas');
                  handleSelectChange('assunto', 'Todos'); // Reset topic when discipline changes
                }}
              >
                <option value="">Selecione a disciplina...</option>
                {disciplineOptions}
              </select>
            </div>
            <div className={styles.cafField}>
              <label className={styles.cafLabel}>Tópico</label>
              <select 
                className={styles.cafSelect} 
                value={filters.assunto === 'Todos' ? '' : filters.assunto}
                onChange={(e) => handleSelectChange('assunto', e.target.value || 'Todos')}
                disabled={filters.materia === 'Todas'}
              >
                <option value="">Disciplina completa</option>
                {topicsForDiscipline.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.cafSection}>
          <div className={styles.cafSectionTitle}>
            <Landmark width={14} height={14} /> Concurso (opcional)
          </div>
          <div className={styles.cafGrid}>
            <div className={styles.cafField}>
              <label className={styles.cafLabel}>Banca Examinadora</label>
              <select 
                className={styles.cafSelect}
                value={filters.banca === 'Todas' ? '' : filters.banca}
                onChange={(e) => handleSelectChange('banca', e.target.value || 'Todas')}
              >
                <option value="">Qualquer banca</option>
                {bancas.filter(b => b !== 'Todas').map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className={styles.cafField}>
              <label className={styles.cafLabel}>Órgão / Instituição</label>
              <select 
                className={styles.cafSelect}
                value={filters.orgao === 'Todos' ? '' : filters.orgao}
                onChange={(e) => handleSelectChange('orgao', e.target.value || 'Todos')}
              >
                <option value="">Qualquer órgão</option>
                {agencias.filter(a => a !== 'Todas').map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className={styles.cafField}>
              <label className={styles.cafLabel}>Cargo</label>
              <input 
                type="text" 
                className={styles.cafInput} 
                placeholder="Ex: Analista Judiciário..." 
                value={filters.cargo === 'Todos' ? '' : filters.cargo}
                onChange={(e) => handleSelectChange('cargo', e.target.value || 'Todos')}
              />
            </div>
            <div className={styles.cafField}>
              <label className={styles.cafLabel}>Nível de Escolaridade</label>
              <select 
                className={styles.cafSelect}
                value={filters.nivel === 'Todos' ? '' : filters.nivel}
                onChange={(e) => handleSelectChange('nivel', e.target.value || 'Todos')}
              >
                <option value="">Qualquer nível</option>
                {niveis.filter(n => n.v !== 'Todas').map(n => <option key={n.v} value={n.v}>{n.l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.cafSection}>
          <div className={styles.cafSectionTitle}>
            <Calendar width={14} height={14} /> Período da Prova (opcional)
          </div>
          <div className={styles.cafGrid}>
            <div className={styles.cafField}>
              <label className={styles.cafLabel}>Ano</label>
              <input 
                type="text" 
                className={styles.cafInput} 
                placeholder="Ex: 2024" 
                value={filters.ano === 'Todos' ? '' : filters.ano}
                onChange={(e) => handleSelectChange('ano', e.target.value || 'Todos')}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderSessionConfig = () => {
    return (
      <div style={{ marginTop: "var(--space-6)" }}>
        <h2 className={styles.stepTitle}>Configuração da Sessão</h2>
        <p className={styles.stepSubtitle}>Ajuste a quantidade e a dificuldade das questões</p>
        
        <div className={styles.sessionConfigGrid}>
          <div className={`${styles.sessionConfigCard} ${styles.primary} ${styles.configGroup}`}>
            <div className={styles.sessionCardHead}>
              <ListChecks width={18} height={18} />
              <div>
                <label className={styles.configLabel}>Quantidade de questões</label>
              </div>
            </div>
            <div className={styles.sliderValueRow}>
              <span>5</span>
              <span className={styles.qtyPill}>{filters.quantidade}</span>
              <span>50</span>
            </div>
            <input 
              type="range" 
              className={styles.rangeInput}
              min="5" 
              max="50" 
              step="5" 
              value={filters.quantidade} 
              onChange={(e) => handleSelectChange('quantidade', e.target.value)}
              aria-label="Quantidade de questões" 
            />
          </div>

          <div className={`${styles.sessionConfigCard} ${styles.configGroup}`}>
            <div className={styles.sessionCardHead}>
              <SlidersHorizontal width={18} height={18} />
              <div>
                <label className={styles.configLabel}>Dificuldade</label>
              </div>
            </div>
            <div className={styles.chipGroup} role="group">
              <button 
                className={`${styles.chip} ${filters.dificuldade === 'easy' ? styles.active : ''}`} 
                onClick={() => handleSelectChange('dificuldade', 'easy')}
              >
                <span className={styles.dot} style={{ background: "#437a22" }}></span> Fácil
              </button>
              <button 
                className={`${styles.chip} ${filters.dificuldade === 'medium' ? styles.active : ''}`} 
                onClick={() => handleSelectChange('dificuldade', 'medium')}
              >
                <span className={styles.dot} style={{ background: "#D4A827" }}></span> Médio
              </button>
              <button 
                className={`${styles.chip} ${filters.dificuldade === 'hard' ? styles.active : ''}`} 
                onClick={() => handleSelectChange('dificuldade', 'hard')}
              >
                <span className={styles.dot} style={{ background: "#c0392b" }}></span> Difícil
              </button>
            </div>
          </div>

          <div className={`${styles.sessionConfigCard} ${styles.configGroup}`}>
            <div className={styles.sessionCardHead}>
              <ClipboardList width={18} height={18} />
              <div>
                <label className={styles.configLabel}>Tipo de questão</label>
              </div>
            </div>
            <div className={styles.chipGroup} role="group">
              <button 
                className={`${styles.chip} ${filters.tipoQuestao === 'mc' ? styles.active : ''}`} 
                onClick={() => handleSelectChange('tipoQuestao', 'mc')}
              >
                Múltipla escolha
              </button>
              <button 
                className={`${styles.chip} ${filters.tipoQuestao === 'vf' ? styles.active : ''}`} 
                onClick={() => handleSelectChange('tipoQuestao', 'vf')}
              >
                Certo/Errado
              </button>
              <button 
                className={`${styles.chip} ${filters.tipoQuestao === 'mix' ? styles.active : ''}`} 
                onClick={() => handleSelectChange('tipoQuestao', 'mix')}
              >
                Misto
              </button>
            </div>
          </div>

          <div className={`${styles.sessionConfigCard} ${styles.configGroup}`}>
            <div className={styles.sessionCardHead}>
              <Rows3 width={18} height={18} />
              <div>
                <label className={styles.configLabel}>Alternativas</label>
              </div>
            </div>
            <div className={styles.chipGroup} role="group">
              <button 
                className={`${styles.chip} ${filters.alternativas === 4 ? styles.active : ''}`} 
                onClick={() => handleSelectChange('alternativas', '4')}
              >
                4
              </button>
              <button 
                className={`${styles.chip} ${filters.alternativas === 5 ? styles.active : ''}`} 
                onClick={() => handleSelectChange('alternativas', '5')}
              >
                5
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLivreFilters = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <h3 style={{ marginBottom: "var(--space-2)", color: "var(--color-text)" }}>Importar Material</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Cole um texto, link (YouTube/Site) ou digite para transformá-lo em recursos de estudo estruturados.
          </p>
        </div>
        <textarea 
          placeholder="Cole o texto, transcrição ou conteúdo do PDF aqui..." 
          rows={6} 
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
          value={freeStudy?.text || ""}
          onChange={(e) => handleFreeStudyChange(e.target.value)}
        />
      </div>
    );
  };

  const renderRedacaoFilters = () => {
    return (
      <>
        <h2 className={styles.stepTitle}>Configurar Sessão de Redação</h2>
        <p className={styles.stepSubtitle}>Escolha a banca para ajustar o nível de exigência da sua correção.</p>
        <div style={{ marginBottom: "var(--space-6)" }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>Banca Examinadora</label>
          <select 
            className={styles.cafSelect}
            value={filters.banca === 'Todas' ? 'ENEM' : filters.banca}
            onChange={(e) => handleSelectChange('banca', e.target.value)}
          >
            <option value="ENEM">ENEM</option>
            <option value="FCC">FCC</option>
            <option value="Vunesp">Vunesp</option>
            <option value="Cebraspe">Cebraspe</option>
          </select>
        </div>
        <div style={{ marginTop: "1rem", padding: "16px", background: "var(--color-surface-offset)", borderRadius: "8px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", marginBottom: "8px" }}>
            <Brain width={20} height={20} /> Correção Imediata
          </h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.6, marginBottom: "16px" }}>
            Cole sua redação completa abaixo. O Coach fará a análise profunda de todas as competências da banca.
          </p>
          <textarea 
            placeholder="Cole o texto da sua redação aqui..." 
            rows={10} 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", resize: "vertical" }}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
          />
        </div>
      </>
    );
  };

  return (
    <div className={styles.wizardStep}>
      {mode === 'concurso' && (
        <>
          <h2 className={styles.stepTitle}>Configure sua busca</h2>
          <p className={styles.stepSubtitle}>Filtre por disciplina, banca, órgão e cargo — como no QConcursos</p>
          {renderConcursoFilters()}
          {renderSessionConfig()}
        </>
      )}
      {mode === 'livre' && (
        <>
          {renderLivreFilters()}
          {renderSessionConfig()}
        </>
      )}
      {mode === 'redacao' && renderRedacaoFilters()}
      {mode === 'aivos360' && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <h2 className={styles.stepTitle}>Raio-X do Edital</h2>
            <p className={styles.stepSubtitle} style={{ marginBottom: "24px" }}>Forneça os detalhes do seu edital para iniciarmos o mapeamento.</p>
          </div>
          
          <div className={styles.configGroup}>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "8px" }}>Descrição do Edital</label>
            <textarea 
              placeholder="Cole aqui os tópicos do seu edital ou descreva o concurso..." 
              rows={4} 
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", resize: "vertical" }}
              value={useQuizStore.getState().editalText || ""}
              onChange={(e) => useQuizStore.getState().setEditalText(e.target.value)}
            />
          </div>

          <div className={styles.configGroup}>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "8px" }}>Nível Inicial</label>
            <select 
              className={styles.cafSelect}
              onChange={(e) => handleSelectChange('nivel', e.target.value)}
              value={filters.nivel === 'Todos' ? 'iniciante' : filters.nivel}
            >
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
          
          <div className={styles.configGroup}>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "8px" }}>Planejamento de Horas (Opcional)</label>
            <input 
              type="number" 
              min="1" max="16" 
              placeholder="Ex: 4"
              value={aivosHours} 
              onChange={(e) => setAivosHours(Number(e.target.value))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", marginBottom: "8px" }}
            />
          </div>
          
          <div className={styles.configGroup}>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "8px" }}>Data da Prova (Opcional)</label>
            <input 
              type="date" 
              value={aivosDate} 
              onChange={(e) => setAivosDate(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", borderTop: "1px solid var(--color-border)", paddingTop: "24px" }}>
        <button className="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
        <button 
          className="btn btn-primary" 
          onClick={handleNextStep}
          disabled={
            (mode === 'concurso' && (filters.materia === 'Todas' || !filters.materia)) ||
            (mode === 'redacao' && essayText.length < 50) ||
            (mode === 'aivos360' && !aivosDate)
          }
        >
          {mode === 'redacao' ? 'Corrigir Redação' : (mode === 'aivos360' ? 'Gerar Planejamento' : 'Avançar para Simulado')}
        </button>
      </div>
    </div>
  );
}
