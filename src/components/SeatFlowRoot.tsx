"use client";

import { SeatFlowApp } from "@/components/SeatFlowApp";
import { CommentProvider } from "@/context/CommentContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { PlanProvider } from "@/context/PlanContext";

export default function SeatFlowRoot() {
  return (
    <LanguageProvider>
      <PlanProvider>
        <CommentProvider>
          <SeatFlowApp />
        </CommentProvider>
      </PlanProvider>
    </LanguageProvider>
  );
}
