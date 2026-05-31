import {
  JOB_ORIGIN_LAT,
  JOB_ORIGIN_LNG,
} from "@/lib/jobs/constants";

const EARTH_RADIUS_MILES = 3958.8;

export function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceFromOriginMiles(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): number | null {
  if (latitude == null || longitude == null) return null;
  return milesBetween(JOB_ORIGIN_LAT, JOB_ORIGIN_LNG, latitude, longitude);
}

export function formatDistanceMiles(miles: number): string {
  if (miles < 1) return "< 1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export type JobWithCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

export function isWithinRadius<T extends JobWithCoordinates>(
  job: T,
  maxRadiusMiles: number,
): boolean {
  const distance = distanceFromOriginMiles(job.latitude, job.longitude);
  if (distance == null) return true;
  return distance <= maxRadiusMiles;
}

export function sortByDistance<T extends JobWithCoordinates>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const distanceA = distanceFromOriginMiles(a.latitude, a.longitude);
    const distanceB = distanceFromOriginMiles(b.latitude, b.longitude);

    if (distanceA == null && distanceB == null) return 0;
    if (distanceA == null) return 1;
    if (distanceB == null) return -1;
    return distanceA - distanceB;
  });
}
