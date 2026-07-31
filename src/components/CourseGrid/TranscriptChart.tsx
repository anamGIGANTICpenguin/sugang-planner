import React, { useState } from 'react';
import { useCourseStore } from '../../store/courseStore';
import kupidCourseCopyGuide from '../../assets/kupid-course-copy-guide.png';
import kupidSemesterCopyGuide from '../../assets/kupid-semester-copy-guide.png';
import { addCoursesSequentially } from './courseUtils';
import { 
  updateCategoriesBasedOnMajorSelection, 
  extractCodePrefix 
} from './transcriptUtils';
import MajorSelectionModal from './MajorSelectionModal';
import {
  tryParseCourseOnlyTabularTranscript,
  tryParseVerticalTranscript,
  VerticalTranscriptCourse,
  VerticalSemesterGroup,
} from './verticalTranscriptParser';
import {
  assignCoursesToSemesterSummaries,
  parseSemesterCreditSummaries,
} from './semesterSummaryParser';

interface TranscriptChartProps {
  onSuccess?: () => void; // Callback function to be called after successful import
}

interface CourseData {
  year: string;
  semester: string;
  semesterGroupId?: string;
  semesterOrder?: number;
  semesterLabel?: string;
  courseCode: string;
  section?: string;
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
  const [semesterTranscriptText, setSemesterTranscriptText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [majorPrefixOptions, setMajorPrefixOptions] = useState<Array<{ prefix: string; count: number }>>([]);
  const [parsedCourseData, setParsedCourseData] = useState<CourseData[]>([]);
  const [pendingCourseData, setPendingCourseData] = useState<CourseData[]>([]);
  const [verticalSemesterGroups, setVerticalSemesterGroups] = useState<VerticalSemesterGroup[]>([]);
  const [semesterLabels, setSemesterLabels] = useState<Record<string, string>>({});
  const [showImportPreview, setShowImportPreview] = useState(false);
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
    const errorMessages: string[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      try {
        if (!line.trim()) continue; // Skip empty lines
        
        // First try to split by tabs, then fall back to spaces if no tabs found
        let parts = line.trim().split('\t');
        if (parts.length === 1) {
          // No tabs found, split by spaces
          parts = line.trim().split(/\s+/);
        }
        
        if (parts.length < 8) {
          errorMessages.push(`라인 ${lineIndex + 1}: 데이터가 부족합니다. 최소 8개 항목이 필요하지만 ${parts.length}개만 있습니다.\n데이터: "${line.trim()}"`);
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
        
        // Try a regex approach first for more accurate parsing - handle both tab and space separation
        const tabRegex = /^([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]*)\t?([^\t]*)\t?(\d+(?:\.\d+)?)\t(\d+(?:\.\d+)?)\t([A-Z+\-]+|P)\t(\d+(?:\.\d+)?).*$/;
        const spaceRegex = /^(\d{4}|\S+)\s+(\S+)\s+(\S+)\s+(.+?)\s+([^\s\d]+)\s+([^\d]*?)(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+([A-Z+\-]+|P)\s+(\d+(?:\.\d+)?).*$/;
        
        let match = line.match(tabRegex);
        if (!match) {
          match = line.match(spaceRegex);
        }
        
        if (match) {
          const [_, year, semester, courseCode, courseName, category, subcategory, , credits, score, letterGrade, numberGrade] = match;
          
          // Check for retake or dropped course info at the end of the line
          let isRetake = false;
          
          // Look for 재수강 or 학점포기 at the end of the line
          if (line.includes('재수강') || line.includes('학점포기')) {
            isRetake = true;
          }
          
          parsedData.push({
            year: year.trim(),
            semester: semester.trim(),
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            category: category.trim(),
            subcategory: subcategory ? subcategory.trim() : '',
            credits: parseFloat(credits) || 0,
            score: parseFloat(score) || 0,
            letterGrade: letterGrade.trim(),
            numberGrade: parseFloat(numberGrade) || 0,
            isRetake,
            isDropped: isRetake // Set isDropped to same value as isRetake
          });
          
          continue; // Skip to next line if regex matched
        }
        
        // Fallback to the position-based parsing approach
        // First try tab separation, then space separation
        let lineParts = line.trim().split('\t');
        if (lineParts.length === 1) {
          lineParts = line.trim().split(/\s+/);
        }
        
        if (lineParts.length < 8) {
          console.warn('Line has too few parts, skipping:', line);
          continue;
        }
        
        // For tab-separated data, the structure is usually more predictable
        if (line.includes('\t')) {
          // Tab-separated: assume standard order
          const year = lineParts[0] || '';
          const semester = lineParts[1] || '';
          const courseCode = lineParts[2] || '';
          const courseName = lineParts[3] || '';
          const category = lineParts[4] || '';
          const subcategory = lineParts[5] || '';
          // Skip potential empty fields for 과목유형
          let creditsIndex = 6;
          while (creditsIndex < lineParts.length && (!lineParts[creditsIndex] || lineParts[creditsIndex].trim() === '')) {
            creditsIndex++;
          }
          
          const credits = parseFloat(lineParts[creditsIndex]) || 0;
          const score = parseFloat(lineParts[creditsIndex + 1]) || 0;
          const letterGrade = lineParts[creditsIndex + 2] || '';
          const numberGrade = parseFloat(lineParts[creditsIndex + 3]) || 0;
          
          // Check for retake or dropped course info
          let isRetake = false;
          for (let i = creditsIndex + 4; i < lineParts.length; i++) {
            if (lineParts[i] === '재수강' || lineParts[i] === '학점포기') {
              isRetake = true;
              break;
            }
          }
          
          parsedData.push({
            year: year.trim(),
            semester: semester.trim(),
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            category: category.trim(),
            subcategory: subcategory.trim(),
            credits,
            score,
            letterGrade: letterGrade.trim(),
            numberGrade,
            isRetake,
            isDropped: isRetake
          });
          
          continue;
        }
        
        // Extract the basic parts we're confident about
        const year = lineParts[0];
        const semester = lineParts[1];
        const courseCode = lineParts[2];
        
        // The course name might contain spaces, so we need to find where it ends
        // Strategy: look for a pattern where we have non-numeric values followed by numeric values
        let courseNameEndIndex = -1;
        let categoryIndex = -1;
        
        // Look for the pattern: [courseName] [category] [subcategory?] [credits] [score] [grade] [gpa]
        // We'll identify where the numeric values start working backwards
        let firstNumericIndex = -1;
        for (let i = lineParts.length - 1; i >= 3; i--) {
          if (/^\d+(\.\d+)?$/.test(lineParts[i]) || /^[A-Z][+\-]?$/.test(lineParts[i]) || lineParts[i] === 'P') {
            firstNumericIndex = i;
          } else {
            break;
          }
        }
        
        if (firstNumericIndex !== -1 && firstNumericIndex >= 7) { // Need at least 4 numeric/grade values
          // Now find the category by looking for the first non-course-name word before the numeric section
          // Usually categories are single words or short phrases
          for (let i = 3; i < firstNumericIndex - 3; i++) { // Leave space for at least credits, score, grade, gpa
            const potentialCategory = lineParts[i];
            // Check if this looks like a category (not likely to be part of a course name)
            if (potentialCategory && !potentialCategory.match(/^[IVX]+$/) && // Not roman numerals
                potentialCategory.length > 1) { // Not single characters
              // This is likely our category
              categoryIndex = i;
              courseNameEndIndex = i - 1;
              break;
            }
          }
        }
        
        // If we still couldn't find it, try a different approach
        if (courseNameEndIndex === -1) {
          // Look for common patterns in category names or fall back to a reasonable guess
          for (let i = 3; i < lineParts.length - 4; i++) { // Need at least 4 values for credits, score, grade, gpa
            const word = lineParts[i];
            // Check if this could be a category based on common patterns
            if (word && (
              word.includes('전공') || word.includes('교양') || word.includes('학부') || 
              word.includes('기초') || word.includes('선택') || word.includes('필수') ||
              word.includes('공통') || word.includes('교직') || word.includes('자유') ||
              word.match(/^[가-힣]+$/) // Korean characters only (likely category)
            )) {
              categoryIndex = i;
              courseNameEndIndex = i - 1;
              break;
            }
          }
        }
        
        if (courseNameEndIndex === -1) {
          errorMessages.push(`라인 ${lineIndex + 1}: 과목명과 이수구분을 구분할 수 없습니다. 데이터 형식을 확인해주세요.\n데이터: "${line.trim()}"`);
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
            errorMessages.push(`라인 ${lineIndex + 1}: 학점, 점수, 등급, 평점을 찾을 수 없습니다. 숫자와 등급 데이터를 확인해주세요.\n데이터: "${line.trim()}"`);
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
        errorMessages.push(`라인 ${lineIndex + 1}: 데이터 처리 중 오류가 발생했습니다. ${error instanceof Error ? error.message : '알 수 없는 오류'}\n데이터: "${line.trim()}"`);
      }
    }
    
    // If there were parsing errors, throw them as a combined error
    if (errorMessages.length > 0) {
      const errorSummary = `데이터 파싱 중 ${errorMessages.length}개의 오류가 발생했습니다:\n\n${errorMessages.join('\n\n')}`;
      throw new Error(errorSummary);
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
    const regularSemesters = new Map<string, { label: string; order: number }>();
    let hasSeasonalSemester = false;
    let hasMilitarySemester = false;
    
    courseData.forEach(course => {
      if (course.year === '군복무중이수') {
        hasMilitarySemester = true;
        hasSeasonalSemester = true; // We'll merge military with seasonal
      } else if (course.semester.includes('계절')) {
        hasSeasonalSemester = true;
      } else if (course.semesterGroupId && course.semesterLabel) {
        regularSemesters.set(course.semesterGroupId, {
          label: course.semesterLabel,
          order: course.semesterOrder ?? regularSemesters.size,
        });
      } else {
        const key = `${course.year}-${course.semester}`;
        regularSemesters.set(key, {
          label: `${course.year}년 ${course.semester}학기`,
          order: Number.parseInt(course.year) * 10 + Number.parseInt(course.semester),
        });
      }
    });

    // Create regular semesters in chronological order
    Array.from(regularSemesters.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .forEach(([_, semesterConfig]) => {
        addSemester(semesterConfig.label);
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
    
    // Check if we have any major courses first
    const hasMajorCourses = courseData.some(course => course.category.includes('전공'));
    
    // First, identify major and non-major categories
    courseData.forEach(course => {
      const mainCategory = course.category.trim();
      if (mainCategory) {
        const isMajor = mainCategory.includes('전공');
        
        if (isMajor && hasMajorCourses) {
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
          // Non-major category - add all unique categories
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
    
    // Only process major categories if we have major courses
    if (hasMajorCourses) {
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
    } else {
      console.log('No major courses found, skipping major category processing');
    }
  };

  // Handle major selection from the modal
  const handleMajorSelection = (primaryPrefix: string, secondaryPrefix: string, otherPrefixes: string[]) => {
    setShowMajorModal(false);
    
    console.log('Major selection completed:', {
      primary: primaryPrefix,
      secondary: secondaryPrefix,
      others: otherPrefixes
    });
    
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
  const continueWithCourseImport = async (courseData?: CourseData[]) => {
    try {
      // Use the passed courseData or fall back to the state
      const dataToProcess = courseData || parsedCourseData;
      console.log('=== DEBUG: continueWithCourseImport called ===');
      console.log('Course data passed as parameter:', courseData?.length);
      console.log('Course data from state:', parsedCourseData.length);
      console.log('Data to process length:', dataToProcess.length);
      
      // Use the latest state
      const latestSemesters = useCourseStore.getState().semesters;
      const latestCategories = useCourseStore.getState().categories;
      
      // Check if we have any major courses in our parsed data
      const hasMajorCourses = dataToProcess.some(course => course.category.includes('전공'));
      console.log('Has major courses in parsed data:', hasMajorCourses);
      
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
      
      // Find categories marked for removal (only relevant if we have major courses)
      const categoriesToRemove = hasMajorCourses ? 
        latestCategories.filter(cat => cat.name.startsWith('_TO_REMOVE_')) : 
        [];
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

      dataToProcess.forEach(course => {
        if (!course.semesterGroupId || !course.semesterLabel) return;
        const matchingSemester = latestSemesters.find(
          semester => semester.name === course.semesterLabel
        );
        if (matchingSemester) {
          semesterMap[course.semesterGroupId] = matchingSemester.id;
        }
      });
      
      // Standard category map for non-major courses
      const categoryMap = latestCategories.reduce((acc, category) => {
        // Skip categories marked for removal
        if (!category.name.startsWith('_TO_REMOVE_')) {
          acc[category.name] = category.id;
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Create prefix-to-category map for major courses (only if we have major courses)
      const prefixCategoryMap = hasMajorCourses ? 
        latestCategories.reduce((acc, category) => {
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
        }, {} as Record<string, string>) :
        {};
      
      // For prefixes from categories marked for removal, direct them to 일반선택 if it exists
      if (generalElectiveCategory && hasMajorCourses) {
        console.log('Processing categories marked for removal...');
        categoriesToRemove.forEach(category => {
          const prefixMatch = category.name.match(/^_TO_REMOVE_([A-Z]+)\s+/);
          if (prefixMatch) {
            const prefix = prefixMatch[1];
            console.log(`Mapping prefix ${prefix} to 일반선택 category (ID: ${generalElectiveCategory.id})`);
            prefixCategoryMap[prefix] = generalElectiveCategory.id;
          }
        });
        console.log('Finished processing categories marked for removal');
      } else {
        console.log('Skipping category removal processing:', {
          hasGeneralElective: !!generalElectiveCategory,
          hasMajorCourses,
          categoriesToRemoveCount: categoriesToRemove.length
        });
      }
      
      console.log('=== DEBUG: About to log mapping information ===');
      console.log('Semester Map for adding courses:', semesterMap);
      console.log('Category Map for adding courses:', categoryMap);
      console.log('Prefix Category Map for adding courses:', prefixCategoryMap);
      console.log('=== DEBUG: Mapping information logged successfully ===');
      
      console.log('=== DEBUG: About to call addCoursesSequentially ===');
      console.log('Parsed course data count:', dataToProcess.length);
      console.log('First few courses:', dataToProcess.slice(0, 3));
      
      // Validate that we have the required data before proceeding
      if (dataToProcess.length === 0) {
        console.error('No course data to process');
        throw new Error('과목 데이터가 없습니다.');
      }
      
      if (Object.keys(semesterMap).length === 0) {
        console.error('No semester mapping available');
        throw new Error('학기 정보가 없습니다.');
      }
      
      if (Object.keys(categoryMap).length === 0) {
        console.error('No category mapping available');
        throw new Error('카테고리 정보가 없습니다.');
      }
      
      console.log('=== DEBUG: Validation passed, calling addCoursesSequentially ===');
      
      // Add courses with the latest state
      const successCount = await addCoursesSequentially(
        dataToProcess,
        semesterMap,
        categoryMap,
        prefixCategoryMap,
        useCourseStore.getState().addCourse
      ).catch(error => {
        console.error('=== ERROR in addCoursesSequentially ===', error);
        throw error;
      }) || 0;
      
      console.log('=== DEBUG: addCoursesSequentially completed successfully ===');
      console.log('Success count:', successCount);
      
      // After adding courses, remove the categories marked for removal (only if we have major courses)
      if (categoriesToRemove.length > 0 && hasMajorCourses) {
        console.log('Removing categories marked for deletion:', categoriesToRemove);
        categoriesToRemove.forEach(category => {
          useCourseStore.getState().removeCategory(category.id);
        });
      }
      
      setIsLoading(false);
      
      // Final confirmation
      if (successCount > 0) {
        const majorMessage = hasMajorCourses ? '' : ' (전공 과목 없음)';
        alert(`${successCount}개의 과목을 성공적으로 불러왔습니다${majorMessage}.`);
        if (onSuccess) {
          onSuccess(); // Call the onSuccess callback if provided
        }
      } else {
        alert('과목 추가 중 문제가 발생했습니다. 다음을 확인해주세요:\n\n1. 모든 과목에 학점, 점수, 등급, 평점이 올바르게 입력되었는지\n2. 년도와 학기 정보가 올바른지\n3. 이수구분이 명확히 구분되어 있는지\n4. 데이터가 탭 또는 공백으로 구분되어 있는지');
      }
    } catch (error) {
      console.error('Error importing courses:', error);
      setIsLoading(false);
      
      // Provide specific error message based on the error type
      if (error instanceof Error) {
        if (error.message.includes('데이터 파싱')) {
          // This is a parsing error with detailed information
          alert(`데이터 업로드 실패:\n\n${error.message}\n\n해결 방법:\n1. KUPID에서 성적표를 다시 복사해주세요\n2. 각 줄이 탭으로 구분되어 있는지 확인해주세요\n3. 누락된 데이터가 있는지 확인해주세요`);
        } else {
          alert(`데이터 처리 중 오류가 발생했습니다:\n\n${error.message}\n\n데이터 형식을 확인하고 다시 시도해주세요.`);
        }
      } else {
        alert('알 수 없는 오류가 발생했습니다. 데이터 형식을 확인하고 다시 시도해주세요.');
      }
    }
  };

  // Cancel major selection and continue with normal import
  const handleMajorSelectionCancel = () => {
    console.log('Major selection cancelled by user');
    setShowMajorModal(false);
    // When cancelled, treat all major prefixes as general electives
    continueWithCourseImport();
  };

  // Step 1: Validate data integrity
  const validateDataIntegrity = (courseData: CourseData[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check if we have any data
    if (courseData.length === 0) {
      errors.push('유효한 데이터를 찾을 수 없습니다.');
      return { isValid: false, errors };
    }
    
    // Check for essential fields in each course
    courseData.forEach((course, index) => {
      if (
        (!course.year || !course.semester) &&
        (!course.semesterGroupId || !course.semesterLabel)
      ) {
        errors.push(`라인 ${index + 1}: 년도 또는 학기 정보가 누락되었습니다.`);
      }
      if (!course.courseCode || !course.courseName) {
        errors.push(`라인 ${index + 1}: 학수번호 또는 과목명이 누락되었습니다.`);
      }
      if (!course.category) {
        errors.push(`라인 ${index + 1}: 이수구분이 누락되었습니다.`);
      }
      if (course.credits <= 0 || course.score < 0 || !course.letterGrade) {
        errors.push(`라인 ${index + 1}: 학점, 점수, 또는 등급 정보가 잘못되었습니다.`);
      }
    });
    
    // Log information about course categories for debugging
    const categories = new Set(courseData.map(course => course.category));
    console.log('All categories found in data:', Array.from(categories));
    
    const majorCourses = courseData.filter(course => course.category.includes('전공'));
    console.log(`Found ${majorCourses.length} courses with '전공' in category out of ${courseData.length} total courses`);
    
    return { isValid: errors.length === 0, errors };
  };

  // Step 2: Analyze major categories and prefixes
  const analyzeMajorData = (courseData: CourseData[]): {
    majorCategories: string[];
    majorPrefixes: Array<{ prefix: string; count: number }>;
    hasMajorCourses: boolean;
  } => {
    const majorCategories = new Set<string>();
    const prefixCounts = new Map<string, number>();
    let hasMajorCourses = false;
    
    courseData.forEach(course => {
      // Find categories that contain '전공'
      if (course.category.includes('전공')) {
        hasMajorCourses = true;
        majorCategories.add(course.category);
        
        // Extract course code prefix for major courses
        const prefix = extractCodePrefix(course.courseCode);
        if (prefix) {
          prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
        }
      }
    });
    
    const majorPrefixes = Array.from(prefixCounts.entries())
      .map(([prefix, count]) => ({ prefix, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    return {
      majorCategories: Array.from(majorCategories),
      majorPrefixes,
      hasMajorCourses
    };
  };

  const showImportError = (error: unknown) => {
    console.error('Error importing transcript data:', error);
    setIsLoading(false);

    if (error instanceof Error) {
      if (error.message.includes('데이터 파싱')) {
        alert(`데이터 업로드 실패:\n\n${error.message}\n\n해결 방법:\n1. KUPID에서 성적표를 다시 복사해주세요\n2. 누락된 데이터가 있는지 확인해주세요\n3. 세로형 데이터라면 과목 사이의 빈 줄을 유지해주세요`);
      } else {
        alert(`데이터 처리 중 오류가 발생했습니다:\n\n${error.message}\n\n데이터 형식을 확인하고 다시 시도해주세요.`);
      }
    } else {
      alert('데이터 형식에 문제가 있습니다. KUPID 성적표의 표 전체를 다시 복사해주세요.');
    }
  };

  const prepareCourseImport = async (courseData: CourseData[]) => {
    const { isValid, errors } = validateDataIntegrity(courseData);
    if (!isValid) {
      throw new Error(`데이터 검증 실패:\n\n${errors.join('\n')}`);
    }

    setParsedCourseData(courseData);

    const { majorCategories, majorPrefixes, hasMajorCourses } = analyzeMajorData(courseData);
    console.log('Major categories found:', majorCategories);
    console.log('Major prefixes found:', majorPrefixes);

    // Nothing is replaced until the user has reviewed and confirmed the preview.
    resetAllCourses();
    await new Promise(resolve => setTimeout(resolve, 500));

    configureSemesters(courseData);
    await new Promise(resolve => setTimeout(resolve, 500));

    configureCategories(courseData);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!hasMajorCourses) {
      await continueWithCourseImport(courseData);
    } else if (majorPrefixes.length >= 2) {
      setMajorPrefixOptions(majorPrefixes);
      setShowMajorModal(true);
    } else if (majorPrefixes.length === 1) {
      const prefix = majorPrefixes[0].prefix;
      const confirmed = confirm(
        `전공 학수번호 접두사 "${prefix}"를 발견했습니다 (${majorPrefixes[0].count}개 과목).\n이것이 귀하의 본전공이 맞습니까?\n\n확인: 본전공으로 설정\n취소: 일반선택으로 분류`
      );

      if (confirmed) {
        setMajorPrefixOptions(majorPrefixes);
        setShowMajorModal(true);
      } else {
        await continueWithCourseImport(courseData);
      }
    } else {
      await continueWithCourseImport(courseData);
    }
  };

  // Parse first and present a preview. The planner is not changed at this stage.
  const handleImport = () => {
    if (!semesterTranscriptText.trim() || !transcriptText.trim()) {
      alert('학기별 성적과 과목별 성적을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const semesterSummaries = parseSemesterCreditSummaries(semesterTranscriptText);
      const courseOnlyTabularResult = tryParseCourseOnlyTabularTranscript(transcriptText);
      const verticalResult = tryParseVerticalTranscript(transcriptText);
      const unassignedCourseData = courseOnlyTabularResult
        ? courseOnlyTabularResult.courses
        : verticalResult
          ? verticalResult.courses
          : (parseTranscriptData(transcriptText) as VerticalTranscriptCourse[]);
      const assignment = assignCoursesToSemesterSummaries(
        unassignedCourseData,
        semesterSummaries
      );
      const courseData = assignment.courses as CourseData[];
      const { isValid, errors } = validateDataIntegrity(courseData);

      if (!isValid) {
        throw new Error(`데이터 검증 실패:\n\n${errors.join('\n')}`);
      }

      const groups = assignment.groups;
      const initialLabels = groups.reduce<Record<string, string>>((labels, group) => {
        labels[group.id] = group.label;
        return labels;
      }, {});

      setPendingCourseData(courseData);
      setVerticalSemesterGroups(groups);
      setSemesterLabels(initialLabels);
      setShowImportPreview(true);
      setIsLoading(false);
    } catch (error) {
      showImportError(error);
    }
  };

  const confirmImportPreview = async () => {
    const missingSemesterLabel = verticalSemesterGroups.some(
      group => !semesterLabels[group.id]?.trim()
    );
    if (missingSemesterLabel) {
      alert('모든 학기 이름을 입력해주세요.');
      return;
    }

    const normalizedLabels = verticalSemesterGroups.map(group =>
      semesterLabels[group.id].trim()
    );
    if (new Set(normalizedLabels).size !== normalizedLabels.length) {
      alert('각 학기 그룹에 서로 다른 학기 이름을 입력해주세요.');
      return;
    }

    const courseData = pendingCourseData.map(course =>
      course.semesterGroupId
        ? {
            ...course,
            semesterLabel: semesterLabels[course.semesterGroupId].trim(),
          }
        : course
    );

    setShowImportPreview(false);
    setIsLoading(true);
    try {
      await prepareCourseImport(courseData);
    } catch (error) {
      showImportError(error);
    }
  };

  return (
    <div className="relative max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#8B0029]/15 bg-[#FEF9E1] p-6 text-[#333333] shadow-xl dark:border-white/10 dark:bg-gray-800 dark:text-[#F8F2DE]">
      <h2 id="transcript-import-title" className="text-xl font-bold mb-4">수강 과목 업로드</h2>

      {showImportPreview ? (
        <div>
          <div className="mb-4 rounded-lg border border-[#8B0029]/15 bg-[#FEF9E1] p-4 dark:border-white/10 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-[#8B0029] dark:text-[#F8F2DE]">
              불러오기 전 확인
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">과목</span>
                <strong>{pendingCourseData.length}개</strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">학기</span>
                <strong>
                  {verticalSemesterGroups.length > 0
                    ? verticalSemesterGroups.length
                    : new Set(
                        pendingCourseData
                          .filter(course => course.year !== '군복무중이수')
                          .map(course => `${course.year}-${course.semester}`)
                      ).size}
                  개
                </strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">군학점</span>
                <strong>
                  {pendingCourseData.filter(course => course.year === '군복무중이수').length}개
                </strong>
              </div>
            </div>
          </div>

          {verticalSemesterGroups.length > 0 ? (
            <div className="mb-4">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                학기별 신청학점·취득학점과 과목 순서를 비교해 학기를 배정했습니다. 각
                그룹을 확인해주세요.
              </p>
              <div className="space-y-2">
                {verticalSemesterGroups.map(group => {
                  const groupCourses = pendingCourseData.filter(
                    course => course.semesterGroupId === group.id
                  );
                  return (
                    <label
                      key={group.id}
                      className="block rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <span className="mb-1 flex items-center justify-between gap-3 text-xs font-medium">
                        <span>학기 그룹 {group.order + 1}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {group.courseCount}개 과목
                        </span>
                      </span>
                      <input
                        type="text"
                        value={semesterLabels[group.id] ?? ''}
                        onChange={event =>
                          setSemesterLabels(labels => ({
                            ...labels,
                            [group.id]: event.target.value,
                          }))
                        }
                        placeholder="예: 2022년 1학기"
                        className="mb-1.5 w-full rounded-md border border-gray-300 bg-[#FFFDF5] px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {groupCourses
                          .slice(0, 4)
                          .map(course => course.courseName)
                          .join(', ')}
                        {groupCourses.length > 4 ? ` 외 ${groupCourses.length - 4}개` : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-[#F4E6C8] p-3 text-sm dark:bg-gray-900">
              <p className="mb-1 font-medium">감지된 학기</p>
              <p className="text-gray-600 dark:text-gray-300">
                {Array.from(
                  new Set(
                    pendingCourseData
                      .filter(course => course.year !== '군복무중이수')
                      .map(course => `${course.year}년 ${course.semester}학기`)
                  )
                ).join(', ')}
              </p>
            </div>
          )}

          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            현재 수강 계획은 아래 확인 버튼을 누르기 전까지 변경되지 않습니다.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowImportPreview(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-gray-600 dark:hover:bg-white/10"
            >
              다시 붙여넣기
            </button>
            <button
              type="button"
              onClick={confirmImportPreview}
              className="rounded-md bg-[#8B0029] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6d0020]"
            >
              확인하고 불러오기
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            KUPID 전체성적조회에서 학기별 성적과 과목별 성적을 각각 복사해 아래 칸에
            붙여넣으세요.
          </p>

          <div className="mb-4 rounded-lg border border-[#8B0029]/10 bg-[#F4E6C8] p-3 text-xs text-gray-600 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-300">
            <p className="mb-3">
              학기별 신청학점·취득학점과 과목 순서를 함께 비교해 각 과목의 학기를
              자동으로 찾습니다.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <section className="rounded-md border border-[#8B0029]/10 bg-[#FEF9E1]/85 p-2.5 dark:border-white/10 dark:bg-gray-800/70">
                <h3 className="mb-1 font-semibold text-[#8B0029] dark:text-[#F8F2DE]">
                  학기별 성적
                </h3>
                <p className="mb-2 leading-relaxed">
                  학기별 성적 탭에서는 <strong>“20**학년도 1학기”</strong>를 포함해서
                  마지막 학기 <strong>환산점수</strong>까지 복사해주세요.{' '}
                  <strong className="rounded bg-amber-100 px-1 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
                    마지막 학기 환산점수가 빠지지 않도록 주의해주세요.
                  </strong>
                </p>
                <img
                  src={kupidSemesterCopyGuide}
                  alt="학기별 성적에서 학기 이름부터 복사하는 예시"
                  className="w-full rounded border border-gray-200 bg-white dark:border-gray-600"
                />
              </section>

              <section className="rounded-md border border-[#8B0029]/10 bg-[#FEF9E1]/85 p-2.5 dark:border-white/10 dark:bg-gray-800/70">
                <h3 className="mb-1 font-semibold text-[#8B0029] dark:text-[#F8F2DE]">
                  과목별 성적
                </h3>
                <p className="mb-2 leading-relaxed">
                  과목별 성적 탭에서는 <strong>“20**학년도 1학기”</strong>가 복사되지
                  않습니다. 제일 상단의 수업 <strong>학수번호</strong>부터 복사해주세요.
                </p>
                <img
                  src={kupidCourseCopyGuide}
                  alt="과목별 성적에서 첫 수업의 학수번호부터 복사하는 예시"
                  className="w-full rounded border border-gray-200 bg-white dark:border-gray-600"
                />
              </section>
            </div>
            <p className="mt-3">
              두 탭 모두 위에서 아래까지 전체 내용을 복사한 뒤, 불러오기 전 확인
              화면에서 감지된 학기와 과목 수를 확인해주세요.
            </p>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#8B0029] dark:text-[#F8F2DE]">
                학기별 성적
              </span>
              <span className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
                학기별 성적 탭의 전체 내용을 붙여넣으세요.
              </span>
              <textarea
                className="h-44 w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#8B0029]/40 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder={'예: 2022학년도 1학기\n신청학점 18\n취득학점 18'}
                value={semesterTranscriptText}
                onChange={event => setSemesterTranscriptText(event.target.value)}
                disabled={isLoading}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#8B0029] dark:text-[#F8F2DE]">
                과목별 성적
              </span>
              <span className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
                과목별 성적 탭의 전체 내용을 붙여넣으세요.
              </span>
              <textarea
                className="h-44 w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#8B0029]/40 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder={'예: CHEM151\n14\n일반화학및연습Ⅰ(영강)\n교양'}
                value={transcriptText}
                onChange={event => setTranscriptText(event.target.value)}
                disabled={isLoading}
              />
            </label>
          </div>

          <button
            className={`relative w-full rounded-lg px-6 py-3 font-medium text-white transition-colors duration-200 ${
              isLoading
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-[#8B0029] hover:bg-[#6d0020]'
            }`}
            onClick={handleImport}
            disabled={isLoading}
          >
            {isLoading ? '성적표 처리 중...' : '업로드'}
          </button>
        </>
      )}

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
