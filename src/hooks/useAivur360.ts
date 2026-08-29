import { useState, useRef } from 'react';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://aivur-worker.cesarmuniz0816.workers.dev';

export interface Aivur360Plan {
  dailySchedule: { day: string; subjects: string[]; hours: number }[];
  focusAreas: string[];
  recommendations: string[];
}

export function useAivur360() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Aivur360Plan | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const generatePlan = async (config: { hours: number, date: string, daysOff: number[], editalText?: string, nivelInicial?: string }) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setProgress(0);
    
    // Fake progress bar that stops at 90%
    setProgressMsg("Coletando dados do perfil...");
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return 90;
        if (p === 30) setProgressMsg("Analisando histórico e lacunas...");
        if (p === 60) setProgressMsg("Estruturando blocos de hiperfoco...");
        if (p === 80) setProgressMsg("Finalizando cronograma adaptativo...");
        return p + 5;
      });
    }, 1000);

    abortControllerRef.current = new AbortController();

    const systemPrompt = `Você é o Mentor AIVUR 360. Crie um planejamento de estudos otimizado com base na carga horária: ${config.hours}h/dia, data da prova: ${config.date}, dias de descanso: ${config.daysOff.join(',')}, nivel: ${config.nivelInicial || 'iniciante'}. ${config.editalText ? `Edital/Tópicos: ${config.editalText}` : ''} Retorne um JSON com 'dailySchedule', 'focusAreas' e 'recommendations'.`;

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          mode: 'aivos360',
          type: 'planner',
          systemPrompt: systemPrompt,
          message: JSON.stringify(config),
          history: [],
          timestamp: Date.now()
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json() as { plan?: Aivur360Plan; reply?: string };
      clearInterval(interval);
      setProgress(100);
      setProgressMsg("Plano concluído!");
      
      if (data.plan) {
        setPlan(data.plan);
      } else if (data.reply) {
        try {
          const jsonStr = data.reply.replace(/```json/g, '').replace(/```/g, '');
          const parsed = JSON.parse(jsonStr);
          setPlan(parsed);
        } catch(e) {
          throw new Error('Falha ao processar a resposta estruturada do Mentor.');
        }
      } else {
        throw new Error('Formato inválido retornado pela IA.');
      }
    } catch (err: any) {
      clearInterval(interval);
      if (err.name === 'AbortError') {
        setError('Planejamento cancelado.');
      } else {
        setError(err.message || 'Erro ao gerar planejamento.');
      }
    } finally {
      setTimeout(() => setLoading(false), 500); // Give progress bar 0.5s to show 100%
    }
  };

  const cancelPlanner = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return { loading, error, plan, progress, progressMsg, generatePlan, cancelPlanner };
}
