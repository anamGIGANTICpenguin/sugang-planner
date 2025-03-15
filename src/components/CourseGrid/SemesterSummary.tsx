import React from 'react';
import { Category, Semester } from '../../types';

interface SemesterSummaryProps {
  categories: Category[];
  semester: Semester;
}

const SemesterSummary: React.FC<SemesterSummaryProps> = ({ categories, semester }) => {
  let totalCredits = 0;
  let totalGpaPoints = 0;
  let totalGpaCredits = 0;

  categories.forEach(category => {
    const courses = category.courses[semester.id] || [];
    courses.forEach(course => {
      totalCredits += course.credits;
      
      if (course.gpaValue !== null && course.grade && course.grade !== 'P') {
        totalGpaCredits += course.credits;
        totalGpaPoints += course.credits * (course.gpaValue || 0);
      }
    });
  });

  const semesterGpa = totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : 0;

  return (
    <div className="flex flex-col justify-center py-1 px-1 bg-[#E5D0AC] text-center border-t border-[#8B0029]/20 dark:bg-gray-800 dark:border-[#9f1239]/20" style={{ minHeight: '40px' }}>
      <div className="text-xs text-[#333333] dark:text-white">
        {totalGpaCredits > 0 ? semesterGpa.toFixed(2) : 'N/A'}
      </div>
      <div className="text-xs font-medium text-[#333333] dark:text-white">
        {totalCredits} 학점
      </div>
    </div>
  );
};

export default SemesterSummary;
