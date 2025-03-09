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
          name: 'Core Courses',
          requiredCredits: 30,
          courses: {},
          isMajor: true,
        },
        {
          id: generateId(),
          name: 'Electives',
          requiredCredits: 15,
          courses: {},
          isMajor: false,
        },
      ],
      semesters: [
        { id: 'sem1', name: 'Semester 1' },
        { id: 'sem2', name: 'Semester 2' },
        { id: 'sem3', name: 'Semester 3' },
        { id: 'sem4', name: 'Semester 4' },
        { id: 'sem5', name: 'Semester 5' },
        { id: 'sem6', name: 'Semester 6' },
        { id: 'sem7', name: 'Semester 7' },
        { id: 'sem8', name: 'Semester 8' },
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
    }),
    {
      name: 'course-planner-storage',
    }
  )
);