import { EventPayload } from "../types/couponEventPayload";

const isObjectPayload = (value: unknown): value is EventPayload => {
  return !!value && typeof value === "object";
};

export const readEventPayload = (event: unknown): EventPayload => {
  if (!isObjectPayload(event)) {
    return {};
  }

  if ("detail" in event) {
    const detail = (event as { detail?: unknown }).detail;
    return isObjectPayload(detail) ? detail : {};
  }

  return event;
};

export const readUserIdFromPayload = (payload: EventPayload): string => {
  return String(payload.userId ?? "").trim();
};
