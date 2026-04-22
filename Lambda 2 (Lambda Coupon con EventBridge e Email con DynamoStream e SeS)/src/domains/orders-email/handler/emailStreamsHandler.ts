import type { DynamoDBStreamEvent } from "aws-lambda";
import { readInsertPayloads } from "../utils/readInsertPayloads";
import { sendOrderMail } from "../services/sendOrderMail";

export const handler = async (event: DynamoDBStreamEvent) => {
  try {
  const orders = readInsertPayloads(event);

  for (const order of orders) {
    await sendOrderMail({ payload: order });
  }

  return {
    body: JSON.stringify({
      message: "Email ordini inviate",
      processed: orders.length,
    }),
  };

  } catch (error) {
    console.error("Errore nel handler email stream", error);
    throw error;
};
}

/*
Questo handler veniva usato quando l'invio delle email era triggerato direttamente dallo stream di DynamoDB,
ma è stato sostituito da un'architettura più modulare che prevede l'uso di SQS come buffer tra 
DynamoDB e l'invio delle email.
*/