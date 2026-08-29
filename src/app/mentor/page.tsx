"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ALL_COURSES } from "@/data/courses";
import { useLocalCourses } from "@/hooks/useLocalCourses";
import styles from "@/components/Mentor/Mentor.module.css";
import type { Course } from "@/types/course";

export default function MentorPage() {
  const { courses: localCourses, isHydrated, deleteCourse, updateCourse } = useLocalCourses();
  
  const [editingCourse, setEditingCourse] = useState<{ id: string; title: string } | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

  const renderCourseCard = (course: Course, isLocal = false) => {
    const totalItems = course.subjects.reduce(
      (acc, s) => acc + s.nichos.reduce((a, n) => a + n.items.length, 0),
      0
    );
    const subjectCount = course.subjects.length;

    return (
      <div 
        key={course.id} 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3 transition-colors hover:border-red-700/50 group"
      >
        <div className="flex justify-between items-start mb-1">
          <div className="bg-red-700/10 p-3 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-red-700" />
          </div>
          {isLocal && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-2 text-slate-400 hover:text-red-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingCourse({ id: course.id, title: course.title });
                }}
                title="Renomear trilha"
              >
                ✏️
              </button>
              <button
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeletingCourse(course.id);
                }}
                title="Excluir trilha"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-white line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 flex-grow">
          {subjectCount} matéria{subjectCount !== 1 ? "s" : ""} • {totalItems} tópicos
        </p>
        
        <Link
          href={`/mentor/${course.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-red-700 rounded-lg font-bold transition-colors text-sm"
        >
          ▶ Continuar Estudos
        </Link>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Minhas Trilhas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe seu progresso e acesse seus editais estruturados.</p>
        </div>
        
        <Link 
          href="/mentor/gerar" 
          className="bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-red-700/20 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Criar Nova Trilha
        </Link>
      </div>

      <div className="space-y-10 pb-12">
        {isHydrated ? (
          <>
            {(localCourses.length > 0 || ALL_COURSES.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localCourses.map(c => renderCourseCard(c, true))}
                {ALL_COURSES.map(c => renderCourseCard(c, false))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-sm">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 text-4xl">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Sua jornada de aprovação começa aqui</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                  Cole seu edital ou matéria e deixe nossa IA estruturar o seu plano de estudos e cronograma em segundos. Nenhuma trilha foi criada ainda.
                </p>
                <Link 
                  href="/mentor/gerar" 
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-700/20 transition-all flex items-center gap-2"
                >
                  <span className="text-xl leading-none">+</span>
                  Gerar Minha Primeira Trilha
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-500">Carregando suas trilhas...</p>
          </div>
        )}
      </div>

      {/* MODAL EDITAR NOME */}
      {editingCourse && (
        <div className={styles.modalOverlay} onClick={() => setEditingCourse(null)}>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4 shadow-xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Renomear Trilha</h3>
            <input 
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 mb-6 text-slate-900 dark:text-white outline-none transition-all"
              value={editingCourse.title}
              onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCourse(editingCourse.id, { title: editingCourse.title });
                  setEditingCourse(null);
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button 
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setEditingCourse(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-5 py-2.5 rounded-lg font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                onClick={() => {
                  updateCourse(editingCourse.id, { title: editingCourse.title });
                  setEditingCourse(null);
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR CURSO */}
      {deletingCourse && (
        <div className={styles.modalOverlay} onClick={() => setDeletingCourse(null)}>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4 shadow-xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Excluir Trilha</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Tem certeza? Essa ação apaga todo o progresso e conteúdo gerado desse curso e não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setDeletingCourse(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-5 py-2.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                onClick={() => {
                  deleteCourse(deletingCourse);
                  setDeletingCourse(null);
                }}
              >
                Sim, excluir trilha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
