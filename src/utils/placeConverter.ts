import type { PlaceInfo, CreateSpotRequest } from "../types/v2";
import { mapPlaceCategoryToSpotCategory, extractAreaFromAddress } from "../constants";

export function placeToSpotRequest(
  place: PlaceInfo,
  crewNote?: string,
  tags?: string[],
): CreateSpotRequest {
  return {
    title: place.name,
    address: place.address,
    latitude: 0,
    longitude: 0,
    area: extractAreaFromAddress(place.address),
    category: mapPlaceCategoryToSpotCategory(place.category),
    source: "CREW",
    crewNote: crewNote || undefined,
    tags: tags || [],
    naverPlaceId: place.provider === "naver" ? place.placeId : undefined,
    kakaoPlaceId: place.provider === "kakao" ? place.placeId : undefined,
  };
}
