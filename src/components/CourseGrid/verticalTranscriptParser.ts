export interface VerticalTranscriptCourse {
  year: string;
  semester: string;
  semesterGroupId?: string;
  semesterOrder?: number;
  semesterLabel?: string;
  courseCode: string;
  section: string;
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

export interface VerticalSemesterGroup {
  id: string;
  order: number;
  courseCount: number;
}

export interface VerticalTranscriptParseResult {
  courses: VerticalTranscriptCourse[];
  semesterGroups: VerticalSemesterGroup[];
}

interface ParsedRecord {
  course: Omit<
    VerticalTranscriptCourse,
    'year' | 'semester' | 'semesterGroupId' | 'semesterOrder' | 'semesterLabel'
  >;
  gapAfter: number;
  isMilitary: boolean;
}

const courseCodePattern = /^[A-Z]{2,}\d{3,4}$/;
const sectionPattern = /^[A-Z0-9]{2,3}$/;
const gradePattern = /^(?:[A-F][+-]?|P|NP|N\/A)$/;
const categoryPattern =
  /^(?:.*교양.*|학문의기초|전공.*|일반선택|교직.*|기초.*|공통.*|자유선택)$/;
const numberPattern = /^\d+(?:\.\d+)?$/;

const nextNonEmptyLine = (
  lines: string[],
  startIndex: number
): { value: string; index: number } | null => {
  for (let index = startIndex; index < lines.length; index++) {
    const value = lines[index].trim();
    if (value) return { value, index };
  }
  return null;
};

const findNextCourseCodeIndex = (lines: string[], startIndex: number): number => {
  for (let index = startIndex; index < lines.length; index++) {
    if (courseCodePattern.test(lines[index].trim())) return index;
  }
  return -1;
};

const countBlankLines = (lines: string[], startIndex: number, endIndex: number): number => {
  let count = 0;
  for (let index = startIndex; index < endIndex; index++) {
    if (!lines[index].trim()) count++;
  }
  return count;
};

const inferSemesterBoundary = (gap: number, ordinaryGap: number, largestGap: number): boolean => {
  if (largestGap < ordinaryGap + 3) return false;
  const threshold = ordinaryGap + Math.max(3, Math.ceil((largestGap - ordinaryGap) / 2));
  return gap >= threshold;
};

export const tryParseCourseOnlyTabularTranscript = (
  text: string
): VerticalTranscriptParseResult | null => {
  const rows = text.replace(/\r\n?/g, '\n').split('\n');
  const courses: VerticalTranscriptCourse[] = [];

  rows.forEach(row => {
    const columns = row.split('\t').map(column => column.trim());
    if (!courseCodePattern.test(columns[0] ?? '') || columns.length < 8) return;

    let creditsIndex = -1;
    for (let index = 4; index <= columns.length - 4; index++) {
      if (
        numberPattern.test(columns[index]) &&
        numberPattern.test(columns[index + 1]) &&
        gradePattern.test(columns[index + 2]) &&
        numberPattern.test(columns[index + 3])
      ) {
        creditsIndex = index;
        break;
      }
    }

    if (creditsIndex === -1) {
      throw new Error(`${columns[0]} 과목의 학점, 점수, 등급 또는 평점을 확인할 수 없습니다.`);
    }

    const markerText = columns.slice(5).join(' ');
    const isMilitary = markerText.includes('군복무중이수');
    const isRetake = markerText.includes('재수강') || markerText.includes('학점포기');

    courses.push({
      year: isMilitary ? '군복무중이수' : '',
      semester: isMilitary ? '계절' : '',
      courseCode: columns[0],
      section: columns[1] ?? '',
      courseName: columns[2] ?? '',
      category: columns[3] ?? '',
      subcategory: columns
        .slice(4, creditsIndex)
        .filter(value => value && !value.includes('군복무중이수'))
        .join(' '),
      credits: Number.parseFloat(columns[creditsIndex]),
      score: Number.parseFloat(columns[creditsIndex + 1]),
      letterGrade: columns[creditsIndex + 2],
      numberGrade: Number.parseFloat(columns[creditsIndex + 3]),
      isRetake,
      isDropped: isRetake,
    });
  });

  return courses.length > 0 ? { courses, semesterGroups: [] } : null;
};

/**
 * Parses the field-per-line text produced by some KUPID clipboard/browser combinations.
 * Returns null when the input does not look like that format so the existing row parser
 * can handle it.
 */
export const tryParseVerticalTranscript = (
  text: string
): VerticalTranscriptParseResult | null => {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const courseCodeCount = lines.filter(line => courseCodePattern.test(line.trim())).length;
  const tabularLineCount = lines.filter(line => line.split('\t').length >= 8).length;

  if (courseCodeCount === 0 || tabularLineCount > 0) return null;

  const records: ParsedRecord[] = [];
  let cursor = findNextCourseCodeIndex(lines, 0);

  while (cursor !== -1) {
    const courseCode = lines[cursor].trim();
    const sectionLine = nextNonEmptyLine(lines, cursor + 1);
    const nameLine = sectionLine ? nextNonEmptyLine(lines, sectionLine.index + 1) : null;
    const categoryLine = nameLine ? nextNonEmptyLine(lines, nameLine.index + 1) : null;

    if (
      !sectionLine ||
      !sectionPattern.test(sectionLine.value) ||
      !nameLine ||
      !categoryLine ||
      !categoryPattern.test(categoryLine.value)
    ) {
      throw new Error(
        `${courseCode} 과목의 분반, 과목명 또는 이수구분을 확인할 수 없습니다.`
      );
    }

    const metadata: Array<{ value: string; index: number }> = [];
    let valueCursor = categoryLine.index + 1;
    let creditsLine: { value: string; index: number } | null = null;

    while (valueCursor < lines.length) {
      const candidate = nextNonEmptyLine(lines, valueCursor);
      if (!candidate || courseCodePattern.test(candidate.value)) break;
      if (numberPattern.test(candidate.value)) {
        creditsLine = candidate;
        break;
      }
      metadata.push(candidate);
      valueCursor = candidate.index + 1;
    }

    const scoreLine = creditsLine ? nextNonEmptyLine(lines, creditsLine.index + 1) : null;
    const gradeLine = scoreLine ? nextNonEmptyLine(lines, scoreLine.index + 1) : null;
    const numberGradeLine = gradeLine ? nextNonEmptyLine(lines, gradeLine.index + 1) : null;

    if (
      !creditsLine ||
      !scoreLine ||
      !gradeLine ||
      !numberGradeLine ||
      !numberPattern.test(creditsLine.value) ||
      !numberPattern.test(scoreLine.value) ||
      !gradePattern.test(gradeLine.value) ||
      !numberPattern.test(numberGradeLine.value)
    ) {
      throw new Error(`${courseCode} 과목의 학점, 점수, 등급 또는 평점을 확인할 수 없습니다.`);
    }

    const nextCourseIndex = findNextCourseCodeIndex(lines, numberGradeLine.index + 1);
    const gapEnd = nextCourseIndex === -1 ? lines.length : nextCourseIndex;
    const trailingValues = lines
      .slice(numberGradeLine.index + 1, gapEnd)
      .map(line => line.trim())
      .filter(Boolean);
    const markerText = [...metadata.map(item => item.value), ...trailingValues].join(' ');
    const isMilitary = markerText.includes('군복무중이수');
    const isRetake = markerText.includes('재수강') || markerText.includes('학점포기');
    const subcategory = metadata
      .map(item => item.value)
      .filter(value => !value.includes('군복무중이수'))
      .filter(value => value !== '재수강' && value !== '학점포기')
      .join(' ')
      .trim();

    records.push({
      course: {
        courseCode,
        section: sectionLine.value,
        courseName: nameLine.value,
        category: categoryLine.value,
        subcategory,
        credits: Number.parseFloat(creditsLine.value),
        score: Number.parseFloat(scoreLine.value),
        letterGrade: gradeLine.value,
        numberGrade: Number.parseFloat(numberGradeLine.value),
        isRetake,
        isDropped: isRetake,
      },
      gapAfter: countBlankLines(lines, numberGradeLine.index + 1, gapEnd),
      isMilitary,
    });

    cursor = nextCourseIndex;
  }

  if (records.length === 0) return null;

  const regularGaps = records
    .slice(0, -1)
    .filter(record => !record.isMilitary)
    .map(record => record.gapAfter);
  const ordinaryGap = regularGaps.length > 0 ? Math.min(...regularGaps) : 0;
  const largestGap = regularGaps.length > 0 ? Math.max(...regularGaps) : ordinaryGap;

  let semesterOrder = 0;
  const groupCounts = new Map<string, number>();
  const courses = records.map((record, index) => {
    if (record.isMilitary) {
      return {
        ...record.course,
        year: '군복무중이수',
        semester: '계절',
      };
    }

    const semesterGroupId = `vertical-${semesterOrder + 1}`;
    groupCounts.set(semesterGroupId, (groupCounts.get(semesterGroupId) ?? 0) + 1);

    const course: VerticalTranscriptCourse = {
      ...record.course,
      year: '',
      semester: '',
      semesterGroupId,
      semesterOrder,
    };

    if (
      index < records.length - 1 &&
      inferSemesterBoundary(record.gapAfter, ordinaryGap, largestGap)
    ) {
      semesterOrder++;
    }

    return course;
  });

  const semesterGroups = Array.from(groupCounts.entries()).map(([id, courseCount], order) => ({
    id,
    order,
    courseCount,
  }));

  return { courses, semesterGroups };
};
