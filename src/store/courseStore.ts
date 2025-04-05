import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CourseGridState, Course } from '../types';

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useCourseStore = create<CourseGridState>()(
  persist(
    (set) => ({
      categories: [
        {
          id: generateId(),
          name: 'OO 전공',
          requiredCredits: 30,
          courses: {},
          isMajor: true,
        },
        {
          id: generateId(),
          name: 'OO 교양',
          requiredCredits: 15,
          courses: {},
          isMajor: false,
        },
      ],
      semesters: [
        { id: 'sem1', name: '1학년 1학기' },
        { id: 'sem2', name: '1학년 2학기' },
        { id: 'sem3', name: '2학년 1학기' },
        { id: 'sem4', name: '2학년 2학기' },
        { id: 'sem5', name: '3학년 1학기' },
        { id: 'sem6', name: '3학년 2학기' },
        { id: 'sem7', name: '4학년 1학기' },
        { id: 'sem8', name: '4학년 2학기' },
      ],
      addCategory: (name: string, requiredCredits: number, isMajor: boolean = false) =>
        set((state) => ({
          categories: [
            ...state.categories,
            {
              id: generateId(),
              name,
              requiredCredits,
              courses: {},
              isMajor,
            },
          ],
        })),
      updateCategory: (id: string, name: string, requiredCredits: number, isMajor: boolean) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, name, requiredCredits, isMajor } : category
          ),
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        })),
      addSemester: (name) =>
        set((state) => ({
          semesters: [...state.semesters, { id: generateId(), name }],
        })),
      updateSemester: (id, name) =>
        set((state) => ({
          semesters: state.semesters.map((semester) =>
            semester.id === id ? { ...semester, name } : semester
          ),
        })),
      removeSemester: (id) =>
        set((state) => ({
          semesters: state.semesters.filter((semester) => semester.id !== id),
          categories: state.categories.map((category) => {
            const { [id]: _, ...restCourses } = category.courses;
            return {
              ...category,
              courses: restCourses,
            };
          }),
        })),
      addCourse: (categoryId, semesterId, course) =>
        set((state) => {
          const newCourse: Course = {
            id: generateId(),
            ...course,
          };

          return {
            categories: state.categories.map((category) => {
              if (category.id !== categoryId) return category;

              const existingCourses = category.courses[semesterId] || [];
              return {
                ...category,
                courses: {
                  ...category.courses,
                  [semesterId]: [...existingCourses, newCourse],
                },
              };
            }),
          };
        }),
      updateCourse: (categoryId, semesterId, courseId, updates) =>
        set((state) => ({
          categories: state.categories.map((category) => {
            if (category.id !== categoryId) return category;

            const semesterCourses = category.courses[semesterId] || [];
            return {
              ...category,
              courses: {
                ...category.courses,
                [semesterId]: semesterCourses.map((course) =>
                  course.id === courseId ? { ...course, ...updates } : course
                ),
              },
            };
          }),
        })),
      removeCourse: (categoryId, semesterId, courseId) =>
        set((state) => ({
          categories: state.categories.map((category) => {
            if (category.id !== categoryId) return category;

            const semesterCourses = category.courses[semesterId] || [];
            return {
              ...category,
              courses: {
                ...category.courses,
                [semesterId]: semesterCourses.filter((course) => course.id !== courseId),
              },
            };
          }),
        })),
      reorderCategories: (sourceIndex: number, destinationIndex: number) =>
        set((state) => {
          const newCategories = [...state.categories];
          const [movedCategory] = newCategories.splice(sourceIndex, 1);
          // If we're moving down, subtract 1 from the destination index
          // because the source removal shifted all indices down
          const adjustedDestIndex = sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex;
          newCategories.splice(adjustedDestIndex, 0, movedCategory);
          return { categories: newCategories };
        }),
      resetAllCourses: () => set((state) => ({
        ...state,
        categories: state.categories.map(category => ({
          ...category,
          courses: {}
        }))
      })),
    }),
    {
      name: 'course-planner-storage',
    }
  )
);