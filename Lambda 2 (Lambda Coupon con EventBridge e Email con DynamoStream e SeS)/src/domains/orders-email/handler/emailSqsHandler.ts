import type { SQSEvent } from "aws-lambda";
import { readOrderEmailMessages } from "../sqsOrderEmail/sqsService";
import { sendOrderMail } from "../services/sendOrderMail";

export const handler = async (event: SQSEvent) => {
  try {
    const messages = readOrderEmailMessages(event);

    for (const message of messages) {
      await sendOrderMail(message);
    }

    return {
      body: JSON.stringify({
        message: "Email ordini da SQS inviate",
        processed: messages.length,
      }),
    };
  } catch (error) {
    console.error("Errore nel handler SQS email", error);
    throw error; 
  }
};
