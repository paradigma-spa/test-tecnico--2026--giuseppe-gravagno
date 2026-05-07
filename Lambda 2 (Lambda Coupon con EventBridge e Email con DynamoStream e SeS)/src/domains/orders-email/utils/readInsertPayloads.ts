import type { DynamoDBStreamEvent } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { OrderInsertPayload } from "../types/OrderInsertPayload";

//Funzione che controlla il tipo di streams e prende i dati trasformandoli co unmarshall
export const readInsertPayloads = (
  event: DynamoDBStreamEvent,
): OrderInsertPayload[] => {
  return event.Records.filter((record) => record.eventName === "INSERT")
    .map((record) => {
      const image = record.dynamodb?.NewImage;
      if (!image) return null;

      return unmarshall(image as Record<string, never>) as OrderInsertPayload;
    })
    .filter((item): item is OrderInsertPayload => item !== null);
};
