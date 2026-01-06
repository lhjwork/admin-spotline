import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ExtensionDetector() {
  const [hasExtensions, setHasExtensions] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // 확장 프로그램 감지
    const detectExtensions = () => {
      // 일반적인 확장 프로그램 스크립트 감지
      const suspiciousScripts = document.querySelectorAll('script[src*="extension"], script[src*="contentscript"], script[src*="inject"]');

      // Chrome 확장 프로그램 특정 요소 감지
      const extensionElements = document.querySelectorAll('[id*="extension"], [class*="extension"], [data-extension]');

      // 알려진 확장 프로그램 패턴 감지
      const knownExtensionPatterns = ["academia-", "translations-", "contentscript", "inject.js"];

      const allScripts = Array.from(document.querySelectorAll("script"));
      const hasKnownExtensions = allScripts.some((script) => knownExtensionPatterns.some((pattern) => script.src.includes(pattern) || script.textContent?.includes(pattern)));

      if (suspiciousScripts.length > 0 || extensionElements.length > 0 || hasKnownExtensions) {
        setHasExtensions(true);
        setShowWarning(true);
      }
    };

    // 초기 감지
    detectExtensions();

    // DOM 변화 감지
    const observer = new MutationObserver(detectExtensions);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  if (!showWarning || !hasExtensions) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">브라우저 확장 프로그램 감지됨</h3>
            <p className="text-sm text-yellow-700">관리자 페이지의 보안을 위해 브라우저 확장 프로그램을 비활성화하거나 시크릿 모드를 사용해주세요.</p>
          </div>
        </div>
        <button onClick={() => setShowWarning(false)} className="text-yellow-600 hover:text-yellow-800">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
