import type { SpotCategory, RouteTheme } from "../types/v2";

// 서울 주요 큐레이션 지역
export const AREAS = [
  "성수", "을지로", "익선동", "연남동", "망원동",
  "한남동", "이태원", "압구정", "삼청동", "서촌",
  "북촌", "종로", "홍대", "합정", "연희동",
  "서래마을", "가로수길", "강남", "잠실", "여의도",
] as const;

export type Area = (typeof AREAS)[number];

// Spot 카테고리 라벨
export const SPOT_CATEGORIES: Record<SpotCategory, string> = {
  CAFE: "카페",
  RESTAURANT: "레스토랑",
  BAR: "바/펍",
  NATURE: "자연",
  CULTURE: "문화",
  EXHIBITION: "전시",
  WALK: "산책",
  ACTIVITY: "액티비티",
  SHOPPING: "쇼핑",
  OTHER: "기타",
};

// Route 테마 라벨
export const ROUTE_THEMES: Record<RouteTheme, string> = {
  DATE: "데이트",
  TRAVEL: "여행",
  WALK: "산책",
  HANGOUT: "놀기",
  FOOD_TOUR: "맛집 투어",
  CAFE_TOUR: "카페 투어",
  CULTURE: "문화",
};

// Place 카테고리 → SpotCategory 매핑
const CATEGORY_MAP: Record<string, SpotCategory> = {
  // 카카오 카테고리 키워드
  카페: "CAFE",
  커피: "CAFE",
  베이커리: "CAFE",
  디저트: "CAFE",
  음식점: "RESTAURANT",
  한식: "RESTAURANT",
  일식: "RESTAURANT",
  중식: "RESTAURANT",
  양식: "RESTAURANT",
  분식: "RESTAURANT",
  패스트푸드: "RESTAURANT",
  술집: "BAR",
  호프: "BAR",
  바: "BAR",
  와인: "BAR",
  칵테일: "BAR",
  공원: "NATURE",
  자연: "NATURE",
  산: "NATURE",
  관광: "CULTURE",
  문화: "CULTURE",
  박물관: "CULTURE",
  미술관: "EXHIBITION",
  갤러리: "EXHIBITION",
  전시: "EXHIBITION",
  산책: "WALK",
  걷기: "WALK",
  레저: "ACTIVITY",
  스포츠: "ACTIVITY",
  쇼핑: "SHOPPING",
  백화점: "SHOPPING",
  시장: "SHOPPING",
};

export function mapPlaceCategoryToSpotCategory(placeCategory: string | null): SpotCategory {
  if (!placeCategory) return "OTHER";
  const lower = placeCategory.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "OTHER";
}

// 주소에서 지역(area) 자동 추출
export function extractAreaFromAddress(address: string): string {
  for (const area of AREAS) {
    if (address.includes(area)) return area;
  }
  // 동 이름 기반 매핑
  const dongMap: Record<string, string> = {
    "성수동": "성수",
    "을지로": "을지로",
    "익선동": "익선동",
    "연남동": "연남동",
    "망원동": "망원동",
    "한남동": "한남동",
    "이태원동": "이태원",
    "압구정동": "압구정",
    "삼청동": "삼청동",
    "홍익동": "홍대",
    "서교동": "홍대",
    "합정동": "합정",
    "연희동": "연희동",
    "반포동": "서래마을",
    "신사동": "가로수길",
    "역삼동": "강남",
    "잠실동": "잠실",
    "여의도동": "여의도",
  };
  for (const [dong, area] of Object.entries(dongMap)) {
    if (address.includes(dong)) return area;
  }
  return "";
}
