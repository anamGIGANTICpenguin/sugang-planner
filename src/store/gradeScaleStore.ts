import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCourseStore } from './courseStore';

type GradeScale = '4.5' | '4.3';

interface GradeScaleState {
  scale: GradeScale;
  setScale: (scale: GradeScale) => void;
}

export const useGradeScaleStore = create<GradeScaleState>()(
  persist(
    (set) => ({
      scale: '4.5',
      setScale: (scale) => {
        if (window.confirm('성적 체계를 변경하면 모든 과목 데이터가 삭제됩니다. 계속하시겠습니까?')) {
          set({ scale });
          // Reset course data
          useCourseStore.getState().resetAllCourses();
        }
      },
    }),
    {
      name: 'grade-scale-storage',
    }
  )
);

export const getGradeOptions = (scale: GradeScale) => {
  const baseGrades = scale === '4.3' ? [
    { value: "A+", label: "A+ (4.3)", gpaValue: 4.3, color: '#2563eb' },  // blue-600
    { value: "A0", label: "A0 (4.0)", gpaValue: 4.0, color: '#166534' },  // green-800
    { value: "A-", label: "A- (3.7)", gpaValue: 3.7, color: '#166534' },  // green-800
    { value: "B+", label: "B+ (3.3)", gpaValue: 3.3, color: '#ca8a04' },  // yellow-600
    { value: "B0", label: "B0 (3.0)", gpaValue: 3.0, color: '#ca8a04' },  // yellow-600
    { value: "B-", label: "B- (2.7)", gpaValue: 2.7, color: '#ca8a04' },  // yellow-600
    { value: "C+", label: "C+ (2.3)", gpaValue: 2.3, color: '#f97316' },  // orange-500
    { value: "C0", label: "C0 (2.0)", gpaValue: 2.0, color: '#f97316' },  // orange-500
    { value: "C-", label: "C- (1.7)", gpaValue: 1.7, color: '#f97316' },  // orange-500
    { value: "D+", label: "D+ (1.3)", gpaValue: 1.3, color: '#f97316' },  // orange-500
    { value: "D0", label: "D0 (1.0)", gpaValue: 1.0, color: '#f97316' },  // orange-500
    { value: "D-", label: "D- (0.7)", gpaValue: 0.7, color: '#f97316' },  // orange-500
    { value: "F", label: "F (0.0)", gpaValue: 0.0, color: '#dc2626' },    // red-600
  ] : [
    { value: "A+", label: "A+ (4.5)", gpaValue: 4.5, color: '#2563eb' },    // blue-600
    { value: "A0", label: "A0 (4.0)", gpaValue: 4.0, color: '#166534' },    // green-800
    { value: "B+", label: "B+ (3.5)", gpaValue: 3.5, color: '#ca8a04' },    // yellow-600
    { value: "B0", label: "B0 (3.0)", gpaValue: 3.0, color: '#ca8a04' },    // yellow-600
    { value: "C+", label: "C+ (2.5)", gpaValue: 2.5, color: '#f97316' },    // orange-500
    { value: "C0", label: "C0 (2.0)", gpaValue: 2.0, color: '#f97316' },    // orange-500
    { value: "D+", label: "D+ (1.5)", gpaValue: 1.5, color: '#f97316' },    // orange-500
    { value: "D0", label: "D0 (1.0)", gpaValue: 1.0, color: '#f97316' },    // orange-500
    { value: "F", label: "F (0.0)", gpaValue: 0.0, color: '#dc2626' },      // red-600
  ];

  // Add these options to both scales
  return [...baseGrades,
    { value: "P", label: "P (Pass)", gpaValue: null, color: '#2563eb' },    // blue-600
    { value: "NP", label: "NP (No Pass)", gpaValue: null, color: '#dc2626' }, // red-600
    { value: "N/A", label: "N/A", gpaValue: null, color: '#6b7280' },       // gray-500
  ];
};
