"use client";

import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { useMemo } from "react";

export function StatsBar() {
  const { plan } = usePlan();
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const totalSeats = plan.tables.reduce((sum, t) => sum + t.seats.length, 0);
    const occupiedSeats = plan.tables.reduce(
      (sum, t) => sum + t.seats.filter((s) => s.guestId).length,
      0
    );
    const totalGuests = plan.guests.length;
    const seatedGuests = plan.guests.filter((g) => g.seatId).length;
    return {
      totalGuests,
      seatedGuests,
      unseatedGuests: totalGuests - seatedGuests,
      totalSeats,
      freeSeats: totalSeats - occupiedSeats,
    };
  }, [plan]);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
      <span>
        <strong className="font-semibold text-gray-900">{stats.totalGuests}</strong> {t("stats.guests")}
      </span>
      <span className="text-emerald-600">
        <strong className="font-semibold">{stats.seatedGuests}</strong> {t("stats.seated")}
      </span>
      <span className="text-amber-600">
        <strong className="font-semibold">{stats.unseatedGuests}</strong> {t("stats.unseated")}
      </span>
      <span>
        <strong className="font-semibold text-gray-900">{stats.totalSeats}</strong> {t("stats.seats")}
      </span>
      <span>
        <strong className="font-semibold text-gray-900">{stats.freeSeats}</strong> {t("stats.freeSeats")}
      </span>
    </div>
  );
}
