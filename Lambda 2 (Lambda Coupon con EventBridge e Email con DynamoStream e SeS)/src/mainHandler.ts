import { handler as couponHandler } from "./domains/coupon/handlers/couponEventBridgeHandler";
import { handler as emailStreamsHandler } from "./domains/orders-email/handler/emailStreamsHandler";

const isDynamoStreamEvent = (event: unknown): boolean => {
  return !!event && typeof event === "object" && "Records" in event;
};

export const handler = async (event: unknown) => {
  if (isDynamoStreamEvent(event)) {
    return emailStreamsHandler(event as any);
  }

  return couponHandler(event);
};
