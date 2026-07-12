import { TranslationKey } from "@/lib/translations";

export type TableShape = "circle" | "rectangle" | "long";

export type FloorElementType = "danceFloor" | "stage" | "bar" | "entrance" | "text";

export type ChildAgeCategory = "under3" | "age3to12";

export type Guest = {
  id: string;
  name: string;
  note?: string;
  seatId?: string;
  glutenFree?: boolean;
  lactoseFree?: boolean;
  otherAllergy?: boolean;
  childAge?: ChildAgeCategory;
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
  eventName: string;
  room: RoomSize;
  tables: TableItem[];
  floorElements: FloorElementItem[];
  guests: Guest[];
  updatedAt: string;
};

export const DEFAULT_ROOM_SIZE: RoomSize = { width: 1600, height: 1000 };

export const DEFAULT_CAPACITY: Record<TableShape, number> = {
  circle: 8,
  rectangle: 6,
  long: 12,
};

export const DEFAULT_TABLE_SIZE: Record<TableShape, { width: number; height: number }> = {
  circle: { width: 140, height: 140 },
  rectangle: { width: 160, height: 100 },
  long: { width: 260, height: 90 },
};

export const DEFAULT_FLOOR_ELEMENT_SIZE: Record<FloorElementType, { width: number; height: number }> = {
  danceFloor: { width: 260, height: 200 },
  stage: { width: 240, height: 140 },
  bar: { width: 180, height: 80 },
  entrance: { width: 100, height: 60 },
  text: { width: 160, height: 50 },
};

export const FLOOR_ELEMENT_LABEL_KEYS: Record<FloorElementType, TranslationKey> = {
  danceFloor: "floor.danceFloor",
  stage: "floor.stage",
  bar: "floor.bar",
  entrance: "floor.entrance",
  text: "floor.text",
};

export const TABLE_SHAPE_LABEL_KEYS: Record<TableShape, TranslationKey> = {
  circle: "table.circle",
  rectangle: "table.rectangle",
  long: "table.long",
};

export const CHILD_AGE_LABEL_KEYS: Record<ChildAgeCategory, TranslationKey> = {
  under3: "childAge.under3",
  age3to12: "childAge.age3to12",
};
