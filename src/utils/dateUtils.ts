// 한국 시간대 유틸리티 함수

const KOREA_TIMEZONE = "Asia/Seoul";

/**
 * 날짜를 한국 시간대로 포맷팅
 */
export const formatDateKST = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  };

  return dateObj.toLocaleDateString("ko-KR", defaultOptions);
};

/**
 * 날짜와 시간을 한국 시간대로 포맷팅
 */
export const formatDateTimeKST = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...options,
  };

  return dateObj.toLocaleString("ko-KR", defaultOptions);
};

/**
 * 상대적 시간 표시 (한국 시간 기준)
 */
export const formatRelativeTimeKST = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  // 한국 시간대로 변환
  const koreaDate = new Date(dateObj.toLocaleString("en-US", { timeZone: KOREA_TIMEZONE }));
  const koreaNow = new Date(now.toLocaleString("en-US", { timeZone: KOREA_TIMEZONE }));

  const diffMs = koreaNow.getTime() - koreaDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDateKST(dateObj);
};

/**
 * 현재 한국 시간 반환
 */
export const getCurrentKST = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: KOREA_TIMEZONE }));
};

/**
 * 시간대 정보 표시
 */
export const getTimezoneInfo = (): string => {
  const now = new Date();
  const koreaTime = now.toLocaleString("ko-KR", {
    timeZone: KOREA_TIMEZONE,
    timeZoneName: "short",
  });
  return koreaTime;
};
