import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_COURSES } from "@/data/courses";
import CoursePage from "@/components/Mentor/CoursePage";
import LocalCoursePage from "@/components/Mentor/LocalCoursePage";

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  
  if (courseId.startsWith("local-")) {
    return {
      title: "Trilha Gerada | AIVUR",
      description: "Acompanhe seu progresso na sua trilha de conteúdo personalizada.",
    };
  }

  const course = ALL_COURSES.find((c) => c.id === courseId);
  if (!course) return { title: "Trilha não encontrada — AIVUR" };
  return {
    title: `${course.title} — Trilha de Conteúdo | AIVUR`,
    description: `Checklist de tópicos para ${course.title}. Acompanhe seu progresso matéria a matéria.`,
  };
}

export async function generateStaticParams() {
  return ALL_COURSES.map((c) => ({ courseId: c.id }));
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;

  if (courseId.startsWith("local-")) {
    return <LocalCoursePage courseId={courseId} />;
  }

  const course = ALL_COURSES.find((c) => c.id === courseId);
  if (!course) {
    notFound();
  }

  return <CoursePage course={course} />;
}
