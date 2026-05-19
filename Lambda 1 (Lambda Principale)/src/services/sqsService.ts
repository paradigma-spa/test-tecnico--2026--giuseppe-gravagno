import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { OrderEmailMessage } from "../types/orderEmailMessage";
import { StateMessage } from "../types/discountStateMessage";

export const enqueueOrderEmail = async (message: OrderEmailMessage) => {
  try {
    const sqsClient = new SQSClient({
      region: process.env.AWS_REGION || "eu-south-1",
    });

    const queueUrl =
      process.env.ORDER_EMAIL_QUEUE_URL

    const sendMessage = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    });

    await sqsClient.send(sendMessage);
  } catch (error) {
    console.error("Errore di comunicazione con SQS (enqueue mail)", error);
  }
};

export const enqueueCouponStateCheck = async (message: StateMessage) => {
  try {
    const sqsClient = new SQSClient({
      region: process.env.AWS_REGION || "eu-south-1",
    });
    
    const queueUrl = process.env.STATE_MESSAGE_QUEUE_URL

    const sendMessage = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    });

    await sqsClient.send(sendMessage);
  } catch (error) {
    console.error("Errore di comunicazione con SQS (enqueue state)", error);

  }
}
