import type { RouteSpotItem } from "../components/curation/RouteSpotList";

const R = 6371000; // Earth radius in meters

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance between two coordinates in meters */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estimate walking minutes from distance (default 80m/min ≈ 4.8km/h) */
export function estimateWalkingMinutes(
  distanceMeters: number,
  speedMPerMin = 80,
): number {
  return Math.round(distanceMeters / speedMPerMin);
}

/** Calculate distances and walking times for a list of route spots */
export function calculateRouteDistances(
  items: RouteSpotItem[],
): { distanceToNext: number | null; walkingTimeToNext: number | null }[] {
  return items.map((item, i) => {
    if (i >= items.length - 1) {
      return { distanceToNext: null, walkingTimeToNext: null };
    }
    const next = items[i + 1];
    const lat1 = item.spot.latitude;
    const lng1 = item.spot.longitude;
    const lat2 = next!.spot.latitude;
    const lng2 = next!.spot.longitude;

    // Skip if coordinates are missing (0,0)
    if ((lat1 === 0 && lng1 === 0) || (lat2 === 0 && lng2 === 0)) {
      return { distanceToNext: null, walkingTimeToNext: null };
    }

    const dist = Math.round(haversineDistance(lat1, lng1, lat2, lng2));
    return {
      distanceToNext: dist,
      walkingTimeToNext: estimateWalkingMinutes(dist),
    };
  });
}
