import { Category } from '../../types';

// Interface for course data from transcript
export interface CourseData {
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
}

// Interface for code prefix count
interface CodePrefixCount {
  prefix: string;
  count: number;
  name?: string; // Optional name for display
  categoryName?: string; // Original category name
}

// Extract the code prefix (e.g., "COMP" from "COMP101")
export const extractCodePrefix = (courseCode: string): string => {
  // Match letters at the beginning of the course code
  const match = courseCode.match(/^[A-Za-z]+/);
  return match ? match[0].toUpperCase() : '';
};

// Analyze course codes to find multiple major prefixes and their associated categories
export const analyzeMajorCodePrefixes = (courseData: CourseData[]): CodePrefixCount[] => {
  // Only consider courses in major categories
  const majorCourses = courseData.filter(course => 
    course.category.includes('전공') && course.courseCode);
  
  // Track prefixes with their categories and counts
  const prefixData: Record<string, { count: number, categories: Set<string> }> = {};
  
  majorCourses.forEach(course => {
    const prefix = extractCodePrefix(course.courseCode);
    if (prefix) {
      if (!prefixData[prefix]) {
        prefixData[prefix] = { count: 0, categories: new Set() };
      }
      prefixData[prefix].count++;
      prefixData[prefix].categories.add(course.category);
    }
  });
  
  // Convert to array and sort by count (descending)
  const prefixCountArray: CodePrefixCount[] = Object.entries(prefixData)
    .map(([prefix, data]) => ({
      prefix,
      count: data.count,
      categoryName: Array.from(data.categories)[0] // Use the first category found
    }))
    // Include all prefixes, even those that appear only once
    .sort((a, b) => b.count - a.count);
  
  return prefixCountArray;
};

// Group courses by their code prefixes for category assignment
export const groupCoursesByPrefix = (courseData: CourseData[]): Record<string, CourseData[]> => {
  const coursesByPrefix: Record<string, CourseData[]> = {};
  
  courseData.forEach(course => {
    // Only process major courses with a code
    if (course.category.includes('전공') && course.courseCode) {
      const prefix = extractCodePrefix(course.courseCode);
      if (prefix) {
        if (!coursesByPrefix[prefix]) {
          coursesByPrefix[prefix] = [];
        }
        coursesByPrefix[prefix].push(course);
      }
    }
  });
  
  return coursesByPrefix;
};

// Create categories based on major prefixes
export const createCategoriesFromPrefixes = (
  prefixData: CodePrefixCount[],
  addCategory: (name: string, requiredCredits: number, isMajor?: boolean) => void,
  existingCategories: Category[]
): void => {
  // Create one category per prefix
  prefixData.forEach(({ prefix, categoryName }) => {
    if (categoryName) {
      const categoryBaseName = `${prefix} ${categoryName}`;
      // Check if this category already exists (from a previous run)
      const existingCategory = existingCategories.find(cat => 
        cat.name === categoryBaseName || 
        cat.name.startsWith(`${categoryBaseName} (`)
      );
      
      if (!existingCategory) {
        // Create a new category and explicitly set as major
        addCategory(categoryBaseName, 0, true);
      }
    }
  });
};

// Update categories based on major selection
export const updateCategoriesBasedOnMajorSelection = (
  existingCategories: Category[],
  primaryMajorPrefix: string,
  secondaryMajorPrefixes: string[],
  otherPrefixes: string[] = [],
  updateCategory: (id: string, name: string, requiredCredits: number, isMajor: boolean, majorType?: 'primary' | 'secondary') => void
): void => {
  console.log('Updating categories with primaryMajorPrefix:', primaryMajorPrefix);
  console.log('Secondary prefixes:', secondaryMajorPrefixes);
  console.log('Other prefixes to combine into 일반선택:', otherPrefixes);
  
  // Find or create the 일반선택 category
  let generalElectiveCategory = existingCategories.find(cat => cat.name === '일반선택');
  
  // If 일반선택 category doesn't exist, create it 
  if (!generalElectiveCategory) {
    console.error('Cannot find 일반선택 category. This is required for categorizing unchosen prefixes.');
    // We'll handle this case in continueWithCourseImport
  }
  
  // Update categories to mark primary and secondary majors
  existingCategories.forEach(category => {
    // Skip the 일반선택 category itself
    if (category.name === '일반선택') {
      return;
    }
    
    // First check if this is a major category
    if (category.isMajor) {
      // Extract the prefix from the category name
      const prefixMatch = category.name.match(/^([A-Z]+)\s+/);
      if (!prefixMatch) return;
      
      const prefix = prefixMatch[1];
      
      // Check if this is the primary major category
      const isPrimaryMajor = prefix === primaryMajorPrefix;
      
      // Check if this is a secondary major category
      const isSecondaryMajor = secondaryMajorPrefixes.length > 0 && 
        secondaryMajorPrefixes.includes(prefix);
      
      // Check if this is an "other" prefix that should be converted to 일반선택
      const isOtherPrefix = otherPrefixes.includes(prefix);
      
      if (isPrimaryMajor) {
        // Update to mark as primary major
        // Keep the original subcategory (e.g., "전공필수", "전공선택")
        console.log(`Marking ${category.name} as primary major`);
        updateCategory(
          category.id, 
          category.name, 
          category.requiredCredits, 
          true, 
          'primary'
        );
      } else if (isSecondaryMajor) {
        // Update to mark as secondary major
        console.log(`Marking ${category.name} as secondary major`);
        updateCategory(
          category.id, 
          category.name, 
          category.requiredCredits, 
          true, 
          'secondary'
        );
      } else if (isOtherPrefix) {
        // If it's an "other" prefix, mark it for removal by prefixing with _TO_REMOVE_
        console.log(`Marking ${category.name} for removal (will be combined into 일반선택)`);
        updateCategory(
          category.id,
          `_TO_REMOVE_${category.name}`, // Mark for removal
          category.requiredCredits,
          false
        );
      }
    }
  });
};
