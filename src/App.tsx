import React from 'react';
import CourseGrid from './components/CourseGrid/CourseGrid';
import { useCourseStore } from './store/courseStore';
import './App.css';

const App: React.FC = () => {
  // Get data for summary display in header
  const { categories, semesters } = useCourseStore();

  // Calculate summary statistics for header display
  const totalRequiredCredits = categories.reduce((sum, category) => sum + category.requiredCredits, 0);
  
  const totalCompletedCredits = categories.reduce((sum, category) => {
    const categoryCredits = semesters.reduce((catSum, semester) => {
      const semesterCourses = category.courses[semester.id] || [];
      return catSum + semesterCourses.reduce((courseSum, course) => courseSum + course.credits, 0);
    }, 0);
    return sum + categoryCredits;
  }, 0);
  
  // Calculate overall GPA and Major GPA
  let totalGpaCredits = 0;
  let totalGpaPoints = 0;
  let totalMajorGpaCredits = 0;
  let totalMajorGpaPoints = 0;
  
  categories.forEach(category => {
    semesters.forEach(semester => {
      const semesterCourses = category.courses[semester.id] || [];
      semesterCourses.forEach(course => {
        if (course.gpaValue !== null && course.grade && course.grade !== 'P') {
          // Overall GPA
          totalGpaCredits += course.credits;
          totalGpaPoints += course.credits * (course.gpaValue || 0);
          
          // Major GPA
          if (category.isMajor) {
            totalMajorGpaCredits += course.credits;
            totalMajorGpaPoints += course.credits * (course.gpaValue || 0);
          }
        }
      });
    });
  });
  
  const overallGpa = totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : 0;
  const majorGpa = totalMajorGpaCredits > 0 ? totalMajorGpaPoints / totalMajorGpaCredits : 0;
  const overallCompletion = totalRequiredCredits > 0 ? (totalCompletedCredits / totalRequiredCredits) * 100 : 0;

  return (
    <div className="app min-h-screen bg-gray-50">
      <header className="bg-[#8B0029] text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Course Planner</h1>
              <p className="text-red-100">Plan your academic journey semester by semester</p>
            </div>
            <div className="text-white text-sm w-96">
              <div className="mb-1">
                <div className="flex justify-between items-center">
                  <span>Overall Progress:</span>
                  <span>{Math.round(totalCompletedCredits)}/{totalRequiredCredits} cr ({Math.round(overallCompletion)}%)</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-1 mt-1">
                  <div 
                    className="bg-white h-1 rounded-full" 
                    style={{ width: `${Math.min(100, overallCompletion)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex space-x-4 mb-1 mt-2">
                <div className="flex items-center">
                  <span>Overall GPA:</span>
                  <span className="font-semibold ml-1">{overallGpa.toFixed(2)}</span>
                </div>
                
                {totalMajorGpaCredits > 0 && (
                  <div className="flex items-center">
                    <span>전공 GPA:</span>
                    <span className="font-semibold ml-1">{majorGpa.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-1">
                {categories.map(category => {
                  // Calculate category stats
                  const totalCredits = semesters.reduce((sum, semester) => {
                    const semesterCourses = category.courses[semester.id] || [];
                    return sum + semesterCourses.reduce((total, course) => total + course.credits, 0);
                  }, 0);
                  
                  const completion = category.requiredCredits > 0 
                    ? (totalCredits / category.requiredCredits) * 100 
                    : 0;
                    
                  return (
                    <div key={category.id} className="mb-1">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center">
                          {category.isMajor && (
                            <span className="bg-white/20 text-white text-xs px-1 rounded mr-1">전공</span>
                          )}
                          <span className="truncate max-w-[180px]">{category.name}</span>
                        </div>
                        <span>
                          {totalCredits}/{category.requiredCredits}
                        </span>
                      </div>
                      <div className="w-full bg-white/30 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${
                            completion >= 100 ? 'bg-green-300' : 'bg-white'
                          }`}
                          style={{ width: `${Math.min(100, completion)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#8B0029]">Course Schedule</h2>
          <p className="text-gray-600 mb-6 text-xs">
            Click on cells to add or edit courses. Click on category names or semester headers to edit them.
          </p>
          
          <CourseGrid />
        </div>
      </main>

      <footer className="bg-gray-100 border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Course Planner App © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;