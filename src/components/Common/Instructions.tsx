import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Instructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Add keyboard event listener to close the popup when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="toolbar-secondary-control mx-auto flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition"
        aria-expanded={isOpen}
        aria-controls="instructions-dialog"
        aria-haspopup="dialog"
      >
        <span>사용 설명서</span>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      
      {isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close if clicking on the backdrop
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            id="instructions-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="instructions-title"
            className="relative max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#8B0029]/15 bg-[#FEF9E1] p-6 text-[#333333] shadow-xl dark:border-white/10 dark:bg-gray-800 dark:text-[#F8F2DE]"
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-gray-500 hover:bg-[#E5D0AC]/60 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              onClick={() => setIsOpen(false)}
              aria-label="사용 설명서 닫기"
              autoFocus
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
            
            <div className="space-y-5">
              <section>
                <h3
                  id="instructions-title"
                  className="mb-2 pr-8 text-xl font-bold text-[#8B0029] dark:text-[#F8F2DE]"
                >
                  졸업하고싶은 호랭이 사용 설명서
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  학기별 수강 과목과 졸업 요건을 한 화면에서 정리하는 수강 계획표입니다.
                  노트북이나 태블릿처럼 넓은 화면에서 사용하는 것을 권장합니다.
                </p>
              </section>

              <section className="rounded-lg bg-[#F4E6C8] p-4 dark:bg-gray-900/60">
                <h4 className="mb-3 font-bold text-[#8B0029] dark:text-[#F8F2DE]">
                  빠른 시작
                </h4>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    표 왼쪽 위의 <strong>+</strong>를 눌러 학기를 추가하고, 왼쪽 아래의{' '}
                    <strong>+</strong>를 눌러 수업 분류를 추가합니다.
                  </li>
                  <li>
                    빈 과목 칸의 아무 곳이나 눌러 과목을 추가합니다. 입력된 과목을 누르면
                    내용을 수정하거나 삭제할 수 있습니다.
                  </li>
                  <li>
                    학기 칸이나 수업 분류 칸의 아무 곳이나 누르면 이름, 필요 학점, 전공
                    유형을 수정하거나 해당 항목을 삭제할 수 있습니다.
                  </li>
                  <li>
                    과목은 다른 학기나 분류로 드래그할 수 있고, 수업 분류도 위아래로
                    드래그해 순서를 바꿀 수 있습니다.
                  </li>
                </ol>
              </section>

              <section>
                <h4 className="mb-2 font-bold text-[#8B0029] dark:text-[#F8F2DE]">
                  과목 칸 표시
                </h4>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  <li>3학점 일반 과목은 별도의 학점 표시가 없습니다.</li>
                  <li>
                    3학점이 아닌 과목은 <strong>(1)</strong>, 영강은 <strong>(E)</strong>,
                    두 조건에 모두 해당하면 <strong>(1,E)</strong>처럼 표시됩니다.
                  </li>
                  <li>
                    <strong>재수강/학점포기</strong>로 설정한 과목은 교차선으로 표시됩니다.
                    과목명, 학점과 성적은 그대로 보이지만 취득 학점, 요약과 GPA 계산에서는
                    제외됩니다.
                  </li>
                  <li>
                    <strong>영강</strong>으로 설정한 과목은 전체 영강 수에도 포함됩니다.
                  </li>
                </ul>
              </section>

              <section>
                <h4 className="mb-2 font-bold text-[#8B0029] dark:text-[#F8F2DE]">
                  성적과 학점 계산
                </h4>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  <li>
                    <strong>F</strong>는 GPA에 0점으로 반영되며 취득 학점에는 포함되지
                    않습니다.
                  </li>
                  <li>
                    <strong>P</strong>는 GPA에서 제외되지만 취득 학점에는 포함됩니다.
                  </li>
                  <li>
                    <strong>NP와 N/A</strong>는 GPA와 취득 학점 모두에서 제외됩니다.
                  </li>
                  <li>
                    툴바 왼쪽의 <strong>4.5/4.3</strong> 선택기로 GPA 만점 체계를 바꿀 수
                    있습니다.
                  </li>
                  <li>
                    수업 분류를 본전공이나 제2전공으로 지정하면 전체, 본전공, 제2전공
                    학점과 GPA를 구분해 계산합니다.
                  </li>
                </ul>
              </section>

              <section className="rounded-lg border border-[#8B0029]/10 p-4 dark:border-white/10">
                <h4 className="mb-2 font-bold text-[#8B0029] dark:text-[#F8F2DE]">
                  KUPID 업로드
                </h4>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    KUPID <strong>전체성적조회 → 학기별 성적</strong>에서 첫 학기 이름부터
                    마지막 학기의 환산점수까지 전체 내용을 복사합니다.
                  </li>
                  <li>
                    <strong>과목별 성적</strong>에서 제일 위 과목의 학수번호부터 마지막
                    과목까지 전체 내용을 복사합니다.
                  </li>
                  <li>
                    툴바의 <strong>KUPID 업로드</strong>를 열어 학기별 성적은 왼쪽, 과목별
                    성적은 오른쪽 칸에 붙여넣고 <strong>업로드</strong>를 누릅니다.
                  </li>
                  <li>
                    불러오기 전 확인 화면에서 감지된 학기 이름과 과목 수를 확인한 뒤
                    가져오기를 확정합니다. 전공 학수번호가 여러 개면 본전공과 제2전공을
                    선택하는 단계가 표시됩니다.
                  </li>
                </ol>
                <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
                  KUPID 가져오기를 확정하면 현재 계획이 새 성적표 내용으로 교체됩니다.
                  먼저 저장하기/export로 백업하는 것을 권장합니다.
                </p>
              </section>

              <section>
                <h4 className="mb-2 font-bold text-[#8B0029] dark:text-[#F8F2DE]">
                  저장, 백업과 불러오기
                </h4>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  <li>
                    계획, 테마와 GPA 체계는 쿠키가 아니라 현재 브라우저의{' '}
                    <strong>localStorage</strong>에 자동 저장됩니다.
                  </li>
                  <li>
                    <strong>저장하기/export</strong>는 현재 계획을 JSON 백업 파일로
                    다운로드합니다.
                  </li>
                  <li>
                    <strong>불러오기/import</strong>는 백업 파일을 확인한 뒤 현재 계획을
                    해당 파일의 내용으로 교체합니다.
                  </li>
                  <li>
                    다른 기기나 브라우저로 계획을 옮기거나 브라우저 데이터를 삭제하기
                    전에는 반드시 백업 파일을 저장해주세요.
                  </li>
                </ul>
              </section>

              <section>
                <h4 className="mb-2 font-bold text-[#8B0029] dark:text-[#F8F2DE]">
                  화면과 조작
                </h4>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  <li>툴바의 해/달 버튼으로 라이트 모드와 다크 모드를 전환할 수 있습니다.</li>
                  <li>
                    페이지 맨 위에서 아래로 스크롤하면 헤더가 먼저 축소됩니다. 헤더가
                    축소된 다음 스크롤부터 계획표가 이동합니다.
                  </li>
                  <li>
                    팝업은 바깥 영역을 누르거나 <strong>Esc</strong>를 눌러 닫을 수
                    있습니다.
                  </li>
                  <li>
                    삭제와 계획 교체는 되돌리기 기능이 없으므로 중요한 변경 전에는 백업을
                    권장합니다.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Instructions;
