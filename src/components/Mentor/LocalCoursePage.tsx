"use client";

import { useEffect, useState } from "react";
import { useLocalCourses } from "@/hooks/useLocalCourses";
import CoursePage from "./CoursePage";
import type { Course } from "@/types/course";
import styles from "./Mentor.module.css";
import Link from "next/link";

export default function LocalCoursePage({ courseId }: { courseId: string }) {
  const { courses, isHydrated, updateCourse } = useLocalCourses();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (isHydrated) {
      const found = courses.find((c) => c.id === courseId);
      setCourse(found || null);
    }
  }, [isHydrated, courses, courseId]);

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          Carregando trilha...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h2>Trilha no encontrada</h2>
          <p style={{ marginTop: "1rem" }}>
            Esta trilha pode ter sido removida ou no existe no seu dispositivo.
          </p>
          <Link href="/mentor" className={styles.backLink} style={{ display: "inline-block", marginTop: "2rem" }}>
            ? Voltar para Trilhas
          </Link>
        </div>
      </div>
    );
  }

  return <CoursePage course={course} onUpdateCourse={(updates) => updateCourse(course.id, updates)} />;
}
