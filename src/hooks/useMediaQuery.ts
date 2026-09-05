import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Inicializa como false para evitar Hydration Mismatch no SSR (Next.js)
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Seta o estado inicial no lado do cliente
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Atualiza o estado quando a tela for redimensionada
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
}