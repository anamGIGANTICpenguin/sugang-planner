import { VerticalTranscriptCourse } from './verticalTranscriptParser';

export interface SemesterCreditSummary {
  id: string;
  order: number;
  label: string;
  appliedCredits: number;
  earnedCredits: number;
}

export interface SemesterCourseGroup {
  id: string;
  order: number;
  courseCount: number;
  label: string;
  appliedCredits: number;
  earnedCredits: number;
}

export interface SemesterAssignmentResult {
  courses: VerticalTranscriptCourse[];
  groups: SemesterCourseGroup[];
}

const semesterHeadingPattern =
  /(\d{4})\s*학년도\s*(1|2)\s*학기|(\d{4})\s*학년도\s*(여름|겨울|하계|동계|계절)(?:\s*계절)?학기|(\d{4})\s*학년도\s*계절수업\s*\((여름|겨울)\)/g;

const parseCreditValue = (block: string, label: string): number | null => {
  const match = block.match(new RegExp(`${label}\\s*[:：]?\\s*(\\d+(?:\\.\\d+)?)`));
  return match ? Number.parseFloat(match[1]) : null;
};

const formatSemesterLabel = (match: RegExpExecArray): string => {
  const year = match[1] ?? match[3] ?? match[5];
  if (match[2]) return `${year}년 ${match[2]}학기`;

  const seasonalTerm = match[4] ?? match[6];
  const normalizedTerm =
    seasonalTerm === '여름' || seasonalTerm === '하계'
      ? '여름계절학기'
      : seasonalTerm === '겨울' || seasonalTerm === '동계'
        ? '겨울계절학기'
        : '계절학기';
  return `${year}년 ${normalizedTerm}`;
};

export const parseSemesterCreditSummaries = (text: string): SemesterCreditSummary[] => {
  const normalizedText = text.replace(/\r\n?/g, '\n');
  const matches = Array.from(normalizedText.matchAll(semesterHeadingPattern));

  if (matches.length === 0) {
    throw new Error(
      '학기별 성적에서 "2022학년도 1학기"와 같은 학기 정보를 찾을 수 없습니다.'
    );
  }

  return matches.map((match, index) => {
    const blockStart = match.index ?? 0;
    const blockEnd = matches[index + 1]?.index ?? normalizedText.length;
    const block = normalizedText.slice(blockStart, blockEnd);
    const unlabeledValues =
      block
        .slice(match[0].length)
        .match(/\d+(?:\.\d+)?/g)
        ?.map(value => Number.parseFloat(value)) ?? [];
    const appliedCredits = parseCreditValue(block, '신청학점') ?? unlabeledValues[0] ?? null;
    const earnedCredits = parseCreditValue(block, '취득학점') ?? unlabeledValues[1] ?? null;

    if (appliedCredits === null || earnedCredits === null) {
      throw new Error(
        `${formatSemesterLabel(match)}의 신청학점 또는 취득학점을 찾을 수 없습니다.`
      );
    }

    return {
      id: `summary-${index + 1}`,
      order: index,
      label: formatSemesterLabel(match),
      appliedCredits,
      earnedCredits,
    };
  });
};

const earnsCredit = (course: VerticalTranscriptCourse): boolean => {
  if (course.isRetake || course.isDropped) return false;
  return course.letterGrade !== 'F' && course.letterGrade !== 'NP' && course.letterGrade !== 'N/A';
};

const nearlyEqual = (left: number, right: number): boolean =>
  Math.abs(left - right) < 0.001;

const tryAssignCourses = (
  courses: VerticalTranscriptCourse[],
  summaries: SemesterCreditSummary[],
  excludeDroppedFromAppliedCredits: boolean,
  includeMilitaryCourses: boolean
): SemesterAssignmentResult | null => {
  const coursesToAssign = includeMilitaryCourses
    ? courses
    : courses.filter(course => course.year !== '군복무중이수');
  const unassignedMilitaryCourses = includeMilitaryCourses
    ? []
    : courses.filter(course => course.year === '군복무중이수');
  const assignedCourses: VerticalTranscriptCourse[] = [];
  const groups: SemesterCourseGroup[] = [];
  let courseIndex = 0;

  for (const summary of summaries) {
    const semesterCourses: VerticalTranscriptCourse[] = [];
    let appliedCredits = 0;
    let earnedCredits = 0;

    while (courseIndex < coursesToAssign.length) {
      const course = coursesToAssign[courseIndex];
      const appliedContribution =
        excludeDroppedFromAppliedCredits && (course.isRetake || course.isDropped)
          ? 0
          : course.credits;
      const earnedContribution = earnsCredit(course) ? course.credits : 0;
      const nextAppliedCredits = appliedCredits + appliedContribution;
      const nextEarnedCredits = earnedCredits + earnedContribution;

      if (
        nextAppliedCredits > summary.appliedCredits + 0.001 ||
        nextEarnedCredits > summary.earnedCredits + 0.001
      ) {
        return null;
      }

      semesterCourses.push({
        ...course,
        year: '',
        semester: '',
        semesterGroupId: summary.id,
        semesterOrder: summary.order,
        semesterLabel: summary.label,
      });
      courseIndex++;
      appliedCredits = nextAppliedCredits;
      earnedCredits = nextEarnedCredits;

      if (
        nearlyEqual(appliedCredits, summary.appliedCredits) &&
        nearlyEqual(earnedCredits, summary.earnedCredits)
      ) {
        break;
      }
    }

    if (
      !nearlyEqual(appliedCredits, summary.appliedCredits) ||
      !nearlyEqual(earnedCredits, summary.earnedCredits)
    ) {
      return null;
    }

    assignedCourses.push(...semesterCourses);
    groups.push({
      id: summary.id,
      order: summary.order,
      courseCount: semesterCourses.length,
      label: summary.label,
      appliedCredits: summary.appliedCredits,
      earnedCredits: summary.earnedCredits,
    });
  }

  if (courseIndex !== coursesToAssign.length) return null;

  return {
    courses: [...assignedCourses, ...unassignedMilitaryCourses],
    groups,
  };
};

export const assignCoursesToSemesterSummaries = (
  courses: VerticalTranscriptCourse[],
  summaries: SemesterCreditSummary[]
): SemesterAssignmentResult => {
  const assignment =
    tryAssignCourses(courses, summaries, false, true) ??
    tryAssignCourses(courses, summaries, true, true) ??
    tryAssignCourses(courses, summaries, false, false) ??
    tryAssignCourses(courses, summaries, true, false);

  if (!assignment) {
    const summaryCredits = summaries.reduce(
      (total, summary) => total + summary.appliedCredits,
      0
    );
    const courseCredits = courses.reduce((total, course) => total + course.credits, 0);

    throw new Error(
      `학기별 성적과 과목별 성적의 학점 합계를 맞출 수 없습니다. ` +
        `학기별 신청학점 ${summaryCredits}학점, 과목별 ${courseCredits}학점입니다. ` +
        '두 화면의 전체 내용을 시간순으로 다시 복사해주세요.'
    );
  }

  return assignment;
};
