export interface Course {
  id: string;
  name: string;
  credits: number;
  grade?: string;
  gpaValue?: number | null; // GPA value for the grade, null for P/F courses
  isRetake?: boolean; // Add this flag
}

export interface Category {
  id: string;
  name: string;
  requiredCredits: number;
  courses: Record<string, Course[]>; // key is semesterId
  isMajor: boolean; // To indicate if this is a major (전공) category
}

export interface Semester {
  id: string;
  name: string;
}

export interface CourseGridState {
  categories: Category[];
  semesters: Semester[];
  addCategory: (name: string, requiredCredits: number) => void;
  updateCategory: (id: string, name: string, requiredCredits: number, isMajor: boolean) => void;
  removeCategory: (id: string) => void;
  addSemester: (name: string) => void;
  updateSemester: (id: string, name: string) => void;
  removeSemester: (id: string) => void;
  addCourse: (categoryId: string, semesterId: string, course: Omit<Course, 'id'>) => void;
  updateCourse: (categoryId: string, semesterId: string, courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  removeCourse: (categoryId: string, semesterId: string, courseId: string) => void;
  reorderCategories: (sourceIndex: number, destinationIndex: number) => void;
}