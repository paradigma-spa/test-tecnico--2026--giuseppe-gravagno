import type { SQSEvent } from "aws-lambda";
import { StateMessage } from "../types/couponStateCheckMessage";

export const readModifyPayloads = (
  event: SQSEvent,
): StateMessage[] => {
  const payloads: StateMessage[] = [];

  for (const record of event.Records) {
    try {
      const parsed = JSON.parse(record.body) as StateMessage;
      payloads.push(parsed);
    } catch (error) {
      console.error("Errore parsing messaggio SQS coupon-state", {
        messageId: record.messageId,
        error,
      });
    }
  }

  return payloads;
};