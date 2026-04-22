import type { DynamoDBStreamEvent } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { couponModifyPayload } from "../types/couponModifyPayload";

type ModifyPair = {
  oldItem: couponModifyPayload;
  newItem: couponModifyPayload;
};

export const readModifyPayloads = (
  event: DynamoDBStreamEvent,
): ModifyPair[] => {
  return event.Records.filter((record) => record.eventName === "MODIFY")
    .map((record) => {
      const newImage = record.dynamodb?.NewImage;
      const oldImage = record.dynamodb?.OldImage;
      if (!newImage || !oldImage) return null;

      return {
        oldItem: unmarshall(
          oldImage as Record<string, never>,
        ) as couponModifyPayload,
        newItem: unmarshall(
          newImage as Record<string, never>,
        ) as couponModifyPayload,
      };
    })
    .filter((item): item is ModifyPair => item !== null);
};