"use client";

import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";

export type GuestAttributesValue = {
  glutenFree: boolean;
  lactoseFree: boolean;
  vegan: boolean;
  vegetarian: boolean;
  otherAllergy: boolean;
  childAgeId: string;
  highChair: boolean;
};

export const DEFAULT_GUEST_ATTRIBUTES: GuestAttributesValue = {
  glutenFree: false,
  lactoseFree: false,
  vegan: false,
  vegetarian: false,
  otherAllergy: false,
  childAgeId: "",
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
  const { plan } = usePlan();

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
          checked={value.vegan}
          onChange={(vegan) => onChange({ ...value, vegan })}
          label={t("guestAttrs.vegan")}
        />
        <Checkbox
          checked={value.vegetarian}
          onChange={(vegetarian) => onChange({ ...value, vegetarian })}
          label={t("guestAttrs.vegetarian")}
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
          value={value.childAgeId}
          onChange={(e) => onChange({ ...value, childAgeId: e.target.value })}
          className="input"
        >
          <option value="">{t("childAge.none")}</option>
          {plan.childAgeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
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
