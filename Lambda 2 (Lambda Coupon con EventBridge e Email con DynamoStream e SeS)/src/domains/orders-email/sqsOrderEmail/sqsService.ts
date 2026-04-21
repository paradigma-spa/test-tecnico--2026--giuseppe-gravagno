import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { SQSEvent } from "aws-lambda";
import type { OrderEmailMessage } from "../types/OrderEmailMessage";

export const readOrderEmailMessages = (
  event: SQSEvent,
): OrderEmailMessage[] => {
  const messages: OrderEmailMessage[] = [];

  for (const record of event.Records) {
    try {
      const parsed = JSON.parse(record.body) as OrderEmailMessage;
      messages.push(parsed);
    } catch (error) {
      console.error("Errore nel parsing del messaggio SQS mail", {
        messageId: record.messageId,
        error,
      });
    }
  }

  return messages;
};
