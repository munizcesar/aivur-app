"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Database, Sparkles, CheckCircle2 } from "lucide-react";

const PIPELINE_STEPS = [
  { id: 1, text: "Analisando Edital e Banca...", icon: Database },
  { id: 2, text: "Processando Matriz de Conhecimento...", icon: BrainCircuit },
  { id: 3, text: "Forjando Trilha Otimizada...", icon: Sparkles },
];

interface ProcessingStateProps {
  currentStepIndex: number;
  stepMessage?: string;
}

export function ProcessingState({ currentStepIndex, stepMessage }: ProcessingStateProps) {
  // O estado agora é controlado externamente via SSE Stream

  return (
    <motion.div 
      key="processing"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full flex flex-col items-center justify-center p-6 space-y-6"
    >
      <div className="relative flex items-center justify-center">
        {/* Camadas de Pulso (Efeito Holográfico) */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-24 h-24 bg-indigo-500/30 rounded-full blur-xl"
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
        >
          <BrainCircuit className="w-8 h-8 text-white" />
        </motion.div>
      </div>

      <div className="w-full max-w-sm space-y-3 relative z-10">
        <AnimatePresence mode="popLayout">
          {PIPELINE_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            // Só renderiza o step ativo e o imediatamente anterior (concluído)
            if (!isActive && !isCompleted) return null;

            const Icon = isCompleted ? CheckCircle2 : step.icon;

            return (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: isActive ? 1 : 0.4, x: 0, height: "auto" }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isActive 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "bg-slate-900/50 border-white/5 text-slate-400"
                }`}
              >
                <motion.div
                  animate={isActive && !isCompleted ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <Icon className={`w-5 h-5 ${isCompleted ? "text-emerald-400" : isActive ? "text-indigo-400" : "text-slate-500"}`} />
                </motion.div>
                <span className="text-sm font-medium tracking-wide">
                  {step.text}
                </span>
                
                {isActive && (
                  <motion.div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
