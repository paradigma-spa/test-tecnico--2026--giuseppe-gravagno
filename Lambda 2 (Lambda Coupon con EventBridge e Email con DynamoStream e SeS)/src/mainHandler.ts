import { couponStateHandler } from "./domains/coupon-state/handler/couponStateHandler";
import { handler as couponHandler } from "./domains/coupon/handlers/couponEventBridgeHandler";
import { handler as updateOrderStatusHandler } from "./domains/update-status-order/handler/updateOrderStatusHandler";
//import { handler as emailStreamsHandler } from "./domains/orders-email/handler/emailStreamsHandler";
import { handler as emailSqsHandler } from "./domains/orders-email/handler/emailSqsHandler";
import { DynamoDBRecord, DynamoDBStreamEvent, SQSEvent } from "aws-lambda";
import { viewOrderStatusService } from "./domains/update-status-order/services/viewOrderStatusService";
const isDynamoStreamEvent = (event: unknown): event is DynamoDBStreamEvent => {
  return !!event && typeof event === "object" && "Records" in event;
};

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

/*const isInsertNewImageRecord = (record: DynamoDBRecord): boolean =>
  record.eventName === "INSERT" && !!record.dynamodb?.NewImage;*/

const isModifyOldAndNewRecord = (record: DynamoDBRecord): boolean =>
  record.eventName === "MODIFY" &&
  !!record.dynamodb?.OldImage &&
  !!record.dynamodb?.NewImage;

export const handler = async (event: unknown) => {
  try {
    if (isScheduledEvent(event)) {
      return updateOrderStatusHandler(event);
    }

    if (isGetOrderStatusEvent(event)) {
      return viewOrderStatusService(event);
    }

    if (isSqsEvent(event)) {
      return emailSqsHandler(event);
    }

    if (!isDynamoStreamEvent(event)) {
      return couponHandler(event);
    }

    /*if (event.Records.length > 0 && event.Records.every(isInsertNewImageRecord)) {
    return emailStreamsHandler(event);
  }*/

    if (
      event.Records.length > 0 &&
      event.Records.every(isModifyOldAndNewRecord)
    ) {
      return couponStateHandler(event);
    }

    return {
      body: JSON.stringify({ message: "Stream non gestito", processed: 0 }),
    };
  } catch (error) {
    console.error("Errore nel handler principale", error);

    return {
      body: JSON.stringify({ message: "Errore interno" }),
    };
  }
};

/*
emailStreamsHandler è stato sostituito da emailSqsHandler, che legge i messaggi da una coda SQS invece che direttamente dallo stream di DynamoDB.
*/
