import { generateId } from "@/lib/id";
import { resizeSeats } from "@/lib/seatLayout";
import {
  createDefaultChildAgeCategories,
  DEFAULT_CAPACITY,
  DEFAULT_FLOOR_ELEMENT_SIZE,
  DEFAULT_ROOM_SIZE,
  DEFAULT_TABLE_SIZE,
  FloorElementItem,
  Guest,
  SeatingPlan,
  TableItem,
} from "@/types/seating";

function makeTable(
  name: string,
  shape: TableItem["shape"],
  x: number,
  y: number,
  capacity?: number
): TableItem {
  const cap = capacity ?? DEFAULT_CAPACITY[shape];
  const size = DEFAULT_TABLE_SIZE[shape];
  const table: TableItem = {
    id: generateId("table"),
    kind: "table",
    name,
    shape,
    x,
    y,
    width: size.width,
    height: size.height,
    rotation: 0,
    capacity: cap,
    color: "#6366f1",
    seats: [],
  };
  table.seats = resizeSeats(table, cap);
  return table;
}

function makeFloorElement(
  type: FloorElementItem["type"],
  name: string,
  x: number,
  y: number
): FloorElementItem {
  const size = DEFAULT_FLOOR_ELEMENT_SIZE[type];
  return {
    id: generateId("floor"),
    kind: "floorElement",
    type,
    name,
    x,
    y,
    width: size.width,
    height: size.height,
    rotation: 0,
    color: "#a1a1aa",
  };
}

export function createDemoPlan(): SeatingPlan {
  const tables: TableItem[] = [
    makeTable("1. asztal", "circle", 260, 200),
    makeTable("2. asztal", "circle", 520, 200),
    makeTable("3. asztal", "circle", 260, 420),
    makeTable("4. asztal", "circle", 520, 420),
    makeTable("5. asztal (hosszú)", "long", 1000, 220),
    makeTable("6. asztal (hosszú)", "long", 1000, 460),
  ];

  const floorElements: FloorElementItem[] = [
    makeFloorElement("danceFloor", "", 850, 700),
    makeFloorElement("stage", "", 1150, 700),
    makeFloorElement("entrance", "", 60, 700),
  ];

  const childAgeCategories = createDefaultChildAgeCategories();

  const guests: Guest[] = [
    { id: generateId("guest"), name: "Kovács Anna", glutenFree: true },
    { id: generateId("guest"), name: "Nagy Péter", childAgeId: childAgeCategories[1].id },
    { id: generateId("guest"), name: "Szabó Réka", lactoseFree: true },
    { id: generateId("guest"), name: "Tóth Gábor", childAgeId: childAgeCategories[0].id, highChair: true },
    { id: generateId("guest"), name: "Horváth Eszter", otherAllergy: true, note: "mogyoró" },
    { id: generateId("guest"), name: "Varga Bence" },
  ];

  // seat several demo guests so every badge type (dietary dots, child-age icon, high-chair icon) is visible out of the box
  const firstTable = tables[0];
  for (let i = 0; i < 4; i++) {
    if (firstTable.seats[i]) {
      firstTable.seats[i].guestId = guests[i].id;
      guests[i].seatId = firstTable.seats[i].id;
    }
  }

  return {
    id: generateId("event"),
    eventName: "Az én rendezvényem",
    room: DEFAULT_ROOM_SIZE,
    tables,
    floorElements,
    guests,
    childAgeCategories,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * The starting plan for a brand-new user: two empty tables so the canvas is not
 * blank on first login, but no guests to clear out before real work begins.
 */
export function createStarterPlan(eventName: string): SeatingPlan {
  return {
    id: generateId("event"),
    eventName,
    room: DEFAULT_ROOM_SIZE,
    tables: [makeTable("1. asztal", "circle", 260, 200), makeTable("2. asztal", "circle", 520, 200)],
    floorElements: [],
    guests: [],
    childAgeCategories: createDefaultChildAgeCategories(),
    updatedAt: new Date().toISOString(),
  };
}

/** Creates a fresh, empty event: just a default room and no tables/guests yet. */
export function createBlankPlan(eventName: string): SeatingPlan {
  return {
    id: generateId("event"),
    eventName,
    room: DEFAULT_ROOM_SIZE,
    tables: [],
    floorElements: [],
    guests: [],
    childAgeCategories: createDefaultChildAgeCategories(),
    updatedAt: new Date().toISOString(),
  };
}
