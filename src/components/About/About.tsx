import React from 'react';
import { Link } from 'react-router-dom';
import cubadultImage from '../../assets/cubadult.png';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FEF9E1] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link 
          to="/"
          className="inline-block mb-8 text-[#8B0029] dark:text-[#F8F2DE] hover:underline"
        >
          ← Back / 돌아가기
        </Link>
        
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={cubadultImage} 
              alt="Cub Adult" 
              className="w-30 h-auto opacity-90 mx-auto"
            />
            <div className="h-4" />
            <h2 className="text-2xl font-bold text-[#8B0029] dark:text-[#F8F2DE] mb-2 gugi-regular">
              졸업하고싶은 호랭이
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              version 1.0.0
            </p>
          </div>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <section>
              <h3 className="font-bold text-lg mb-2 text-[#8B0029] dark:text-[#F8F2DE]">만든이</h3>
              <p className="text-sm">
                고려대학교 전기전자공학부 소속 <span className="font-bold">학부생</span>입니다.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2 text-[#8B0029] dark:text-[#F8F2DE]">연락처</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <a 
                    href="https://pf.kakao.com/_xnrxnwn" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    카카오톡 채널
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2 text-[#8B0029] dark:text-[#F8F2DE]">Special Thanks to</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>고려대 기계공학부 22학번 mnku</li>
                <li>국민대 자동차운송디자인학과 23학번 나다</li>
                <li>고려대 중어중문학과 22학번 애기능학식팟</li>
                <li>고려대 전기전자공학부 20학번 태나라태</li>
                <li>테스트를 도와준 동기들</li>
                <li>이미지를 제공해 준 GPT4o</li>
                <li>고려대의 모든 호랭이들</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
