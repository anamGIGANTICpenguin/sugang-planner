import React, { useEffect, useRef, useState } from 'react';
import { useCourseStore } from '../../store/courseStore';
import { Category, Course, Semester } from '../../types';
import Portal from './Portal';

interface PlannerBackup {
  state: {
    categories: Category[];
    semesters: Semester[];
  };
  version: number;
}

interface BackupFeedback {
  message: string;
  type: 'success' | 'error';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCourse = (value: unknown): value is Course => {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.credits === 'number' &&
    Number.isFinite(value.credits) &&
    (value.grade === undefined || typeof value.grade === 'string') &&
    (value.gpaValue === undefined || value.gpaValue === null || typeof value.gpaValue === 'number') &&
    (value.isRetake === undefined || typeof value.isRetake === 'boolean') &&
    (value.isDropped === undefined || typeof value.isDropped === 'boolean') &&
    (value.isEnglish === undefined || typeof value.isEnglish === 'boolean')
  );
};

const isSemester = (value: unknown): value is Semester => {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string';
};

const isCategory = (value: unknown): value is Category => {
  if (!isRecord(value) || !isRecord(value.courses)) return false;

  const hasValidCourses = Object.values(value.courses).every(
    courses => Array.isArray(courses) && courses.every(isCourse)
  );

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.requiredCredits === 'number' &&
    Number.isFinite(value.requiredCredits) &&
    typeof value.isMajor === 'boolean' &&
    (value.majorType === undefined ||
      value.majorType === 'primary' ||
      value.majorType === 'secondary') &&
    hasValidCourses
  );
};

const parseBackup = (value: unknown): PlannerBackup => {
  if (!isRecord(value) || !isRecord(value.state)) {
    throw new Error('플랜 백업 파일 형식이 아닙니다.');
  }

  const { categories, semesters } = value.state;

  if (
    !Array.isArray(categories) ||
    !categories.every(isCategory) ||
    !Array.isArray(semesters) ||
    !semesters.every(isSemester)
  ) {
    throw new Error('카테고리, 학기 또는 과목 데이터가 올바르지 않습니다.');
  }

  const categoryIds = new Set(categories.map(category => category.id));
  const semesterIds = new Set(semesters.map(semester => semester.id));

  if (categoryIds.size !== categories.length || semesterIds.size !== semesters.length) {
    throw new Error('중복된 카테고리 또는 학기 ID가 있습니다.');
  }

  return {
    state: { categories, semesters },
    version: typeof value.version === 'number' ? value.version : 0,
  };
};

const PlanBackup: React.FC = () => {
  const { categories, semesters, replacePlannerData } = useCourseStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<BackupFeedback | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const handleExport = () => {
    const backup: PlannerBackup = {
      state: {
        categories,
        semesters,
      },
      version: 0,
    };

    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `horang-course-plan-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    setFeedback({ message: '백업 파일을 저장했습니다.', type: 'success' });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('백업 파일은 5MB 이하여야 합니다.');
      }

      const backup = parseBackup(JSON.parse(await file.text()));
      const shouldReplace = window.confirm(
        '현재 플랜을 백업 파일의 내용으로 교체하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      );

      if (!shouldReplace) return;

      replacePlannerData(backup.state.categories, backup.state.semesters);
      setFeedback({ message: '수강 계획을 성공적으로 불러왔습니다.', type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setFeedback({ message: `플랜을 불러올 수 없습니다. ${message}`, type: 'error' });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="toolbar-secondary-control min-h-10 rounded-lg px-3.5 py-2 text-sm font-medium transition"
      >
        저장하기/export
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="toolbar-secondary-control min-h-10 rounded-lg px-3.5 py-2 text-sm font-medium transition"
      >
        불러오기/import
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImport}
        className="hidden"
      />

      {feedback && (
        <Portal>
          <div
            role="status"
            aria-live="polite"
            className={`fixed z-[10000] w-[calc(100%-2rem)] max-w-sm rounded-lg px-4 py-3 text-center text-sm font-medium text-white shadow-xl ${
              feedback.type === 'success' ? 'bg-green-700' : 'bg-red-700'
            }`}
            style={{ left: '50%', top: '1.25rem', transform: 'translateX(-50%)' }}
          >
            {feedback.message}
          </div>
        </Portal>
      )}
    </div>
  );
};

export default PlanBackup;
