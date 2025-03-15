// src/App.tsx
import React, { useEffect } from 'react';
import CourseGrid from './components/CourseGrid/CourseGrid';
import { useCourseStore } from './store/courseStore';
import './App.css';
import tigerLogo from './assets/tigerlogo.svg'; // Import the tiger logo
import cubadultImage from './assets/cubadult.png';
import GPAGraph from './components/Summary/GPAGraph';

const App: React.FC = () => {
  // Always use dark mode
  const darkMode = true;
  
  // Apply dark mode class to body
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
    <div className="app min-h-screen bg-gray-900 text-[#F8F2DE]">
      <header className="bg-[#8B0029] text-white p-4 shadow-md">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="flex flex-col items-center text-center">
            <img src={tigerLogo} alt="Tiger Logo" className="tiger-logo mb-2" />
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold gugi-regular">졸업하고싶은 호랭이</h1>
            </div>
            <p className="text-lg font-bold gugi-regular">어흥</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="bg-transparent mb-8">
          <CourseGrid />
        </div>

        {/* Progress tracking section */}
        <div className="max-w-2xl mx-auto bg-[#8B0029] text-white p-6 rounded-lg shadow-lg">
          {/* Graph and credit summary side by side */}
          <div className="flex gap-4">
            <div className="w-3/5">
              <GPAGraph />
            </div>
            <div className="w-2/5">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">취득 학점:</span>
                  <span>{Math.round(totalCompletedCredits)}/{totalRequiredCredits} 학점 ({Math.round(overallCompletion)}%)</span>
                </div>
                <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-green-100'} rounded-full h-2`}>
                  <div 
                    className={`${darkMode ? 'bg-green-500' : 'bg-green-700'} h-2 rounded-full transition-all duration-500`} 
                    style={{ width: `${Math.min(100, overallCompletion)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-8 mb-4">
                <div className="text-center">
                  <span className="block text-sm">총 GPA</span>
                  <span className="text-2xl font-bold">{overallGpa.toFixed(2)}</span>
                </div>
                
                {totalMajorGpaCredits > 0 && (
                  <div className="text-center">
                    <span className="block text-sm">전공 GPA</span>
                    <span className="text-2xl font-bold">{majorGpa.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="grid gap-3">
                {categories.map(category => {
                  const totalCredits = semesters.reduce((sum, semester) => {
                    const semesterCourses = category.courses[semester.id] || [];
                    return sum + semesterCourses.reduce((total, course) => total + course.credits, 0);
                  }, 0);
                  
                  const completion = category.requiredCredits > 0 
                    ? (totalCredits / category.requiredCredits) * 100 
                    : 0;
                    
                  return (
                    <div key={category.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center">
                          {category.isMajor && (
                            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded mr-2">전공</span>
                          )}
                          <span>{category.name}</span>
                        </div>
                        <span>
                          {totalCredits}/{category.requiredCredits}
                        </span>
                      </div>
                      <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-green-100'} rounded-full h-1.5`}>
                        <div 
                          className={`h-1.5 rounded-full ${
                            darkMode ? 'bg-green-500' : 'bg-green-700'
                          } transition-all duration-500`}
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
      </main>

      <footer className={`${darkMode ? 'bg-gray-900' : 'bg-[#F8F2DE]'} py-6`}>
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <img 
              src={cubadultImage} 
              alt="Cub Adult" 
              className="w-40 h-auto opacity-50 hover:opacity-100 transition-opacity duration-300 mx-auto"
            />
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            여러분의 졸업을 응원하는 호랭이 © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;