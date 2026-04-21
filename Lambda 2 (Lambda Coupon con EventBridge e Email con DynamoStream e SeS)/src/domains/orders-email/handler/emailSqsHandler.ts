import type { SQSEvent } from "aws-lambda";
import { readOrderEmailMessages } from "../sqsOrderEmail/sqsService";
import { sendOrderMail } from "../services/sendOrderMail";

export const handler = async (event: SQSEvent) => {
  const messages = readOrderEmailMessages(event);

  for (const message of messages) {
    await sendOrderMail(message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Email ordini da SQS inviate",
      processed: messages.length,
    }),
  };
};
