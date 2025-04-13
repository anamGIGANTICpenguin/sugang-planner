import React, { useState } from 'react';

const Instructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#8B0029] text-white rounded-lg hover:bg-[#6d0020] transition-colors duration-200 dark:bg-[#9f1239] dark:hover:bg-[#881337]"
      >
        <span>사용 설명서</span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      <div 
        className={`mt-4 p-6 bg-white/80 rounded-lg shadow-lg dark:bg-gray-800/80 text-[#333333] dark:text-[#F8F2DE] transform transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 p-0 mt-0'
        }`}
      >
        <div className="space-y-4">
          <section>
            <h3 className="font-bold mb-2 text-xl text-[#8B0029] dark:text-[#F8F2DE]">수강 계획을 한눈에 정리하고 싶은 사람이 만든 웹 어플리케이션</h3>
            <p className="text-xs">
            노트북, 태블릿 등 넓은 화면에서 사용하는 것을 권장합니다.
            </p>  
          </section>

          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">기본 사용법</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>수업 분류 추가: 왼쪽 하단 + 버튼</li>
              <li>학기 추가: 왼쪽 상단의 + 버튼</li>
              <li>과목 추가: 과목을 추가하고 싶은 영역을 클릭</li>
              <li>과목 편집: 과목을 클릭하여 수정</li>
              <li>수업 분류 순서 변경: 카테고리를 드래그하여 위치를 변경</li>
              <li>과목 이동: 과목을 드래그하여 다른 학기로 이동 가능</li>
              <li>F는 평점 상 0.00으로 계산되고, 취득학점에는 포함되지 않음</li>
              <li>P는 평점에 포함되지 않고, 취득학점에는 포함됨</li>
              <li>NP와 N/A는 평점, 취득학점 모두 포함되지 않음</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">기능</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>4.5학점제, 4.3학점제 사이에서 선택 가능</li>
              <li>재수강/수강철회: 과목 추가/수정 시 체크박스로 설정 가능</li>
              <li>전공 표시: 카테고리 생성/수정 시 '본전공' 혹은 '제2전공' 체크박스로 설정</li>
              <li>드래그 앤 드롭: 과목을 다른 학기로 이동시켜가며 손쉽게 여러 계획을 짤 수 있습니다   </li>
              <li>제2전공 평점 계산: 총 평점 및 전공 평점 이외에도 본전공과 제2전공의 평점을 따로 계산해 줍니다</li>
              <li>영어 강의: 영강을 몇 개 들었는지 표시해 줍니다</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">데이터 저장</h3>
            <p className="text-sm">
              모든 데이터는 자동으로 브라우저에 저장되며, 브라우저 데이터를 삭제하지 않는 한 유지됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
