import type { DynamoDBStreamEvent } from "aws-lambda";
import { readModifyPayloads } from "../utils/readModifyPayloads";
import { Discount } from "../../../models/discountModel";
import { couponModifyPayload } from "../types/couponModifyPayload";

export const applyCouponStateChangeService = async (
  event: DynamoDBStreamEvent,
): Promise<couponModifyPayload[]> => {
  const payloads = readModifyPayloads(event);

  const modifyPayloads = payloads.map(async (item) => {
    const shouldDisable =
      item.oldItem.usageCount > 0 &&
      item.newItem.usageCount === 0 &&
      item.newItem.enabled === true;

    if (!shouldDisable) return null;

    await Discount.update(
      { enabled: false },
      {where: {id: item.newItem.couponId ,userId: item.newItem.userId} }
    );

    return {
      ...item.newItem,
      enabled: false,
    };
  });

  const results = await Promise.all(modifyPayloads);
  return results.filter((item): item is couponModifyPayload => item !== null);
};