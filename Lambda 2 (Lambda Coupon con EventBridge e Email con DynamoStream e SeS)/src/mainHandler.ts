import { couponStateHandler } from "./domains/coupon-state/handler/couponStateHandler";
import { handler as couponHandler } from "./domains/coupon/handlers/couponEventBridgeHandler";
import { handler as updateOrderStatusHandler } from "./domains/update-status-order/handler/updateOrderStatusHandler";
import { handler as emailSqsHandler } from "./domains/orders-email/handler/emailSqsHandler";
import type { SQSEvent } from "aws-lambda";
import { viewOrderStatusService } from "./domains/update-status-order/services/viewOrderStatusService";
import { summaryUserHandler } from "./domains/summaryuser/handler/summaryUserHandler";
import type { StateMessage } from "./domains/coupon-state/types/couponStateCheckMessage";

const isSqsEvent = (event: unknown): event is SQSEvent => {
  if (!event || typeof event !== "object" || !("Records" in event)) {
    return false;
  }

  const records = (event as SQSEvent).Records;
  return (
    Array.isArray(records) &&
    records.length > 0 &&
    !!records[0] &&
    "body" in records[0]
  );
};

const isScheduledEvent = (event: unknown): boolean => {
  return (
    !!event &&
    typeof event === "object" &&
    "source" in event &&
    (event as any).source === "aws.events"
  );
};

const isGetOrderStatusEvent = (
  event: unknown,
): event is { action: string; orderId: string } => {
  return (
    !!event &&
    typeof event === "object" &&
    "action" in event &&
    (event as any).action === "get-order-status" &&
    "orderId" in event
  );
};

const isGetSummaryUserEvent = (
  event: unknown,
): event is { action: string; userId: string } => {
  return (
    !!event &&
    typeof event === "object" &&
    "action" in event &&
    (event as any).action === "get-summary-user" &&
    "userId" in event
  );
};

const isCouponStateMessage = (value: unknown): value is StateMessage => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    v.eventType === "coupon-state-check" &&
    typeof v.discountId === "string" &&
    typeof v.userId === "string" &&
    typeof v.usageCountAfterUpdate === "number"
  );
};

const isCouponStateSqsEvent = (event: SQSEvent): boolean => {
  return event.Records.every((record) => {
    try {
      const parsed = JSON.parse(record.body);
      return isCouponStateMessage(parsed);
    } catch {
      return false;
    }
  });
};

export const handler = async (event: unknown) => {
  try {
    if (isScheduledEvent(event)) {
      return updateOrderStatusHandler(event);
    }

    if (isGetOrderStatusEvent(event)) {
      return viewOrderStatusService(event);
    }

    if (isGetSummaryUserEvent(event)) {
      return summaryUserHandler(event);
    }

    if (isSqsEvent(event)) {
      if (isCouponStateSqsEvent(event)) {
        return couponStateHandler(event);
      }
      return emailSqsHandler(event);
    }

    return couponHandler(event);
  } catch (error) {
    console.error("Errore nel handler principale", error);
    return {
      body: JSON.stringify({ message: "Errore interno" }),
    };
  }
};