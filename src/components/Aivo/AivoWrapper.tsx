"use client";

import dynamic from 'next/dynamic';

const DynamicAivoWidget = dynamic(() => import('./AivoWidget'), {
  ssr: false, // Prevent SSR since it relies on window/zustand heavily and we want lazy loading
});

export default function AivoWrapper() {
  return <DynamicAivoWidget />;
}
