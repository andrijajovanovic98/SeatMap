"use client";

import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { TranslationKey } from "@/lib/translations";
import { FloorElementType, TableShape } from "@/types/seating";
import {
  Circle,
  DoorOpen,
  Martini,
  Music,
  RectangleHorizontal,
  Type,
  Users,
} from "lucide-react";

type ToolItem =
  | { kind: "table"; shape: TableShape; labelKey: TranslationKey; icon: React.ReactNode }
  | { kind: "floorElement"; elementType: FloorElementType; labelKey: TranslationKey; icon: React.ReactNode };

const TOOLS: ToolItem[] = [
  { kind: "table", shape: "circle", labelKey: "table.circle", icon: <Circle className="h-5 w-5" /> },
  {
    kind: "table",
    shape: "rectangle",
    labelKey: "table.rectangle",
    icon: <RectangleHorizontal className="h-5 w-5" />,
  },
  {
    kind: "table",
    shape: "long",
    labelKey: "table.long",
    icon: <RectangleHorizontal className="h-5 w-5 rotate-90" />,
  },
  { kind: "floorElement", elementType: "danceFloor", labelKey: "floor.danceFloor", icon: <Music className="h-5 w-5" /> },
  { kind: "floorElement", elementType: "stage", labelKey: "floor.stage", icon: <Users className="h-5 w-5" /> },
  { kind: "floorElement", elementType: "bar", labelKey: "floor.bar", icon: <Martini className="h-5 w-5" /> },
  { kind: "floorElement", elementType: "entrance", labelKey: "floor.entrance", icon: <DoorOpen className="h-5 w-5" /> },
  { kind: "floorElement", elementType: "text", labelKey: "floor.textLabel", icon: <Type className="h-5 w-5" /> },
];

export function EditorSidebar({ onItemAdded }: { onItemAdded?: () => void }) {
  const { dispatch } = usePlan();
  const { t } = useLanguage();

  const handleAdd = (tool: ToolItem) => {
    if (tool.kind === "table") {
      dispatch({ type: "ADD_TABLE", shape: tool.shape });
    } else {
      dispatch({ type: "ADD_FLOOR_ELEMENT", elementType: tool.elementType });
    }
    onItemAdded?.();
  };

  const handleDragStart = (e: React.DragEvent, tool: ToolItem) => {
    e.dataTransfer.setData("application/x-seatflow-tool", JSON.stringify(tool));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="flex h-full w-full flex-col gap-1 overflow-y-auto bg-white p-3 lg:w-56 lg:border-r lg:border-gray-200">
      <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t("sidebar.elements")}
      </h2>
      {TOOLS.map((tool) => (
        <button
          key={tool.labelKey}
          draggable
          onDragStart={(e) => handleDragStart(e, tool)}
          onClick={() => handleAdd(tool)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
        >
          <span className="text-gray-500">{tool.icon}</span>
          {t(tool.labelKey)}
        </button>
      ))}
      <p className="mt-2 px-1 text-xs text-gray-400">{t("sidebar.instructions")}</p>
    </aside>
  );
}

export type { ToolItem };
