export interface CourseTopic {
  id: string;
  label: string;
}

export interface CourseNicho {
  title: string;
  items: CourseTopic[];
}

export interface CourseSubject {
  subject: string;
  ytTerm: string;
  nichos: CourseNicho[];
}

export interface Course {
  id: string;
  title: string;
  subjects: CourseSubject[];
  userId?: string | null;
  sourceType?: "edital" | "livre";
}
