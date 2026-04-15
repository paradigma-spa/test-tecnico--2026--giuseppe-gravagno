import { couponStateHandler } from "./domains/coupon-state/handler/couponStateHandler";
import { handler as couponHandler } from "./domains/coupon/handlers/couponEventBridgeHandler";
import { handler as emailStreamsHandler } from "./domains/orders-email/handler/emailStreamsHandler";
import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";

const isDynamoStreamEvent = (event: unknown): event is DynamoDBStreamEvent => {
  return !!event && typeof event === "object" && "Records" in event;
};

const isInsertNewImageRecord = (record: DynamoDBRecord): boolean =>
  record.eventName === "INSERT" &&
  !!record.dynamodb?.NewImage;

const isModifyOldAndNewRecord = (record: DynamoDBRecord): boolean =>
  record.eventName === "MODIFY" &&
  !!record.dynamodb?.OldImage &&
  !!record.dynamodb?.NewImage;

export const handler = async (event: unknown) => {
  if (!isDynamoStreamEvent(event)) {
    return couponHandler(event);
  }

  if (event.Records.length > 0 && event.Records.every(isInsertNewImageRecord)) {
    return emailStreamsHandler(event);
  }

  if (event.Records.length > 0 && event.Records.every(isModifyOldAndNewRecord)) {
    return couponStateHandler(event);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Stream non gestito", processed: 0 }),
  };
}
