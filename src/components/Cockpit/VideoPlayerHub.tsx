"use client";

import { useState, useEffect } from "react";
import { PlayCircle, User } from "lucide-react";

interface VideoPlayerHubProps {
  topicTitle?: string;
  subjectName?: string;
}

export default function VideoPlayerHub({ topicTitle, subjectName }: VideoPlayerHubProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState("dQw4w9WgXcQ");

  // Query de busca contextual para concursos
  const searchQuery = encodeURIComponent(
    `concurso publico ${subjectName ?? "direito"} ${topicTitle ?? ""}`
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const alternativeVideos = [
    {
      id: "dQw4w9WgXcQ",
      title: `${topicTitle || 'Conteúdo Base'} - Aula Completa (Teoria)`,
      channel: "Prof. Especialista",
      thumb: `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
    },
    {
      id: "jNQXAC9IVRw",
      title: `${topicTitle || 'Revisão'} - Resumo Direto ao Ponto`,
      channel: "AIVUR Resumos",
      thumb: `https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg`,
    },
    {
      id: "ScMzIvxBSi4",
      title: `Questões Comentadas: ${topicTitle || 'Geral'}`,
      channel: "AIVUR Questões",
      thumb: `https://i.ytimg.com/vi/ScMzIvxBSi4/hqdefault.jpg`,
    },
  ];

  // SSR Hydration Guard
  if (!isMounted) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6">
        <div className="w-full max-w-4xl mx-auto aspect-video bg-slate-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200 my-4">
      {/* Player Principal */}
      <div className="w-full mb-6">
        <div className="aspect-video w-full bg-slate-900 rounded-lg overflow-hidden shadow-sm relative">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
            title="Videoaula Principal"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* Grade de Alternativas */}
      <div className="w-full">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PlayCircle size={20} className="shrink-0 flex-none text-emerald-600" />
          Outras Abordagens / Professores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {alternativeVideos.map((video) => {
            const isActive = video.id === activeVideoId;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setActiveVideoId(video.id)}
                className={`flex flex-col text-left group overflow-hidden rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer relative z-10 ${
                isActive 
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" 
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
              >
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumb}
                    alt={video.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                      <div className="bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <PlayCircle size={14} className="shrink-0 flex-none" /> Reproduzindo
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm text-slate-800 line-clamp-2 leading-snug mb-1.5">
                    {video.title}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={14} className="shrink-0 flex-none" /> {video.channel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
