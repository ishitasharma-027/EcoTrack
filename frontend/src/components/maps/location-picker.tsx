"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

const MapInner = dynamic(() => import("./location-picker-inner"), { ssr: false, loading: () => (
  <div className="flex h-[300px] items-center justify-center rounded-xl bg-white/5 text-gray-500">Loading map...</div>
)});

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  return <MapInner lat={lat} lng={lng} onChange={onChange} />;
}
