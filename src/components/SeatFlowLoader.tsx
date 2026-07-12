"use client";

import dynamic from "next/dynamic";

const SeatFlowRoot = dynamic(() => import("@/components/SeatFlowRoot"), { ssr: false });

export function SeatFlowLoader() {
  return <SeatFlowRoot />;
}
