"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div key={course.id} style={{ position: "relative" }}>
        <Link
          href={`/mentor/${course.id}`}
          className={`${styles.courseCard} transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] border border-border/40 dark:border-white/10 shadow-sm p-4 md:p-6`}
          id={`course-card-${course.id}`}
        >
          <div className={styles.courseCardIcon} aria-hidden="true">
            📚
          </div>
          <div className={`${styles.courseCardTitle} font-semibold tracking-tight`}>{course.title}</div>
          <div className={styles.courseCardMeta}>
            {subjectCount} matéria{subjectCount !== 1 ? "s" : ""} • {totalItems} tópicos
          </div>
          <div className={styles.courseCardArrow}>
            Acessar trilha ➔
          </div>
        </Link>
        {isLocal && (
          <div className={styles.courseCardActions}>
            <button
              className={styles.cardActionBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingCourse({ id: course.id, title: course.title });
              }}
              title="Renomear trilha"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button
              className={`${styles.cardActionBtn} ${styles.delete}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeletingCourse(course.id);
              }}
              title="Excluir trilha"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.listHeader}>
        <p className={styles.listEyebrow}>Mentor AIVUR 360</p>
        <h1 className={styles.listTitle}>Suas Trilhas de Curso</h1>
        <p className={styles.listSubtitle}>
          Acompanhe seu progresso tópico a tópico, organizados pelo edital do seu concurso.
        </p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem" }}>Cursos Oficiais</h2>
        <div className={styles.courseGrid}>
          {ALL_COURSES.map(c => renderCourseCard(c, false))}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Meus Cursos Gerados</h2>
          <Link href="/mentor/gerar" style={{ backgroundColor: "white", color: "black", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "600", textDecoration: "none", fontSize: "0.9rem" }} className="transition-transform duration-150 active:scale-95">
            + Criar Nova Trilha
          </Link>
        </div>
        
        {isHydrated ? (
          localCourses.length > 0 ? (
            <div className={styles.courseGrid}>
              {localCourses.map(c => renderCourseCard(c, true))}
            </div>
          ) : (
            <div style={{ padding: "2rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "12px", textAlign: "center" }} className="border border-border/40 dark:border-white/10 shadow-sm">
              <p style={{ color: "#a1a1aa", marginBottom: "1rem" }}>Você ainda não gerou nenhuma trilha de estudos personalizada.</p>
              <Link href="/mentor/gerar" style={{ backgroundColor: "white", color: "black", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "600", textDecoration: "none" }} className="transition-transform duration-150 active:scale-95">
                Gerar com IA agora
              </Link>
            </div>
          )
        ) : (
          <p>Carregando seus cursos...</p>
        )}
      </div>

      {/* MODAL EDITAR NOME */}
      {editingCourse && (
        <div className={styles.modalOverlay} onClick={() => setEditingCourse(null)}>
          <div className={`${styles.modalContent} backdrop-blur-md bg-background/80`} onClick={e => e.stopPropagation()}>
            <h3 className={`${styles.modalTitle} font-semibold tracking-tight`}>Renomear Trilha</h3>
            <input 
              autoFocus
              className={styles.modalInput}
              value={editingCourse.title}
              onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCourse(editingCourse.id, { title: editingCourse.title });
                  setEditingCourse(null);
                }
              }}
            />
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.modalBtnCancel} transition-transform duration-150 active:scale-95`} onClick={() => setEditingCourse(null)}>Cancelar</button>
              <button className={`${styles.modalBtn} ${styles.modalBtnConfirm} transition-transform duration-150 active:scale-95`} onClick={() => {
                updateCourse(editingCourse.id, { title: editingCourse.title });
                setEditingCourse(null);
              }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR CURSO */}
      {deletingCourse && (
        <div className={styles.modalOverlay} onClick={() => setDeletingCourse(null)}>
          <div className={`${styles.modalContent} backdrop-blur-md bg-background/80`} onClick={e => e.stopPropagation()}>
            <h3 className={`${styles.modalTitle} font-semibold tracking-tight`}>Excluir Trilha</h3>
            <p className={styles.modalText}>Tem certeza? Essa ação apaga todo o progresso e conteúdo gerado desse curso e não pode ser desfeita.</p>
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.modalBtnCancel} transition-transform duration-150 active:scale-95`} onClick={() => setDeletingCourse(null)}>Cancelar</button>
              <button className={`${styles.modalBtn} ${styles.modalBtnDanger} transition-transform duration-150 active:scale-95`} onClick={() => {
                deleteCourse(deletingCourse);
                setDeletingCourse(null);
              }}>Sim, excluir trilha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
