"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GeneratorForm } from "./GeneratorForm";
import { ProcessingState } from "./ProcessingState";
import { TrilhaViewer, TrilhaData } from "./TrilhaViewer";

type GeneratorStatus = "idle" | "processing" | "success";

const STORAGE_KEY = "aivur_active_trilha";

export function TrilhaGenerator() {
  const [status, setStatus] = useState<GeneratorStatus>("idle");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepMessage, setStepMessage] = useState<string>("");
  const [trilhaData, setTrilhaData] = useState<TrilhaData | null>(null);

  // Restauração Instantânea da Sessão
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.modules) {
          setTrilhaData(parsed);
          setStatus("success");
        }
      }
    } catch (e) {
      console.error("Falha ao restaurar trilha da sessão.");
    }
  }, []);

  const handleGenerate = async (data: { edital: string; nivel: string; objetivo: string }) => {
    try {
      setStatus("processing");
      setCurrentStep(0);
      setStepMessage("Iniciando conexão com Motor de IA...");
      setTrilhaData(null);
      localStorage.removeItem(STORAGE_KEY);

      const response = await fetch("/api/generate-trilha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Falha na geração");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") {
                setStatus("success");
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.step) {
                  setCurrentStep(parsed.step - 1);
                }
                if (parsed.message) {
                  setStepMessage(parsed.message);
                }
                if (parsed.trilha) {
                  setTrilhaData(parsed.trilha);
                  // Persistência local para evitar re-render em F5
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.trilha));
                }
              } catch (e) {
                // Ignore invalid JSON chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("idle"); // Fallback rudimentar para erro (o ideal seria Error Boundary granular ou Toast)
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setTrilhaData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <GeneratorForm key="form" onSubmit={handleGenerate} />
        )}
        
        {status === "processing" && (
          <ProcessingState 
            key="processing" 
            currentStepIndex={currentStep} 
            stepMessage={stepMessage} 
          />
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <TrilhaViewer data={trilhaData} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TrilhaGenerator;
