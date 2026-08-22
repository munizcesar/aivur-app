"use client";

import { useState, useEffect, useCallback } from "react";
import { get, set, del, keys } from "idb-keyval";
import type { Course } from "@/types/course";
import { markPendingSync } from "@/lib/sync";

const LOCAL_COURSES_KEY = "aivur_local_courses";

export function useLocalCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stored = await get<Course[]>(LOCAL_COURSES_KEY);
        if (stored) {
          setCourses(stored);
        }
      } catch (err) {
        console.error("Failed to load local courses", err);
      } finally {
        setIsHydrated(true);
      }
    }
    load();
  }, []);

  const saveCourse = useCallback(
    async (newCourse: Course) => {
      try {
        const updated = [...courses, newCourse];
        await set(LOCAL_COURSES_KEY, updated);
        setCourses(updated);
        markPendingSync(newCourse.id, "course_structure");
      } catch (err) {
        console.error("Failed to save course", err);
      }
    },
    [courses]
  );

  const garbageCollectOrphanTopics = async (activeCourses: Course[]) => {
    try {
      // Coleta todos os topicIds de todos os cursos ativos
      const activeTopicIds = new Set<string>();
      for (const course of activeCourses) {
        for (const subject of course.subjects) {
          for (const nicho of subject.nichos) {
            for (const item of nicho.items) {
              activeTopicIds.add(item.id);
            }
          }
        }
      }

      // Varre todas as chaves do IndexedDB
      const allKeys = await keys();
      const topicPrefix = "aivur_topic_";
      
      let deletedCount = 0;
      for (const key of allKeys) {
        if (typeof key === "string" && key.startsWith(topicPrefix)) {
          const topicId = key.replace(topicPrefix, "");
          if (!activeTopicIds.has(topicId)) {
            await del(key);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🗑️ Garbage Collector: ${deletedCount} tópicos órfãos removidos.`);
      }
    } catch (err) {
      console.error("Failed to run garbage collector", err);
    }
  };

  const deleteCourse = useCallback(
    async (courseId: string) => {
      try {
        const courseToDelete = courses.find((c) => c.id === courseId);
        
        if (courseToDelete) {
          // 1. Deletar tópicos diretamente do curso apagado (Abordagem C)
          for (const subject of courseToDelete.subjects) {
            for (const nicho of subject.nichos) {
              for (const item of nicho.items) {
                await del(`aivur_topic_${item.id}`);
              }
            }
          }
        }

        // 2. Deletar progresso (idb)
        await del(`aivur_progress_${courseId}`);
        
        // 3. Deletar checklist (localStorage)
        try {
          localStorage.removeItem(`aivur_checklist_${courseId}`);
        } catch (e) {
          // Ignore
        }

        // 4. Remover do array principal
        const updated = courses.filter((c) => c.id !== courseId);
        await set(LOCAL_COURSES_KEY, updated);
        setCourses(updated);
        
        // 5. Garantia dupla: Garbage Collector
        await garbageCollectOrphanTopics(updated);

      } catch (err) {
        console.error("Failed to delete course", err);
      }
    },
    [courses]
  );

  const updateCourse = useCallback(
    async (courseId: string, updates: Partial<Course>) => {
      try {
        const updated = courses.map((c) =>
          c.id === courseId ? { ...c, ...updates } : c
        );
        await set(LOCAL_COURSES_KEY, updated);
        setCourses(updated);
        markPendingSync(courseId, "course_structure");
        
        // 5b: Garbage collector for deleted topics
        await garbageCollectOrphanTopics(updated);
      } catch (err) {
        console.error("Failed to update course", err);
      }
    },
    [courses]
  );

  return { courses, saveCourse, deleteCourse, updateCourse, isHydrated };
}
