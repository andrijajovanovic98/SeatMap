import { generateId } from "@/lib/id";
import { resizeSeats } from "@/lib/seatLayout";
import {
  CanvasItem,
  DEFAULT_CAPACITY,
  DEFAULT_FLOOR_ELEMENT_SIZE,
  DEFAULT_TABLE_SIZE,
  FLOOR_ELEMENT_DEFAULT_COLOR,
  FloorElementItem,
  FloorElementType,
  Guest,
  SeatingPlan,
  TableItem,
  TableShape,
} from "@/types/seating";

export type PlanAction =
  | { type: "SET_PLAN"; plan: SeatingPlan }
  | { type: "SET_EVENT_NAME"; name: string }
  | { type: "ADD_TABLE"; shape: TableShape; defaultName?: string }
  | { type: "ADD_FLOOR_ELEMENT"; elementType: FloorElementType }
  | { type: "MOVE_ITEM"; id: string; x: number; y: number }
  | { type: "NUDGE_ITEM"; id: string; dx: number; dy: number }
  | { type: "RESIZE_ITEM"; id: string; width: number; height: number }
  | { type: "ROTATE_ITEM"; id: string; rotation: number }
  | { type: "RENAME_ITEM"; id: string; name: string }
  | { type: "RECOLOR_ITEM"; id: string; color: string }
  | { type: "SET_TABLE_CAPACITY"; id: string; capacity: number }
  | { type: "SET_TABLE_SHAPE"; id: string; shape: TableShape }
  | { type: "DELETE_ITEM"; id: string }
  | { type: "DUPLICATE_ITEM"; id: string; copySuffix?: string }
  | { type: "ADD_GUEST"; id?: string; name: string; note?: string }
  | { type: "RENAME_GUEST"; id: string; name: string }
  | { type: "SET_GUEST_NOTE"; id: string; note: string }
  | {
      type: "UPDATE_GUEST_ATTRIBUTES";
      id: string;
      attributes: Partial<
        Pick<
          Guest,
          "glutenFree" | "lactoseFree" | "vegan" | "vegetarian" | "otherAllergy" | "childAgeId" | "highChair"
        >
      >;
    }
  | { type: "DELETE_GUEST"; id: string }
  | { type: "ASSIGN_GUEST_TO_SEAT"; guestId: string; seatId: string }
  | { type: "UNASSIGN_SEAT"; seatId: string }
  | { type: "SET_ROOM_SIZE"; width: number; height: number }
  | { type: "ADD_CHILD_AGE_CATEGORY"; label?: string }
  | { type: "RENAME_CHILD_AGE_CATEGORY"; id: string; label: string }
  | { type: "DELETE_CHILD_AGE_CATEGORY"; id: string }
  | { type: "RESET_PLAN"; plan: SeatingPlan };

const ROOM_MARGIN = 0;
export const MIN_ROOM_SIZE = { width: 400, height: 300 };

function clampToRoom(
  item: { x: number; y: number; width: number; height: number; rotation?: number },
  room: { width: number; height: number }
) {
  // Use the rotated bounding box so a rotated table can sit flush against a wall.
  const rad = ((item.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const halfW = (item.width * cos + item.height * sin) / 2;
  const halfH = (item.width * sin + item.height * cos) / 2;
  return {
    x: Math.min(Math.max(item.x, halfW + ROOM_MARGIN), room.width - halfW - ROOM_MARGIN),
    y: Math.min(Math.max(item.y, halfH + ROOM_MARGIN), room.height - halfH - ROOM_MARGIN),
  };
}

function findItem(plan: SeatingPlan, id: string): CanvasItem | undefined {
  return plan.tables.find((t) => t.id === id) ?? plan.floorElements.find((f) => f.id === id);
}

function updateTable(plan: SeatingPlan, id: string, fn: (t: TableItem) => TableItem): SeatingPlan {
  const idx = plan.tables.findIndex((t) => t.id === id);
  if (idx === -1) return plan;
  const tables = [...plan.tables];
  tables[idx] = fn(tables[idx]);
  return { ...plan, tables };
}

function updateFloorElement(plan: SeatingPlan, id: string, fn: (f: FloorElementItem) => FloorElementItem): SeatingPlan {
  const idx = plan.floorElements.findIndex((f) => f.id === id);
  if (idx === -1) return plan;
  const floorElements = [...plan.floorElements];
  floorElements[idx] = fn(floorElements[idx]);
  return { ...plan, floorElements };
}

function updateAnyItem(plan: SeatingPlan, id: string, fn: (item: CanvasItem) => CanvasItem): SeatingPlan {
  if (plan.tables.some((t) => t.id === id)) {
    return updateTable(plan, id, (t) => fn(t) as TableItem);
  }
  return updateFloorElement(plan, id, (f) => fn(f) as FloorElementItem);
}

export function planReducer(plan: SeatingPlan, action: PlanAction): SeatingPlan {
  switch (action.type) {
    case "SET_PLAN":
    case "RESET_PLAN":
      return action.plan;

    case "SET_EVENT_NAME":
      return { ...plan, eventName: action.name, updatedAt: new Date().toISOString() };

    case "SET_ROOM_SIZE": {
      const room = {
        width: Math.max(MIN_ROOM_SIZE.width, Math.round(action.width)),
        height: Math.max(MIN_ROOM_SIZE.height, Math.round(action.height)),
      };
      // Re-clamp every item so nothing ends up outside a shrunken room.
      const tables = plan.tables.map((t) => {
        const pos = clampToRoom(t, room);
        return { ...t, x: pos.x, y: pos.y };
      });
      const floorElements = plan.floorElements.map((f) => {
        const pos = clampToRoom(f, room);
        return { ...f, x: pos.x, y: pos.y };
      });
      return { ...plan, room, tables, floorElements, updatedAt: new Date().toISOString() };
    }

    case "ADD_CHILD_AGE_CATEGORY": {
      const category = { id: generateId("child-age"), label: action.label ?? "" };
      return {
        ...plan,
        childAgeCategories: [...plan.childAgeCategories, category],
        updatedAt: new Date().toISOString(),
      };
    }

    case "RENAME_CHILD_AGE_CATEGORY": {
      return {
        ...plan,
        childAgeCategories: plan.childAgeCategories.map((c) =>
          c.id === action.id ? { ...c, label: action.label } : c
        ),
        updatedAt: new Date().toISOString(),
      };
    }

    case "DELETE_CHILD_AGE_CATEGORY": {
      return {
        ...plan,
        childAgeCategories: plan.childAgeCategories.filter((c) => c.id !== action.id),
        guests: plan.guests.map((g) => (g.childAgeId === action.id ? { ...g, childAgeId: undefined } : g)),
        updatedAt: new Date().toISOString(),
      };
    }

    case "ADD_TABLE": {
      const shape = action.shape;
      const size = DEFAULT_TABLE_SIZE[shape];
      const capacity = DEFAULT_CAPACITY[shape];
      const center = clampToRoom(
        { x: plan.room.width / 2, y: plan.room.height / 2, width: size.width, height: size.height },
        plan.room
      );
      const table: TableItem = {
        id: generateId("table"),
        kind: "table",
        name: action.defaultName ?? `Table ${plan.tables.length + 1}`,
        shape,
        x: center.x,
        y: center.y,
        width: size.width,
        height: size.height,
        rotation: 0,
        capacity,
        color: "#6366f1",
        seats: [],
      };
      table.seats = resizeSeats(table, capacity);
      return { ...plan, tables: [...plan.tables, table], updatedAt: new Date().toISOString() };
    }

    case "ADD_FLOOR_ELEMENT": {
      const type = action.elementType;
      const size = DEFAULT_FLOOR_ELEMENT_SIZE[type];
      const center = clampToRoom(
        { x: plan.room.width / 2, y: plan.room.height / 2, width: size.width, height: size.height },
        plan.room
      );
      const element: FloorElementItem = {
        id: generateId("floor"),
        kind: "floorElement",
        type,
        name: "",
        x: center.x,
        y: center.y,
        width: size.width,
        height: size.height,
        rotation: 0,
        color: FLOOR_ELEMENT_DEFAULT_COLOR[type],
      };
      return { ...plan, floorElements: [...plan.floorElements, element], updatedAt: new Date().toISOString() };
    }

    case "MOVE_ITEM": {
      const item = findItem(plan, action.id);
      if (!item) return plan;
      const pos = clampToRoom({ ...item, x: action.x, y: action.y }, plan.room);
      return updateAnyItem(plan, action.id, (it) => ({ ...it, x: pos.x, y: pos.y }));
    }

    case "NUDGE_ITEM": {
      const item = findItem(plan, action.id);
      if (!item) return plan;
      const pos = clampToRoom({ ...item, x: item.x + action.dx, y: item.y + action.dy }, plan.room);
      return updateAnyItem(plan, action.id, (it) => ({ ...it, x: pos.x, y: pos.y }));
    }

    case "RESIZE_ITEM": {
      const item = findItem(plan, action.id);
      if (!item) return plan;
      const width = Math.max(40, action.width);
      const height = Math.max(40, action.height);
      const pos = clampToRoom({ ...item, width, height }, plan.room);
      return updateAnyItem(plan, action.id, (it) => ({ ...it, width, height, x: pos.x, y: pos.y }));
    }

    case "ROTATE_ITEM": {
      const rotation = ((action.rotation % 360) + 360) % 360;
      return updateAnyItem(plan, action.id, (it) => {
        // Re-clamp with the new rotation so a rotated item stays inside the room.
        const pos = clampToRoom({ ...it, rotation }, plan.room);
        return { ...it, rotation, x: pos.x, y: pos.y };
      });
    }

    case "RENAME_ITEM":
      return updateAnyItem(plan, action.id, (it) => ({ ...it, name: action.name }));

    case "RECOLOR_ITEM":
      return updateAnyItem(plan, action.id, (it) => ({ ...it, color: action.color }));

    case "SET_TABLE_SHAPE": {
      return updateTable(plan, action.id, (t) => {
        const size = DEFAULT_TABLE_SIZE[action.shape];
        return { ...t, shape: action.shape, width: size.width, height: size.height };
      });
    }

    case "SET_TABLE_CAPACITY": {
      const table = plan.tables.find((t) => t.id === action.id);
      if (!table) return plan;
      const newCapacity = Math.max(1, action.capacity);
      if (newCapacity < table.capacity) {
        // guests on seats beyond the new capacity get unassigned; caller must warn before dispatching
        const removedSeats = table.seats.slice(newCapacity);
        const removedGuestIds = new Set(removedSeats.map((s) => s.guestId).filter(Boolean));
        const guests = plan.guests.map((g) =>
          removedGuestIds.has(g.id) ? { ...g, seatId: undefined } : g
        );
        return updateTable({ ...plan, guests }, action.id, (t) => ({
          ...t,
          capacity: newCapacity,
          seats: resizeSeats(t, newCapacity),
        }));
      }
      return updateTable(plan, action.id, (t) => ({
        ...t,
        capacity: newCapacity,
        seats: resizeSeats(t, newCapacity),
      }));
    }

    case "DELETE_ITEM": {
      const table = plan.tables.find((t) => t.id === action.id);
      if (table) {
        const seatIds = new Set(table.seats.map((s) => s.id));
        const guests = plan.guests.map((g) => (g.seatId && seatIds.has(g.seatId) ? { ...g, seatId: undefined } : g));
        return {
          ...plan,
          tables: plan.tables.filter((t) => t.id !== action.id),
          guests,
        };
      }
      return { ...plan, floorElements: plan.floorElements.filter((f) => f.id !== action.id) };
    }

    case "DUPLICATE_ITEM": {
      const copySuffix = action.copySuffix ?? "(copy)";
      const table = plan.tables.find((t) => t.id === action.id);
      if (table) {
        const newId = generateId("table");
        const clone: TableItem = {
          ...table,
          id: newId,
          name: `${table.name} ${copySuffix}`,
          x: Math.min(table.x + 30, plan.room.width - table.width / 2),
          y: Math.min(table.y + 30, plan.room.height - table.height / 2),
          seats: [],
        };
        clone.seats = resizeSeats(clone, clone.capacity).map((s) => ({ ...s, guestId: undefined }));
        return { ...plan, tables: [...plan.tables, clone] };
      }
      const element = plan.floorElements.find((f) => f.id === action.id);
      if (element) {
        const clone: FloorElementItem = {
          ...element,
          id: generateId("floor"),
          name: `${element.name} ${copySuffix}`,
          x: Math.min(element.x + 30, plan.room.width - element.width / 2),
          y: Math.min(element.y + 30, plan.room.height - element.height / 2),
        };
        return { ...plan, floorElements: [...plan.floorElements, clone] };
      }
      return plan;
    }

    case "ADD_GUEST": {
      const guest: Guest = { id: action.id ?? generateId("guest"), name: action.name, note: action.note };
      return { ...plan, guests: [...plan.guests, guest] };
    }

    case "RENAME_GUEST":
      return { ...plan, guests: plan.guests.map((g) => (g.id === action.id ? { ...g, name: action.name } : g)) };

    case "SET_GUEST_NOTE":
      return { ...plan, guests: plan.guests.map((g) => (g.id === action.id ? { ...g, note: action.note } : g)) };

    case "UPDATE_GUEST_ATTRIBUTES":
      return {
        ...plan,
        guests: plan.guests.map((g) => (g.id === action.id ? { ...g, ...action.attributes } : g)),
      };

    case "DELETE_GUEST": {
      const guest = plan.guests.find((g) => g.id === action.id);
      const tables = guest?.seatId
        ? plan.tables.map((t) => ({
            ...t,
            seats: t.seats.map((s) => (s.id === guest.seatId ? { ...s, guestId: undefined } : s)),
          }))
        : plan.tables;
      return { ...plan, tables, guests: plan.guests.filter((g) => g.id !== action.id) };
    }

    case "ASSIGN_GUEST_TO_SEAT": {
      const { guestId, seatId } = action;
      // unassign guest from any previous seat, unassign any guest currently on target seat, then assign
      const tables = plan.tables.map((t) => ({
        ...t,
        seats: t.seats.map((s) => {
          if (s.id === seatId) return { ...s, guestId };
          if (s.guestId === guestId) return { ...s, guestId: undefined };
          return s;
        }),
      }));
      const guests = plan.guests.map((g) => {
        if (g.id === guestId) return { ...g, seatId };
        // if another guest previously held the target seat, clear their seatId
        if (g.seatId === seatId && g.id !== guestId) return { ...g, seatId: undefined };
        return g;
      });
      return { ...plan, tables, guests };
    }

    case "UNASSIGN_SEAT": {
      const tables = plan.tables.map((t) => ({
        ...t,
        seats: t.seats.map((s) => (s.id === action.seatId ? { ...s, guestId: undefined } : s)),
      }));
      const guests = plan.guests.map((g) => (g.seatId === action.seatId ? { ...g, seatId: undefined } : g));
      return { ...plan, tables, guests };
    }

    default:
      return plan;
  }
}
