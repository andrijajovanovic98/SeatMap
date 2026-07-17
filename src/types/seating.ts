import { TranslationKey } from "@/lib/translations";

export type TableShape = "circle" | "rectangle" | "long" | "longOneSided";

export type FloorElementType =
  | "danceFloor"
  | "stage"
  | "bar"
  | "entrance"
  | "text"
  | "buffet"
  | "band"
  | "kidsCorner"
  | "window"
  | "wc";

export type ChildAgeCategory = {
  id: string;
  label: string;
};

export type Guest = {
  id: string;
  name: string;
  note?: string;
  seatId?: string;
  glutenFree?: boolean;
  lactoseFree?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  otherAllergy?: boolean;
  childAgeId?: string;
  highChair?: boolean;
};

export type Seat = {
  id: string;
  tableId: string;
  seatNumber: number;
  guestId?: string;
};

export type TableItem = {
  id: string;
  kind: "table";
  name: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity: number;
  color: string;
  seats: Seat[];
};

export type FloorElementItem = {
  id: string;
  kind: "floorElement";
  type: FloorElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
};

export type CanvasItem = TableItem | FloorElementItem;

export type RoomSize = {
  width: number;
  height: number;
};

export type SeatingPlan = {
  id: string;
  eventName: string;
  room: RoomSize;
  tables: TableItem[];
  floorElements: FloorElementItem[];
  guests: Guest[];
  childAgeCategories: ChildAgeCategory[];
  updatedAt: string;
};

/** Lightweight metadata for the events index (drives the event switcher list). */
export type EventMeta = {
  id: string;
  eventName: string;
  updatedAt: string;
  shareId?: string;
};

/** A free-text comment/note attached to an event. */
export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  seen: boolean;
};

/**
 * The whole account, stored server-side (Upstash Redis) under a fixed key.
 * The server is the source of truth; localStorage is a cache mirror of this.
 */
export type AccountData = {
  version: 1;
  activeEventId: string | null;
  events: SeatingPlan[];
  comments: Record<string, Comment[]>; // eventId -> comments
  updatedAt: string;
};

export const DEFAULT_ROOM_SIZE: RoomSize = { width: 1600, height: 1000 };

/** Seed child-age categories for a fresh plan (labels are free text and user-editable). */
export function createDefaultChildAgeCategories(): ChildAgeCategory[] {
  return [
    { id: "child-age-0-3", label: "0-3" },
    { id: "child-age-3-12", label: "3-12" },
  ];
}

export const DEFAULT_CAPACITY: Record<TableShape, number> = {
  circle: 8,
  rectangle: 6,
  long: 12,
  longOneSided: 6,
};

export const DEFAULT_TABLE_SIZE: Record<TableShape, { width: number; height: number }> = {
  circle: { width: 140, height: 140 },
  rectangle: { width: 160, height: 100 },
  long: { width: 260, height: 90 },
  longOneSided: { width: 260, height: 90 },
};

export const DEFAULT_FLOOR_ELEMENT_SIZE: Record<FloorElementType, { width: number; height: number }> = {
  danceFloor: { width: 260, height: 200 },
  stage: { width: 240, height: 140 },
  bar: { width: 180, height: 80 },
  entrance: { width: 100, height: 60 },
  text: { width: 160, height: 50 },
  buffet: { width: 220, height: 80 },
  band: { width: 200, height: 140 },
  kidsCorner: { width: 180, height: 180 },
  window: { width: 120, height: 24 },
  wc: { width: 100, height: 80 },
};

export const FLOOR_ELEMENT_DEFAULT_COLOR: Record<FloorElementType, string> = {
  danceFloor: "#a1a1aa",
  stage: "#a1a1aa",
  bar: "#a1a1aa",
  entrance: "#a1a1aa",
  text: "#1f2937",
  buffet: "#f59e0b",
  band: "#8b5cf6",
  kidsCorner: "#ec4899",
  window: "#38bdf8",
  wc: "#14b8a6",
};

export const FLOOR_ELEMENT_LABEL_KEYS: Record<FloorElementType, TranslationKey> = {
  danceFloor: "floor.danceFloor",
  stage: "floor.stage",
  bar: "floor.bar",
  entrance: "floor.entrance",
  text: "floor.text",
  buffet: "floor.buffet",
  band: "floor.band",
  kidsCorner: "floor.kidsCorner",
  window: "floor.window",
  wc: "floor.wc",
};

export const TABLE_SHAPE_LABEL_KEYS: Record<TableShape, TranslationKey> = {
  circle: "table.circle",
  rectangle: "table.rectangle",
  long: "table.long",
  longOneSided: "table.longOneSided",
};
