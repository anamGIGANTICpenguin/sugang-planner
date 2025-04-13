// src/App.tsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import CourseGrid from './components/CourseGrid/CourseGrid';
import { useCourseStore } from './store/courseStore';
import './App.css';
import tigerLogo from './assets/tigerlogo.svg'; // Import the tiger logo
import GPAGraph from './components/Summary/GPAGraph';
import Instructions from './components/Common/Instructions';
import GradeScaleToggle from './components/Common/GradeScaleToggle';
import About from './components/About/About';
import Privacy from './components/Privacy/Privacy';

const App: React.FC = () => {
  // Get data for summary display in header
  const { categories, semesters } = useCourseStore();

  // Calculate summary statistics for header display
  const totalRequiredCredits = categories.reduce((sum, category) => sum + category.requiredCredits, 0);
  
  const totalCompletedCredits = categories.reduce((sum, category) => {
    const categoryCredits = semesters.reduce((catSum, semester) => {
      const semesterCourses = category.courses[semester.id] || [];
      return catSum + semesterCourses.reduce((courseSum, course) => 
        // Don't count F grades towards completed credits
        courseSum + (course.grade === 'F' ? 0 : course.credits), 0);
    }, 0);
    return sum + categoryCredits;
  }, 0);
  
  // Calculate overall GPA and Major GPA
  let totalGpaCredits = 0;
  let totalGpaPoints = 0;
  let totalMajorGpaCredits = 0;
  let totalMajorGpaPoints = 0;
  let totalPrimaryMajorGpaCredits = 0;
  let totalPrimaryMajorGpaPoints = 0;
  let totalSecondaryMajorGpaCredits = 0;
  let totalSecondaryMajorGpaPoints = 0;
  let englishCourseCount = 0;

  categories.forEach(category => {
    semesters.forEach(semester => {
      const semesterCourses = category.courses[semester.id] || [];
      semesterCourses.forEach(course => {
        if (course.isEnglish && !course.isRetake && course.grade !== 'F') {
          englishCourseCount++;
        }
        
        // Include F grades in GPA calculation
        if (course.grade === 'F') {
          totalGpaCredits += course.credits;
          if (category.isMajor) {
            totalMajorGpaCredits += course.credits;
            if (category.majorType === 'primary') {
              totalPrimaryMajorGpaCredits += course.credits;
            } else if (category.majorType === 'secondary') {
              totalSecondaryMajorGpaCredits += course.credits;
            }
          }
        } else if (course.gpaValue !== null && course.grade && course.grade !== 'P') {
          totalGpaCredits += course.credits;
          totalGpaPoints += course.credits * (course.gpaValue || 0);
          
          if (category.isMajor) {
            totalMajorGpaCredits += course.credits;
            totalMajorGpaPoints += course.credits * (course.gpaValue || 0);
            
            if (category.majorType === 'primary') {
              totalPrimaryMajorGpaCredits += course.credits;
              totalPrimaryMajorGpaPoints += course.credits * (course.gpaValue || 0);
            } else if (category.majorType === 'secondary') {
              totalSecondaryMajorGpaCredits += course.credits;
              totalSecondaryMajorGpaPoints += course.credits * (course.gpaValue || 0);
            }
          }
        }
      });
    });
  });
  
  const overallGpa = totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : 0;
  const majorGpa = totalMajorGpaCredits > 0 ? totalMajorGpaPoints / totalMajorGpaCredits : 0;
  const primaryMajorGpa = totalPrimaryMajorGpaCredits > 0 
    ? totalPrimaryMajorGpaPoints / totalPrimaryMajorGpaCredits 
    : 0;
  const secondaryMajorGpa = totalSecondaryMajorGpaCredits > 0 
    ? totalSecondaryMajorGpaPoints / totalSecondaryMajorGpaCredits 
    : 0;
  const overallCompletion = totalRequiredCredits > 0 ? (totalCompletedCredits / totalRequiredCredits) * 100 : 0;

  return (
    <Routes>
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route path="/" element={
        <div className="app min-h-screen bg-[#FEF9E1] dark:bg-gray-900 text-[#333333] dark:text-[#F8F2DE]">
          <header className="bg-[#8B0029] text-white p-4 shadow-md">
            <div className="container mx-auto max-w-3xl px-4">
              <div className="flex flex-col items-center text-center">
                <img src={tigerLogo} alt="Tiger Logo" className="tiger-logo mb-2" />
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold gugi-regular text-[#FEF9E1]">졸업하고싶은 호랭이</h1>
                </div>
                <div className="mt-4">
                  <GradeScaleToggle />
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto py-6 px-4 max-w-7xl overflow-x-auto">
            <Instructions />
            <div className="min-w-[800px] bg-transparent mb-8"> {/* Add min-width wrapper */}
              <CourseGrid />
            </div>

            {/* Progress tracking section */}
            <div className="min-w-[800px] max-w-2xl mx-auto bg-[#8B0029] text-white p-6 rounded-lg shadow-lg"> {/* Add min-width */}
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
                    <div className={`w-full bg-gray-700 rounded-full h-2`}>
                      <div 
                        className={`bg-green-500 h-2 rounded-full transition-all duration-500`} 
                        style={{ width: `${Math.min(100, overallCompletion)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* First line: Total GPA and English courses */}
                  <div className="flex justify-center space-x-12 mb-2">
                    <div className="text-center">
                      <span className="block text-sm">총 평점</span>
                      <span className="text-2xl font-bold">{overallGpa.toFixed(2)}</span>
                    </div>

                    <div className="text-center">
                      <span className="block text-sm">영강</span>
                      <span className="text-2xl font-bold">{englishCourseCount}개</span>
                    </div>
                  </div>
                  
                  {/* Second line: Major GPAs */}
                  <div className="flex justify-center space-x-4 mb-4">
                    {totalMajorGpaCredits > 0 && (
                      <div className="text-center">
                        <span className="block text-sm">전공</span>
                        <span className="text-2xl font-bold">{majorGpa.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {totalPrimaryMajorGpaCredits > 0 && (
                      <div className="text-center">
                        <span className="block text-sm">본전공</span>
                        <span className="text-2xl font-bold">{primaryMajorGpa.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {totalSecondaryMajorGpaCredits > 0 && (
                      <div className="text-center">
                        <span className="block text-sm">제2전공</span>
                        <span className="text-2xl font-bold">{secondaryMajorGpa.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid gap-3">
                    {categories.map(category => {
                      const totalCredits = semesters.reduce((sum, semester) => {
                        const semesterCourses = category.courses[semester.id] || [];
                        return sum + semesterCourses.reduce((total, course) => 
                          // Don't count F grades towards completed credits
                          total + (course.grade === 'F' ? 0 : course.credits), 0);
                      }, 0);
                      
                      const completion = category.requiredCredits > 0 
                        ? (totalCredits / category.requiredCredits) * 100 
                        : 0;
                        
                      return (
                        <div key={category.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <div className="flex items-center">
                              {category.isMajor && (
                                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded mr-2">
                                  {category.majorType === 'secondary' ? '제2전공' : '본전공'}
                                </span>
                              )}
                              <span>{category.name}</span>
                            </div>
                            <span>
                              {totalCredits}/{category.requiredCredits} 학점 ({Math.round(completion)}%)
                            </span>
                          </div>
                          <div className={`w-full bg-gray-700 rounded-full h-1.5`}>
                            <div 
                              className={`h-1.5 rounded-full bg-green-500 transition-all duration-500`}
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

          <footer className="bg-[#FEF9E1] dark:bg-gray-900 py-6">
            <div className="container mx-auto px-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                  <Link
                    to="/about"
                    className="text-xs text-gray-400 hover:text-[#8B0029] dark:hover:text-[#F8F2DE] transition-colors"
                  >
                    About / 사이트 소개
                  </Link>
                  <Link
                    to="/privacy"
                    className="text-xs text-gray-400 hover:text-[#8B0029] dark:hover:text-[#F8F2DE] transition-colors"
                  >
                    Privacy Policy / 개인정보처리방침
                  </Link>
                  <a
                    href="https://pf.kakao.com/_xnrxnwn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#8B0029] dark:hover:text-[#F8F2DE] transition-colors"
                  >
                    Contact / 건의하기
                  </a>
                </div>
                <p className="text-xs text-gray-400">
                  여러분의 졸업을 응원하는 호랭이 © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </footer>
        </div>
      } />
    </Routes>
  );
};

export default App;