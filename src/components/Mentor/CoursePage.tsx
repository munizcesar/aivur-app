"use client";

import { useState, useCallback } from "react";
import type { Course } from "@/types/course";
import { useChecklistState } from "@/hooks/useChecklistState";
import SubjectAccordion from "./SubjectAccordion";
import styles from "./Mentor.module.css";
import Link from "next/link";
import { CourseProvider } from "@/context/CourseContext";

interface CoursePageProps {
  course: Course;
  onUpdateCourse?: (updates: Partial<Course>) => void;
}

export default function CoursePage({ course, onUpdateCourse }: CoursePageProps) {
  const { checked, toggle, resetAll, isHydrated } = useChecklistState(course.id);

  // Estado de abertura dos accordions — completamente separado do progresso
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(
    new Set([course.subjects[0]?.subject ?? ""])
  );
  
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleOpen = useCallback((subjectName: string) => {
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectName)) {
        next.delete(subjectName);
      } else {
        next.add(subjectName);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        `Tem certeza que deseja zerar o progresso de "${course.title}"? Esta ação não pode ser desfeita.`
      )
    ) {
      resetAll();
    }
  }, [course.title, resetAll]);

  const totalItems = course.subjects.reduce(
    (acc, s) => acc + s.nichos.reduce((a, n) => a + n.items.length, 0),
    0
  );
  const doneItems = isHydrated ? checked.size : 0;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/mentor" className={styles.backLink}>
          ← Voltar para Trilhas
        </Link>
        {onUpdateCourse && (
          <button 
            className={styles.resetBtn} 
            style={{ padding: "6px 12px", background: isEditing ? "var(--color-primary)" : "var(--bg-card)", color: isEditing ? "white" : "var(--color-text)", margin: 0, marginTop: "1rem" }}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Salvar Estrutura" : "Editar Estrutura"}
          </button>
        )}
      </div>

      {/* Header fixo com badge e progresso */}
      <header className={styles.courseHeader}>
        <div className={styles.courseBadge} aria-hidden="true">
          <svg className={styles.courseBadgeSvg} viewBox="0 0 68 78">
            <path
              d="M34 2 L64 12 L64 40 C64 60 50 72 34 76 C18 72 4 60 4 40 L4 12 Z"
              fill="white"
              stroke="#B8891E"
              strokeWidth="2"
            />
          </svg>
          <div className={styles.courseBadgePct}>{pct}%</div>
        </div>

        <div className={styles.courseHeaderInfo}>
          <h1 className={styles.courseHeaderTitle}>Checklist de Conteúdo</h1>
          <p className={styles.courseHeaderSub}>{course.title}</p>
          <div className={styles.courseHeaderStat}>
            <b>{doneItems}</b> de <b>{totalItems}</b> tópicos estudados
          </div>
          <div className={styles.progressBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      {/* Lista de matérias */}
      <CourseProvider courseId={course.id}>
        <div className={styles.courseBody}>
          {course.subjects.map((subject, subjectIndex) => (
            <SubjectAccordion
              key={subject.subject}
              subject={subject}
              checked={checked}
              onToggle={toggle}
              isOpen={openSubjects.has(subject.subject)}
              onToggleOpen={() => handleToggleOpen(subject.subject)}
              onEnterReview={() => setOpenSubjects(new Set([subject.subject]))}
              isEditing={isEditing}
              onUpdateSubject={(newSubject) => {
                if (!onUpdateCourse) return;
                const newSubjects = [...course.subjects];
                if (newSubject === null) {
                  // Remove subject
                  newSubjects.splice(subjectIndex, 1);
                } else {
                  newSubjects[subjectIndex] = newSubject;
                }
                onUpdateCourse({ subjects: newSubjects });
              }}
            />
          ))}

          {isEditing && onUpdateCourse && (
            <button
              className={styles.resetBtn}
              style={{ background: "var(--color-primary)", color: "white" }}
              onClick={() => {
                const name = window.prompt("Nome da nova matéria:");
                if (name) {
                  onUpdateCourse({
                    subjects: [...course.subjects, { subject: name, ytTerm: name, nichos: [] }]
                  });
                }
              }}
            >
              + Adicionar Matéria
            </button>
          )}

          <button
            className={styles.resetBtn}
            onClick={handleReset}
            id="reset-progress-btn"
          >
            Zerar progresso deste curso
          </button>
        </div>
      </CourseProvider>
    </div>
  );
}
