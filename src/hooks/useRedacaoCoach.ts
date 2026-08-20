import { useState, useRef } from 'react';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://studymaster-worker.cesarmuniz0816.workers.dev';

export interface RedacaoResult {
  scores: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  summary: string;
  strongPoints: string[];
  problems: string[];
  nextSteps: string[];
}

export function useRedacaoCoach() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedacaoResult | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const gradeEssay = async (essayText: string, banca: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    // Cyclical messages simulation
    const msgs = [
      "Lendo introdução e tese...",
      "Analisando coesão (C4)...",
      "Avaliando proposta de intervenção...",
      "Calculando nota final...",
      "Estruturando feedback..."
    ];
    let msgIdx = 0;
    setProgressMsg(msgs[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setProgressMsg(msgs[msgIdx]);
    }, 4000);

    abortControllerRef.current = new AbortController();

    const systemPrompt = `Você é um corretor especialista da banca ${banca}. Corrija a redação abaixo e retorne APENAS um JSON estruturado com 'scores' (c1 a c5, de 0 a 200 cada), 'summary', 'strongPoints', 'problems' e 'nextSteps' (arrays de strings).`;

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          mode: 'redbot',
          type: 'essay',
          systemPrompt: systemPrompt,
          message: essayText,
          history: [],
          timestamp: Date.now()
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json() as Partial<RedacaoResult> & { reply?: string };
      clearInterval(interval);
      
      if (data.scores) {
        setResult(data as RedacaoResult);
      } else if (data.reply) {
        // Fallback for LLMs that return stringified JSON in 'reply'
        try {
          const jsonStr = data.reply.replace(/```json/g, '').replace(/```/g, '');
          const parsed = JSON.parse(jsonStr);
          setResult(parsed);
        } catch(e) {
          throw new Error('Falha ao processar o formato da resposta do corretor.');
        }
      } else {
        throw new Error('Formato inválido retornado pela IA.');
      }
    } catch (err: any) {
      clearInterval(interval);
      if (err.name === 'AbortError') {
        setError('Correção cancelada.');
      } else {
        setError(err.message || 'Erro ao comunicar com o servidor de IA.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelGrader = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return { loading, error, result, progressMsg, gradeEssay, cancelGrader };
}
