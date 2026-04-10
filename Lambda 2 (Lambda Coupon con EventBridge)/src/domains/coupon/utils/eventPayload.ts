import { EventPayload } from "../types/eventPayload";

export const readEventPayload = (event: unknown): EventPayload => {
  if (!event || typeof event !== "object") {
    return {};
  }

  if ("detail" in event) {
    const detail = (event as { detail?: unknown }).detail;
    if (detail && typeof detail === "object") {
      return detail as EventPayload;
    }
  }

  return event as EventPayload;
};

export const readUserIdFromPayload = (payload: EventPayload): string => {
  return String(payload.userId ?? "").trim();
};
