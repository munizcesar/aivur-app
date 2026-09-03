"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Search, Target, BookOpen, ArrowRight } from "lucide-react";

interface GeneratorFormProps {
  onSubmit: (data: { edital: string; nivel: string; objetivo: string }) => void;
}

export function GeneratorForm({ onSubmit }: GeneratorFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const data = {
      edital: formData.get("edital") as string,
      nivel: formData.get("nivel") as string,
      objetivo: formData.get("objetivo") as string,
    };

    if (data.edital && data.nivel) {
      onSubmit(data);
    }
  };

  return (
    <motion.form 
      ref={formRef}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5 w-full h-full justify-between"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Nova Trilha de Alta Performance
          </h2>
          <p className="text-sm text-slate-400">
            Defina os parâmetros do seu concurso. A IA forjará o plano ideal.
          </p>
        </div>

        {/* Inputs Otimizados (Uncontrolled = Zero Re-renders por keystroke) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="edital" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Edital / Banca
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                id="edital"
                name="edital"
                type="text" 
                required
                placeholder="Ex: Polícia Federal 2024 - Cebraspe"
                className="w-full h-11 pl-10 pr-4 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="nivel" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nível Atual
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select 
                id="nivel"
                name="nivel"
                required
                defaultValue="intermediario"
                className="w-full h-11 pl-10 pr-4 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="iniciante" className="bg-slate-900">Iniciante (Conhecimento Básico)</option>
                <option value="intermediario" className="bg-slate-900">Intermediário (Já estudo há meses)</option>
                <option value="avancado" className="bg-slate-900">Avançado (Foco em Revisão/Exercícios)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="objetivo" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Foco Específico (Opcional)
          </label>
          <textarea 
            id="objetivo"
            name="objetivo"
            rows={2}
            placeholder="Ex: Preciso focar intensamente em Raciocínio Lógico e Direito Administrativo."
            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
          />
        </div>
      </div>

      <button 
        type="submit"
        className="mt-2 w-full md:w-auto self-end inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 group"
      >
        Forjar Trilha
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.form>
  );
}
