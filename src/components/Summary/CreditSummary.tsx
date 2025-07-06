import React from 'react';
import { useCourseStore } from '../../store/courseStore';

const CreditSummary: React.FC = () => {
  const { categories, semesters } = useCourseStore();

  // Calculate the total credits and GPA per category and overall
  const categorySummaries = categories.map(category => {
    let totalCredits = 0;
    let totalGpaCredits = 0;
    let totalGpaPoints = 0;

    semesters.forEach(semester => {
      const semesterCourses = category.courses[semester.id] || [];
      
      semesterCourses.forEach(course => {
        // Skip retake/dropped courses in GPA calculation
        if (course.isRetake || course.isDropped) {
          return; // Skip this course
        }
        
        // Add to total credits, excluding F grades
        if (course.grade === 'F') {
          // F grades are not counted towards completed credits
          // but they are included in GPA calculation
          if (course.gpaValue !== null && course.grade) {
            totalGpaCredits += course.credits;
            totalGpaPoints += 0; // F counts as 0.0
          }
        } else {
          totalCredits += course.credits;
          
          // Only add to GPA calculation if it's a letter grade (not P/F)
          if (course.gpaValue !== null && course.grade && course.grade !== 'P' && course.grade !== 'F-') {
            totalGpaCredits += course.credits;
            totalGpaPoints += course.credits * (course.gpaValue || 0);
          }
        }
      });
    });

    const gpa = totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : 0;

    return {
      id: category.id,
      name: category.name,
      totalCredits,
      totalGpaCredits,
      gpa,
      requiredCredits: category.requiredCredits,
      completed: (totalCredits / category.requiredCredits) * 100
    };
  });

  // Calculate overall totals
  const totalRequiredCredits = categories.reduce((sum, category) => sum + category.requiredCredits, 0);
  const totalCompletedCredits = categorySummaries.reduce((sum, summary) => sum + summary.totalCredits, 0);
  const totalGpaCredits = categorySummaries.reduce((sum, summary) => sum + summary.totalGpaCredits, 0);
  const totalGpaPoints = categorySummaries.reduce((sum, summary) => sum + (summary.gpa * summary.totalGpaCredits), 0);
  const overallGpa = totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : 0;
  const overallCompletion = totalRequiredCredits > 0 
    ? (totalCompletedCredits / totalRequiredCredits) * 100 
    : 0;

  return (
    <div className="credit-summary bg-white/20 p-2 rounded-lg mb-0 w-2/3">
      <div className="grid grid-cols-1 gap-4">
        {/* Overall progress and GPA */}
        <div>
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-xs text-white">Overall Progress</span>
              <span className="text-xs text-white">
                {totalCompletedCredits}/{totalRequiredCredits} credits ({Math.round(overallCompletion)}%)
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-1.5 mb-2">
              <div 
                className="bg-white h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, overallCompletion)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mb-1">
              <span className="font-medium text-xs text-white">Overall GPA</span>
              <span className="font-semibold text-xs text-white">{overallGpa.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {categorySummaries.map(summary => (
            <div key={summary.id} className="mb-1">
              <div className="flex justify-between mb-0">
                <span className="text-xs text-white">{summary.name}</span>
                <div className="flex space-x-3">
                  <span className="text-xs text-white">
                    {summary.totalCredits}/{summary.requiredCredits}
                  </span>
                  <span className="text-xs text-white">
                    {summary.gpa.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-white/30 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${
                    summary.completed >= 100 ? 'bg-green-300' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min(100, summary.completed)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditSummary;