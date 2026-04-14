import { useQuery, useQueryClient } from "@tanstack/react-query";
import { spotAPI } from "../services/v2/spotAPI";

interface SpotSummary {
  slug: string;
  title: string;
}

interface RegisteredPlaceIds {
  naver: Set<string>;
  kakao: Set<string>;
  spotMap: Map<string, SpotSummary>;
}

export const REGISTERED_PLACE_IDS_KEY = ["registeredPlaceIds"];

export function useRegisteredPlaceIds() {
  const query = useQuery<RegisteredPlaceIds>({
    queryKey: REGISTERED_PLACE_IDS_KEY,
    queryFn: async () => {
      const res = await spotAPI.getList({ size: 1000 });
      const spots = res.data.content;

      const naver = new Set<string>();
      const kakao = new Set<string>();
      const spotMap = new Map<string, SpotSummary>();

      for (const s of spots) {
        const summary = { slug: s.slug, title: s.title };
        if (s.naverPlaceId) {
          naver.add(s.naverPlaceId);
          spotMap.set(`naver-${s.naverPlaceId}`, summary);
        }
        if (s.kakaoPlaceId) {
          kakao.add(s.kakaoPlaceId);
          spotMap.set(`kakao-${s.kakaoPlaceId}`, summary);
        }
      }

      return { naver, kakao, spotMap };
    },
    staleTime: 5 * 60 * 1000,
  });

  const isRegistered = (provider: "naver" | "kakao", placeId: string): boolean => {
    if (!query.data) return false;
    return provider === "naver"
      ? query.data.naver.has(placeId)
      : query.data.kakao.has(placeId);
  };

  const getRegisteredSpot = (provider: "naver" | "kakao", placeId: string): SpotSummary | undefined => {
    return query.data?.spotMap.get(`${provider}-${placeId}`);
  };

  return { ...query, isRegistered, getRegisteredSpot };
}

export function useInvalidateRegisteredPlaceIds() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: REGISTERED_PLACE_IDS_KEY });
}
