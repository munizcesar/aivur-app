import type { StudyModule } from "@/mocks/studyPathMock";

export const studyService = {
  async fetchStudyPath(): Promise<StudyModule[]> {
    // Simulando latência de rede para renderização de Skeletons (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response = await fetch("/api/study-path");
    
    if (!response.ok) {
      throw new Error("Falha ao buscar os módulos de estudo.");
    }

    return response.json();
  },
};
