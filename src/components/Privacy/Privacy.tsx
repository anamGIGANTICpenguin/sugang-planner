import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
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
          {/* English Version */}
          <div className="mb-16">
            <h1 className="text-3xl font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">Privacy Policy</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Last updated: April 13, 2025</p>
            
            <div className="space-y-8 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
              {/* Introduction */}
              <div className="space-y-4">
                <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
                <p>졸업하고싶은 호랑이 respects your privacy. This Privacy Policy explains how we handle data when you use our website.</p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[#8B0029] dark:text-[#F8F2DE]">Information We Collect</h2>
                <div className="space-y-4">
                  <p>We do not collect or store any personally identifiable information.</p>
                  <p>All information you input while using this site—such as your course plans or semester data—is stored only on your device's local storage (via your web browser). We have no access to this data.</p>
                  <p>However, we do use third-party services to collect general, anonymized usage data to improve our service.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[#8B0029] dark:text-[#F8F2DE]">Local Storage</h2>
                <div className="space-y-4">
                  <p>Our website uses your browser's local storage to save your planning progress. This allows your data to persist between visits without creating an account or sending data to our servers.</p>
                  <p>You can clear or reset this data anytime by clearing your browser's site data or cache.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[#8B0029] dark:text-[#F8F2DE]">Cookies & Google Analytics</h2>
                <p>We use Google Analytics to understand how visitors use our website. Google Analytics may collect information such as your device type, browser type, location (city-level), and the pages you visit. This information is anonymous and is used only to analyze and improve site performance.</p>
                <p>
                  Google Analytics may use cookies to collect this data. You can control cookie settings through your browser, and you can opt out of Google Analytics tracking by installing the browser add-on {' '}
                  <a 
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                  here
                  </a>.
                </p>
                <p>
                  For more information about how Google handles your data, see:{' '}
                  <a 
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                  Google Privacy Policy
                  </a>
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[#8B0029] dark:text-[#F8F2DE]">Third-Party Services</h2>
                <p>Aside from Google Analytics, we do not use any additional third-party services that collect your personal data.</p>
                <p>If we begin using other services (such as advertising platforms), we will update this Privacy Policy accordingly.</p>
              </section>

              {/* Contact Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[#8B0029] dark:text-[#F8F2DE]">Contact Us</h2>                <p>
                  If you have any questions about this Privacy Policy, You can contact us{' '}
                  <a 
                  href="https://pf.kakao.com/_xnrxnwn" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                  through our KakaoTalk channel
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 dark:border-gray-600 my-8"></div>

          {/* Korean Version */}
          <div className="mt-16">
            <h1 className="text-3xl font-bold mb-6 text-[#8B0029] dark:text-[#F8F2DE]">개인정보처리방침</h1>
          
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-[#8B0029] dark:text-[#F8F2DE]">1. 개인정보의 처리 목적</h2>
                <p>
                  졸업하고싶은 호랭이는 어떠한 개인정보도 수집하거나 저장하지 않습니다. 
                  모든 데이터는 사용자의 브라우저에 로컬로 저장되며, 외부 서버로 전송되지 않습니다.
                  다만, 사이트 품질 개선을 위해 Google Analytics를 이용하여 익명화된 웹사이트 사용 통계를 수집할 수 있습니다.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-[#8B0029] dark:text-[#F8F2DE]">2. 개인정보의 처리 및 보유기간</h2>
                <p>
                  사용자가 입력한 수강 정보는 사용자의 브라우저 로컬 스토리지에만 저장되며, 
                  브라우저 데이터를 삭제하지 않는 한 계속 유지됩니다.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-[#8B0029] dark:text-[#F8F2DE]">3. 처리하는 개인정보 항목</h2>
                <p>수집하는 개인정보 항목이 없습니다.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-[#8B0029] dark:text-[#F8F2DE]">4. 쿠키 및 Google Analytics 사용</h2>
                <p>
                  본 서비스는 Google Analytics를 사용하여 익명의 사용자 통계를 수집할 수 있습니다.
                  Google Analytics는 방문자의 기기 종류, 브라우저 정보, 방문한 페이지, 대략적인 위치(도시 단위) 등의 정보를 익명으로 수집합니다.
                  이는 서비스 개선을 위한 목적으로만 사용되며, 개인을 식별할 수 없습니다.
                </p>
                <p>
                  Google Analytics는 쿠키(cookie)를 사용할 수 있습니다. 쿠키는 브라우저 설정을 통해 거부할 수 있으며,{' '}
                  <a 
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                  여기
                  </a>
                  를 통해 Google Analytics의 추적을 차단할 수 있습니다.
                  Google의 개인정보 보호정책은{' '}
                  <a 
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                  여기
                  </a>
                  에서 확인하실 수 있습니다.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-[#8B0029] dark:text-[#F8F2DE]">5. 개인정보 보호책임자</h2>
                <p>
                  문의사항이 있으신 경우{' '}
                  <a 
                  href="https://pf.kakao.com/_xnrxnwn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                  카카오톡 채널
                  </a>
                  을 통해 연락주시기 바랍니다.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
