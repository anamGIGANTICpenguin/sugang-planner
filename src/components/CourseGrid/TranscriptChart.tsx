import React, { useState } from 'react';
import { useCourseStore } from '../../store/courseStore';
import { addCoursesSequentially } from './courseUtils';
import { 
  analyzeMajorCodePrefixes, 
  updateCategoriesBasedOnMajorSelection, 
  extractCodePrefix 
} from './transcriptUtils';
import MajorSelectionModal from './MajorSelectionModal';

interface TranscriptChartProps {
  onSuccess?: () => void; // Callback function to be called after successful import
}

interface CourseData {
  year: string;
  semester: string;
  courseCode: string;
  courseName: string;
  category: string;
  subcategory: string;
  credits: number;
  score: number;
  letterGrade: string;
  numberGrade: number;
  isRetake?: boolean;
  isDropped?: boolean;
}

const TranscriptChart: React.FC<TranscriptChartProps> = ({ onSuccess }) => {
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [majorPrefixOptions, setMajorPrefixOptions] = useState<Array<{ prefix: string; count: number }>>([]);
  const [parsedCourseData, setParsedCourseData] = useState<CourseData[]>([]);
  const {
    categories,
    semesters,
    addCategory,
    removeCategory,
    addSemester,
    removeSemester,
    resetAllCourses,
    updateCategory
  } = useCourseStore();

  // Function to parse the transcript text into structured data
  const parseTranscriptData = (text: string): CourseData[] => {
    const lines = text.trim().split('\n');
    const parsedData: CourseData[] = [];
    
    for (const line of lines) {
      try {
        if (!line.trim()) continue; // Skip empty lines
        
        const parts = line.trim().split(/\s+/);
        
        if (parts.length < 8) {
          console.warn('Line has too few parts, skipping:', line);
          continue;
        }
        
        // Handle military service credits specifically
        if (parts[0] === '군복무중이수') {
          const courseCode = parts.length > 1 ? parts[1] : '';
          const courseName = parts.length > 2 ? parts[2] : '';
          const category = parts.length > 3 ? parts[3] : '';
          const subcategory = parts.length > 4 ? parts[4] : '';
          
          // Find the remaining numeric values (credits, score, letterGrade, numberGrade)
          let credits = 0;
          let score = 0;
          let letterGrade = '';
          let numberGrade = 0;
          
          for (let i = 5; i < parts.length; i++) {
            if (/^\d+(\.\d+)?$/.test(parts[i])) {
              // First number is credits
              if (credits === 0) {
                credits = parseFloat(parts[i]) || 0;
              } 
              // Second number is score
              else if (score === 0) {
                score = parseFloat(parts[i]) || 0;
              }
              // Fourth number is numberGrade
              else if (letterGrade !== '') {
                numberGrade = parseFloat(parts[i]) || 0;
                break;
              }
            } 
            // Third value is letterGrade
            else if (letterGrade === '' && (/^[A-Z][+\-]?$/.test(parts[i]) || parts[i] === 'P')) {
              letterGrade = parts[i];
            }
          }
          
          // Check for retake or dropped course info at the end
          let isRetake = false;
          
          const lastPart = parts[parts.length - 1];
          if (lastPart === '재수강' || lastPart === '학점포기') {
            isRetake = true;
          }
          
          parsedData.push({
            year: '군복무중이수',
            semester: '계절',  // Treat military service courses as seasonal
            courseCode,
            courseName,
            category,
            subcategory,
            credits,
            score,
            letterGrade,
            numberGrade,
            isRetake,
            isDropped: isRetake // Set isDropped to same value as isRetake
          });
          
          continue;
        }
        
        // Try a regex approach first for more accurate parsing
        const regex = /^(\d{4}|\S+)\s+(\S+)\s+(\S+)\s+(.+?)\s+(교양|전공\S*|학문의기초)\s+([^\d]+|\s*)(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+([A-Z+\-]+|P)\s+(\d+(?:\.\d+)?).*$/;
        const match = line.match(regex);
        
        if (match) {
          const [_, year, semester, courseCode, courseName, category, subcategory, credits, score, letterGrade, numberGrade] = match;
          
          // Check for retake or dropped course info at the end of the line
          let isRetake = false;
          
          // Look for 재수강 or 학점포기 at the end of the line
          if (line.includes('재수강') || line.includes('학점포기')) {
            isRetake = true;
          }
          
          parsedData.push({
            year,
            semester,
            courseCode,
            courseName: courseName.trim(),
            category: category.trim(),
            subcategory: subcategory.trim(),
            credits: parseFloat(credits) || 0,
            score: parseFloat(score) || 0,
            letterGrade,
            numberGrade: parseFloat(numberGrade) || 0,
            isRetake,
            isDropped: isRetake // Set isDropped to same value as isRetake
          });
          
          continue; // Skip to next line if regex matched
        }
        
        // Fallback to the position-based parsing approach
        const lineParts = line.trim().split(/\s+/);
        
        if (lineParts.length < 8) {
          console.warn('Line has too few parts, skipping:', line);
          continue;
        }
        
        // Extract the basic parts we're confident about
        const year = lineParts[0];
        const semester = lineParts[1];
        const courseCode = lineParts[2];
        
        // The course name might contain spaces, so we need to find where it ends
        // Usually the course name is followed by a category like '교양' or '전공'
        let courseNameEndIndex = -1;
        let categoryIndex = -1;
        
        for (let i = 3; i < lineParts.length; i++) {
          if (lineParts[i] === '교양' || lineParts[i].includes('전공') || lineParts[i] === '학문의기초') {
            categoryIndex = i;
            courseNameEndIndex = i - 1;
            break;
          }
        }
        
        if (courseNameEndIndex === -1) {
          console.warn('Cannot identify course name end, skipping:', line);
          continue;
        }
        
        // Reconstruct the course name from lineParts[3] to lineParts[courseNameEndIndex]
        const courseName = lineParts.slice(3, courseNameEndIndex + 1).join(' ');
        const category = lineParts[categoryIndex];
        
        // Look for credits, score, and grades at the end of the line
        // This is more reliable than trying to parse the subcategory
        let numberGradeIndex = -1;
        let letterGradeIndex = -1;
        let scoreIndex = -1;
        let creditsIndex = -1;
        
        // Work backwards from the end
        for (let i = lineParts.length - 1; i > categoryIndex; i--) {
          const part = lineParts[i];
          
          // Try to identify numberGrade (usually a decimal like 4.5)
          if (numberGradeIndex === -1 && /^\d+(\.\d+)?$/.test(part)) {
            numberGradeIndex = i;
            continue;
          }
          
          // Try to identify letterGrade (A+, B, etc. or P)
          if (letterGradeIndex === -1 && numberGradeIndex !== -1 && 
              (/^[A-Z][+\-]?$/.test(part) || part === 'P')) {
            letterGradeIndex = i;
            continue;
          }
          
          // Try to identify score (usually 100 or something like 94)
          if (scoreIndex === -1 && letterGradeIndex !== -1 && /^\d+$/.test(part)) {
            scoreIndex = i;
            continue;
          }
          
          // Try to identify credits (usually the first number before score)
          if (creditsIndex === -1 && scoreIndex !== -1 && /^\d+$/.test(part)) {
            creditsIndex = i;
            break;
          }
        }
        
        // If we couldn't identify all parts, try a different approach
        if (creditsIndex === -1 || scoreIndex === -1 || letterGradeIndex === -1) {
          // Just look for the typical pattern of numbers at the end
          // Usually the last few numbers are: credits, score, letterGrade, numberGrade
          const numericalIndices = [];
          for (let i = categoryIndex + 1; i < lineParts.length; i++) {
            if (/^\d+(\.\d+)?$/.test(lineParts[i]) || /^[A-Z][+\-]?$/.test(lineParts[i]) || lineParts[i] === 'P') {
              numericalIndices.push(i);
            }
          }
          
          if (numericalIndices.length >= 4) {
            // Assume the last 4 values follow the pattern
            creditsIndex = numericalIndices[numericalIndices.length - 4];
            scoreIndex = numericalIndices[numericalIndices.length - 3];
            letterGradeIndex = numericalIndices[numericalIndices.length - 2];
            numberGradeIndex = numericalIndices[numericalIndices.length - 1];
          } else {
            console.warn('Cannot identify all required fields, skipping:', line);
            continue;
          }
        }
        
        // Reconstruct subcategory (everything between category and credits)
        let subcategory = '';
        if (creditsIndex > categoryIndex + 1) {
          subcategory = lineParts.slice(categoryIndex + 1, creditsIndex).join(' ');
        }
        
        const credits = parseFloat(lineParts[creditsIndex]) || 0;
        const score = parseFloat(lineParts[scoreIndex]) || 0;
        const letterGrade = lineParts[letterGradeIndex] || '';
        const numberGrade = parseFloat(lineParts[numberGradeIndex]) || 0;
        
        // Check for retake or dropped course info at the end of the line
        let isRetake = false;
        
        // Check the last parts of the line for 재수강 or 학점포기
        for (let i = numberGradeIndex + 1; i < lineParts.length; i++) {
          if (lineParts[i] === '재수강' || lineParts[i] === '학점포기') {
            isRetake = true;
            break;
          }
        }
        
        parsedData.push({
          year,
          semester,
          courseCode,
          courseName,
          category,
          subcategory,
          credits,
          score,
          letterGrade,
          numberGrade,
          isRetake,
          isDropped: isRetake
        });
        
      } catch (error) {
        console.error('Error parsing line:', line, error);
      }
    }
    
    return parsedData;
  };

  // Function to create semester configurations based on parsed data
  const configureSemesters = (courseData: CourseData[]) => {
    // Clear existing semesters
    semesters.forEach(semester => {
      removeSemester(semester.id);
    });

    // Extract unique year-semester combinations
    const regularSemesters = new Map<string, string>();
    let hasSeasonalSemester = false;
    let hasMilitarySemester = false;
    
    courseData.forEach(course => {
      if (course.year === '군복무중이수') {
        hasMilitarySemester = true;
        hasSeasonalSemester = true; // We'll merge military with seasonal
      } else if (course.semester.includes('계절')) {
        hasSeasonalSemester = true;
      } else {
        const key = `${course.year}-${course.semester}`;
        regularSemesters.set(key, `${course.year}년 ${course.semester}학기`);
      }
    });

    // Create regular semesters in chronological order
    Array.from(regularSemesters.entries())
      .sort((a, b) => {
        // Extract year and semester for comparison
        const [yearA, semA] = a[0].split('-');
        const [yearB, semB] = b[0].split('-');
        
        // First compare years
        const yearComparison = parseInt(yearA) - parseInt(yearB);
        if (yearComparison !== 0) return yearComparison;
        
        // If years are equal, compare semesters
        return parseInt(semA) - parseInt(semB);
      })
      .forEach(([_, semesterName]) => {
        addSemester(semesterName);
      });

    // Add seasonal semester as the rightmost column if needed
    if (hasSeasonalSemester) {
      // If we have military service courses, use the combined name
      if (hasMilitarySemester) {
        addSemester('계절/군학점');
      } else {
        addSemester('계절학기');
      }
    }
  };

  // Function to configure categories based on course data
  const configureCategories = (courseData: CourseData[]) => {
    // Clear existing categories
    categories.forEach(category => {
      removeCategory(category.id);
    });

    // Create unique categories from the data
    const nonMajorCategories = new Map<string, boolean>();
    const majorCategoriesMap = new Map<string, boolean>();
    const prefixSubcategoryMap = new Map<string, Set<string>>();
    
    // First, identify major and non-major categories
    courseData.forEach(course => {
      const mainCategory = course.category.trim();
      if (mainCategory) {
        const isMajor = mainCategory.includes('전공');
        
        if (isMajor) {
          // For major courses, check if there's a code prefix
          if (course.courseCode) {
            const prefix = extractCodePrefix(course.courseCode);
            if (prefix) {
              // Track which subcategories exist for each prefix
              if (!prefixSubcategoryMap.has(prefix)) {
                prefixSubcategoryMap.set(prefix, new Set());
              }
              
              // Add the subcategory if it exists (e.g., "전공필수", "전공선택")
              if (course.subcategory && course.subcategory.trim()) {
                prefixSubcategoryMap.get(prefix)?.add(course.subcategory.trim());
              } else {
                // If there's no subcategory, use the main category (e.g., "전공")
                prefixSubcategoryMap.get(prefix)?.add(mainCategory);
              }
            } else {
              // If no prefix, just use the original category
              majorCategoriesMap.set(mainCategory, true);
            }
          } else {
            // No course code, use original category
            majorCategoriesMap.set(mainCategory, true);
          }
        } else {
          // Non-major category
          nonMajorCategories.set(mainCategory, false);
        }
      }
    });
    
    // Make sure we have a 일반선택 category
    if (!nonMajorCategories.has('일반선택')) {
      nonMajorCategories.set('일반선택', false);
    }
    
    // Add non-major categories first
    Array.from(nonMajorCategories.keys()).forEach(categoryName => {
      addCategory(categoryName, 0);  // Non-major uses default isMajor=false
    });
    
    // Then add major categories with specific subcategories
    prefixSubcategoryMap.forEach((subcategories, prefix) => {
      subcategories.forEach(subcategory => {
        // Create prefixed subcategories (e.g., "COMP 전공필수", "COMP 전공선택")
        const categoryName = `${prefix} ${subcategory}`;
        majorCategoriesMap.set(categoryName, true);
      });
    });
    
    // Add any other major categories that don't have prefixes
    Array.from(majorCategoriesMap.keys()).forEach(categoryName => {
      // First create the basic category
      addCategory(categoryName, 0);
      
      // Then update it to set isMajor to true
      setTimeout(() => {
        const createdCategory = useCourseStore.getState().categories.find(cat => cat.name === categoryName);
        if (createdCategory) {
          updateCategory(createdCategory.id, categoryName, 0, true);
        }
      }, 50);
    });
    
    // Force a delay to ensure all categories are created
    setTimeout(() => {
      // Update the display of categories with appropriate flags
      const latestCategories = useCourseStore.getState().categories;
      latestCategories.forEach(category => {
        if (category.isMajor) {
          updateCategory(
            category.id,
            category.name,
            category.requiredCredits,
            true
          );
        }
      });
    }, 100);
  };

  // Handle major selection from the modal
  const handleMajorSelection = (primaryPrefix: string, secondaryPrefix: string, otherPrefixes: string[]) => {
    setShowMajorModal(false);
    
    // Get the latest categories from the store
    const latestCategories = useCourseStore.getState().categories;
    
    // Update the categories based on the selected prefixes
    updateCategoriesBasedOnMajorSelection(
      latestCategories,
      primaryPrefix,
      secondaryPrefix ? [secondaryPrefix] : [],
      otherPrefixes,
      useCourseStore.getState().updateCategory
    );
    
    // Continue with course import after major selection
    continueWithCourseImport();
  };

  // Function to continue with course import after major selection or if no selection is needed
  const continueWithCourseImport = async () => {
    try {
      // Use the latest state
      const latestSemesters = useCourseStore.getState().semesters;
      const latestCategories = useCourseStore.getState().categories;
      
      // Find the 일반선택 category if it exists
      let generalElectiveCategory = latestCategories.find(cat => cat.name === '일반선택');
      
      // If 일반선택 category doesn't exist, create it now
      if (!generalElectiveCategory) {
        console.log('Creating 일반선택 category as it does not exist');
        addCategory('일반선택', 0);  // Only 2 arguments needed
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for state update
        generalElectiveCategory = useCourseStore.getState().categories.find(cat => cat.name === '일반선택');
        
        if (!generalElectiveCategory) {
          console.error('Failed to create 일반선택 category');
        } else {
          console.log('Successfully created 일반선택 category:', generalElectiveCategory);
        }
      }
      
      // Find categories marked for removal
      const categoriesToRemove = latestCategories.filter(cat => 
        cat.name.startsWith('_TO_REMOVE_')
      );
      console.log('Categories marked for removal:', categoriesToRemove);
      
      // Create mappings from the latest state
      const semesterMap = latestSemesters.reduce((acc, semester) => {
        if (semester.name.includes('계절') || semester.name.includes('군학점')) {
          acc['seasonal'] = semester.id;
        } else {
          const match = semester.name.match(/(\d+)년 (\d+)학기/);
          if (match) {
            const [_, year, sem] = match;
            acc[`${year}-${sem}`] = semester.id;
          }
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Standard category map for non-major courses
      const categoryMap = latestCategories.reduce((acc, category) => {
        // Skip categories marked for removal
        if (!category.name.startsWith('_TO_REMOVE_')) {
          acc[category.name] = category.id;
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Create prefix-to-category map for major courses
      const prefixCategoryMap = latestCategories.reduce((acc, category) => {
        if (category.isMajor && !category.name.startsWith('_TO_REMOVE_')) {
          // Extract prefix from category name (e.g., "COMP 전공필수" -> "COMP")
          const prefixMatch = category.name.match(/^([A-Z]+)\s+/);
          if (prefixMatch) {
            const prefix = prefixMatch[1];
            // If we haven't seen this prefix yet, or if this is a general category for the prefix
            // Add it to the map for fallback in case no exact subcategory match is found
            if (!acc[prefix] || !category.name.includes(' ')) {
              acc[prefix] = category.id;
            }
          }
        }
        return acc;
      }, {} as Record<string, string>);
      
      // For prefixes from categories marked for removal, direct them to 일반선택 if it exists
      if (generalElectiveCategory) {
        categoriesToRemove.forEach(category => {
          const prefixMatch = category.name.match(/^_TO_REMOVE_([A-Z]+)\s+/);
          if (prefixMatch) {
            const prefix = prefixMatch[1];
            console.log(`Mapping prefix ${prefix} to 일반선택 category (ID: ${generalElectiveCategory.id})`);
            prefixCategoryMap[prefix] = generalElectiveCategory.id;
          }
        });
      }
      
      console.log('Semester Map for adding courses:', semesterMap);
      console.log('Category Map for adding courses:', categoryMap);
      console.log('Prefix Category Map for adding courses:', prefixCategoryMap);
      
      // Add courses with the latest state
      const successCount = await addCoursesSequentially(
        parsedCourseData,
        semesterMap,
        categoryMap,
        prefixCategoryMap,
        useCourseStore.getState().addCourse
      ) || 0;
      
      // After adding courses, remove the categories marked for removal
      if (categoriesToRemove.length > 0) {
        console.log('Removing categories marked for deletion:', categoriesToRemove);
        categoriesToRemove.forEach(category => {
          useCourseStore.getState().removeCategory(category.id);
        });
      }
      
      setIsLoading(false);
      
      // Final confirmation
      if (successCount > 0) {
        alert(`${successCount}개의 과목을 성공적으로 불러왔습니다.`);
        if (onSuccess) {
          onSuccess(); // Call the onSuccess callback if provided
        }
      } else {
        alert('과목 추가 중 문제가 발생했습니다. 개발자 콘솔을 확인해주세요.');
      }
    } catch (error) {
      console.error('Error importing courses:', error);
      setIsLoading(false);
      alert('데이터 처리 중 오류가 발생했습니다.');
    }
  };

  // Cancel major selection and continue with normal import
  const handleMajorSelectionCancel = () => {
    setShowMajorModal(false);
    continueWithCourseImport();
  };

  // Handle import button click
  const handleImport = async () => {
    if (!transcriptText.trim()) {
      alert('성적표 데이터를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Parse the transcript text
      const courseData = parseTranscriptData(transcriptText);
      setParsedCourseData(courseData);
      
      if (courseData.length === 0) {
        alert('유효한 데이터를 찾을 수 없습니다. 데이터 형식을 확인해주세요.');
        setIsLoading(false);
        return;
      }
      
      console.log('Parsed course data:', courseData);
      
      // Step 1: Clear everything
      console.log('Resetting all courses...');
      resetAllCourses();
      
      // Wait to ensure reset is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Configure semesters first
      console.log('Configuring semesters...');
      configureSemesters(courseData);
      
      // Step 3: Wait for semesters to be created
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Semesters after creation:', semesters);
      
      if (semesters.length === 0) {
        console.error('No semesters were created.');
        alert('학기 설정 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }
      
      // Step 4: Configure categories
      console.log('Configuring categories...');
      configureCategories(courseData);
      
      // Step 5: Wait for categories to be created
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Categories after creation:', categories);
      
      if (categories.length === 0) {
        console.error('No categories were created.');
        alert('카테고리 설정 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }
      
      // Step 6: Check for multiple major code prefixes
      const majorPrefixes = analyzeMajorCodePrefixes(courseData);
      console.log('Major prefixes found:', majorPrefixes);
      
      // If multiple major prefixes are found, show the modal for selection
      if (majorPrefixes.length >= 2) {
        setMajorPrefixOptions(majorPrefixes);
        setShowMajorModal(true);
      } else {
        // If no or just one major prefix, continue with normal import
        continueWithCourseImport();
      }
      
    } catch (error) {
      console.error('Error importing transcript data:', error);
      alert('데이터 처리 중 오류가 발생했습니다. 데이터 형식을 확인해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[white] dark:bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">수강 과목 업로드</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        아래 텍스트박스에 KUPID - 전체성적조회 - 성적확정자료 하단의 표를 복사하여 붙여넣으세요. 
      </p>
      
      <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 pl-3 py-2 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-bold mb-1">데이터 형식 안내:</h3>
        <p className="mb-2">각 줄마다 하나의 과목 정보가 다음 순서로 포함되어야 합니다:</p>
        <p className="font-mono bg-gray-100 dark:bg-gray-700 p-1 mb-2 rounded">년도 학기 학수번호 과목명 이수구분 [교양영역] [과목유형] 학점 점수 등급 평점 [재수강년도] [재수강학기] [재수강과목] [삭제구분]</p>
        <p className="font-mono bg-gray-100 dark:bg-gray-700 p-1 mb-2 rounded">예시: 2020	1	CHEM15107	일반화학및연습Ⅰ(영강)	교양	전공관련교양		3	100	A+	4.5	</p>
        <p className="font-mono bg-gray-100 dark:bg-gray-700 p-1 mb-2 rounded">//[] 사이의 항목은 비워두어도 되는 항목입니다.</p>
        <ul className="list-disc pl-5 mt-2">
          <li>각 항목이 공백으로 구분됩니다.</li>
          <li>계절학기는 자동으로 별도 학기로 처리됩니다.</li>
          <li>"전공"이 포함된 이수구분은 전공으로 분류됩니다.</li>
          <li>과목명에 "영강" 또는 "외국어강의"가 포함된 경우 영어강의로 구분됩니다.</li>
          <li>학수번호 접두사가 2개 이상 발견되면 본전공/제2전공 선택 창이 나타납니다.</li>
          <li>선택되지 않은 전공 접두사들은 "일반선택" 카테고리로 자동 분류됩니다.</li>
          <li>교양영역은 비워둘 수 있습니다.</li>
        </ul>
      </div>
      
      <textarea
        className="w-full h-32 p-2 border-1 rounded mb-4 dark:bg-gray-700 dark:text-white font-mono text-sm bg-gray-50"
        placeholder="KUPID>전체성적조회>성적확정자료 하단의 표를 복사하여 붙여넣으세요"
        value={transcriptText}
        onChange={(e) => setTranscriptText(e.target.value)}
        disabled={isLoading}
      />
      
      <button
        className={`px-4 py-2 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full w-full relative shadow-none`}
        onClick={handleImport}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            성적표 처리 중...
          </div>
        ) : (
          '성적표 불러오기'
        )}
      </button>

      {/* Major Selection Modal */}
      {showMajorModal && (
        <MajorSelectionModal
          prefixOptions={majorPrefixOptions}
          onSelect={handleMajorSelection}
          onCancel={handleMajorSelectionCancel}
        />
      )}
    </div>
  );
};

export default TranscriptChart;
