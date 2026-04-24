import app from "./app";
import dotenv from "dotenv";
import serverless from "serverless-http";
import { updateOrderStatus } from "./services/orderStatusService";

dotenv.config({});

const httpHandler = serverless(app);

const isEventBridgeEvent = (event: unknown): boolean => {
  return (
    !!event &&
    typeof event === "object" &&
    "source" in event
  );
};

export const handler = async (event: unknown, context: unknown) => {
  if (isEventBridgeEvent(event)) {
    await updateOrderStatus();
    return { body: JSON.stringify({ message: "Order status updated" }) };
  }

  return (httpHandler as any)(event, context);
};