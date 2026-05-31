"use client";

import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import {
  JOB_ORIGIN_LAT,
  JOB_ORIGIN_LNG,
  JOB_SEARCH_ZIP,
} from "@/lib/jobs/constants";
import {
  distanceFromOriginMiles,
  formatDistanceMiles,
} from "@/lib/jobs/distance";

import "leaflet/dist/leaflet.css";

export type JobMapPoint = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
};

const originIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#047857;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const jobIcon = L.divIcon({
  className: "",
  html: `<div style="width:10px;height:10px;border-radius:9999px;background:#059669;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export function JobsMap({
  jobs,
  radiusMiles,
}: {
  jobs: JobMapPoint[];
  radiusMiles: number;
}) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
  }, []);

  const plottedJobs = useMemo(
    () =>
      jobs.filter(
        (job): job is JobMapPoint & { latitude: number; longitude: number } =>
          job.latitude != null && job.longitude != null,
      ),
    [jobs],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
      <MapContainer
        center={[JOB_ORIGIN_LAT, JOB_ORIGIN_LNG]}
        zoom={11}
        scrollWheelZoom={false}
        className="z-0 h-64 w-full md:h-80"
        aria-label={`Map of job listings near zip ${JOB_SEARCH_ZIP}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[JOB_ORIGIN_LAT, JOB_ORIGIN_LNG]} icon={originIcon}>
          <Popup>
            <strong>Zip {JOB_SEARCH_ZIP}</strong>
            <br />
            West Side St. Paul search center
          </Popup>
        </Marker>

        <Circle
          center={[JOB_ORIGIN_LAT, JOB_ORIGIN_LNG]}
          radius={radiusMiles * 1609.34}
          pathOptions={{
            color: "#047857",
            fillColor: "#059669",
            fillOpacity: 0.12,
            weight: 2,
          }}
        />

        {plottedJobs.map((job) => {
          const distance = distanceFromOriginMiles(job.latitude, job.longitude);
          return (
            <Marker
              key={job.id}
              position={[job.latitude, job.longitude]}
              icon={jobIcon}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{job.title}</p>
                  <p>{job.company}</p>
                  <p className="text-stone-600">{job.location}</p>
                  {distance != null && (
                    <p className="text-emerald-800">
                      {formatDistanceMiles(distance)} from {JOB_SEARCH_ZIP}
                    </p>
                  )}
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-800 underline"
                  >
                    View listing
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
