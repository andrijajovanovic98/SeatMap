"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ChildAgeCategory } from "@/types/seating";

export type GuestAttributesValue = {
  glutenFree: boolean;
  lactoseFree: boolean;
  otherAllergy: boolean;
  childAge: ChildAgeCategory | "";
  highChair: boolean;
};

export const DEFAULT_GUEST_ATTRIBUTES: GuestAttributesValue = {
  glutenFree: false,
  lactoseFree: false,
  otherAllergy: false,
  childAge: "",
  highChair: false,
};

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
      />
      {label}
    </label>
  );
}

export function GuestAttributesFields({
  value,
  onChange,
}: {
  value: GuestAttributesValue;
  onChange: (next: GuestAttributesValue) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500">{t("guestAttrs.dietaryHeading")}</span>
        <Checkbox
          checked={value.glutenFree}
          onChange={(glutenFree) => onChange({ ...value, glutenFree })}
          label={t("guestAttrs.glutenFree")}
        />
        <Checkbox
          checked={value.lactoseFree}
          onChange={(lactoseFree) => onChange({ ...value, lactoseFree })}
          label={t("guestAttrs.lactoseFree")}
        />
        <Checkbox
          checked={value.otherAllergy}
          onChange={(otherAllergy) => onChange({ ...value, otherAllergy })}
          label={t("guestAttrs.otherAllergy")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500">{t("guestAttrs.childHeading")}</span>
        <select
          value={value.childAge}
          onChange={(e) => onChange({ ...value, childAge: e.target.value as ChildAgeCategory | "" })}
          className="input"
        >
          <option value="">{t("childAge.none")}</option>
          <option value="under3">{t("childAge.under3.short")}</option>
          <option value="age3to12">{t("childAge.age3to12.short")}</option>
        </select>
        <Checkbox
          checked={value.highChair}
          onChange={(highChair) => onChange({ ...value, highChair })}
          label={t("guestAttrs.highChair")}
        />
      </div>
    </div>
  );
}
