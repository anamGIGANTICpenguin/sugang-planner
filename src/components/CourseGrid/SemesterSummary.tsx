import React from 'react';
import { Category, Semester } from '../../types';

interface SemesterSummaryProps {
  categories: Category[];
  semester: Semester;
  isFirst: boolean;
  isLast: boolean;
}

const SemesterSummary: React.FC<SemesterSummaryProps> = ({
  categories,
  semester,
  isFirst,
  isLast,
}) => {
  let totalCredits = 0;
  let totalGpaPoints = 0;
  let totalGpaCredits = 0;

  categories.forEach(category => {
    const courses = category.courses[semester.id] || [];
    courses.forEach(course => {
      // Skip retake/dropped courses in GPA calculation
      if (course.isRetake || course.isDropped) {
        return; // Skip this course
      }
      
      // Count F grades for GPA calculation but not for completed credits
      if (course.grade === 'F') {
        totalGpaCredits += course.credits;
        totalGpaPoints += 0; // F counts as 0.0
      } else {
        totalCredits += course.credits;
        if (course.gpaValue !== null && course.grade && course.grade !== 'P') {
          totalGpaCredits += course.credits;
          totalGpaPoints += course.credits * (course.gpaValue || 0);
        }
      }
    });
  });

  const semesterGpa = totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : 0;
  const edgeRadius =
    `${isFirst ? 'rounded-bl-lg' : ''} ${isLast ? 'rounded-br-lg' : ''}`;

  return (
    <div
      className={`flex flex-col justify-center border-t-2 border-[#8B0029] bg-[#E5D0AC] px-1 py-1 text-center dark:border-[#9f1239] dark:bg-gray-800 ${edgeRadius}`}
      style={{ minHeight: '40px' }}
    >
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
