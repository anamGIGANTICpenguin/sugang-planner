import { extractCodePrefix } from './transcriptUtils';

// A utility function to add courses one by one with proper delays
export const addCoursesSequentially = async (
  courseData: any[],
  semesterMap: Record<string, string>,
  categoryMap: Record<string, string>,
  prefixCategoryMap: Record<string, string>,
  addCourse: (categoryId: string, semesterId: string, course: any) => void
): Promise<number> => {
  let successCount = 0;
  
  // Add courses in smaller batches to prevent state update issues
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 300; // ms between batches
  const COURSE_DELAY = 100; // ms between courses in a batch
  
  // Process courses in batches
  for (let i = 0; i < courseData.length; i += BATCH_SIZE) {
    const batch = courseData.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(courseData.length/BATCH_SIZE)}`);
    
    // Process each course in the batch
    for (const course of batch) {
      let semesterId: string | undefined;
      
      // Determine which semester this course belongs to
      if (course.semester.includes('계절') || course.year === '군복무중이수') {
        semesterId = semesterMap['seasonal'];
      } else {
        semesterId = semesterMap[`${course.year}-${course.semester}`];
      }
      
      // Determine the appropriate category for the course
      let categoryId: string | undefined;
      
      if (course.category.includes('전공') && course.courseCode) {
        const prefix = extractCodePrefix(course.courseCode);
        
        if (prefix) {
          // First, try to find an exact match for prefix + subcategory
          let subcategoryName = '';
          
          // If subcategory exists, use it, otherwise fallback to the main category
          if (course.subcategory && course.subcategory.trim()) {
            subcategoryName = course.subcategory.trim();
          } else {
            subcategoryName = course.category.trim();
          }
          
          // Try to find a category that matches this prefix + subcategory
          const exactMatchKey = Object.keys(categoryMap).find(name => 
            name.startsWith(`${prefix} ${subcategoryName}`) && 
            name === `${prefix} ${subcategoryName}`
          );
          
          if (exactMatchKey) {
            categoryId = categoryMap[exactMatchKey];
            console.log(`Found exact match for ${prefix} ${subcategoryName}: ${course.courseName} → Category: ${exactMatchKey}`);
          }
          // If no exact match, try the prefix mapping (general major category)
          else if (prefixCategoryMap[prefix]) {
            categoryId = prefixCategoryMap[prefix];
            console.log(`Using prefix mapping for ${prefix}: ${course.courseName} → Category ID: ${categoryId}`);
          } 
          // If no mapping for this prefix, use the general category or 일반선택
          else {
            const generalCategoryId = categoryMap['일반선택'];
            if (generalCategoryId) {
              categoryId = generalCategoryId;
              console.log(`No prefix mapping for ${prefix}, assigning to 일반선택: ${course.courseName}`);
            } else {
              // Last resort: use the original category
              categoryId = categoryMap[course.category];
              console.log(`Fallback to original category: ${course.courseName} → ${course.category}`);
            }
          }
        } else {
          // No prefix, use the general category map
          categoryId = categoryMap[course.category];
          console.log(`No prefix found, using category map: ${course.courseName} → ${course.category}`);
        }
      } else {
        // Non-major courses use the general category map
        categoryId = categoryMap[course.category];
        console.log(`Non-major course: ${course.courseName} → ${course.category}`);
      }
      
      // If still no category, try the 일반선택 category
      if (!categoryId && categoryMap['일반선택']) {
        categoryId = categoryMap['일반선택'];
        console.log(`No category found, using 일반선택 as fallback for: ${course.courseName}`);
      }
      
      // Skip if we couldn't determine the semester or category
      if (!semesterId || !categoryId) {
        const missingInfo = [];
        if (!semesterId) missingInfo.push(`학기 정보 (${course.year}년 ${course.semester}학기)`);
        if (!categoryId) missingInfo.push(`카테고리 정보 (${course.category})`);
        
        console.warn(`Skipping course ${course.courseName}: ${missingInfo.join(', ')}을(를) 찾을 수 없습니다`);
        continue;
      }
      
      // Check if the course is taught in English (영강 or 외국어강의)
      const isEnglishCourse = course.courseName.includes('영강') || course.courseName.includes('외국어강의');
      
      // Create the course object to add with complete data
      const courseToAdd = {
        name: course.courseName.replace(/\s*\(영강\)|\s*\(외국어강의\)/g, ''), // Remove English indicators from name
        credits: course.credits,
        grade: course.letterGrade,
        gpaValue: course.numberGrade > 0 ? course.numberGrade : null,
        isRetake: course.isRetake || false, // Use the parsed retake status
        isDropped: course.isRetake || false, // Set to same value as isRetake
        isEnglish: isEnglishCourse // Set based on course name
      };
      
      try {
        // Add the course using the store action
        addCourse(categoryId, semesterId, courseToAdd);
        console.log(`Successfully added: ${course.courseName}`);
        successCount++;
        
        // Small delay between each course in a batch
        await new Promise(resolve => setTimeout(resolve, COURSE_DELAY));
      } catch (error) {
        console.error(`Error adding course ${course.courseName}:`, error);
        // Continue processing other courses even if one fails
      }
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < courseData.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  return successCount;
};
