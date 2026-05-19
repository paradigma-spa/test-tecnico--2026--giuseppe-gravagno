import type { SQSEvent } from "aws-lambda";
import { readModifyPayloads } from "../utils/readModifyPayloads";
import { Discount } from "../../../models/discountModel";
import { StateMessage } from "../types/couponStateCheckMessage";

export const applyCouponStateChangeService = async (
  event: SQSEvent,
): Promise<StateMessage[]> => {
  const payloads = readModifyPayloads(event);

  const modifyPayloads = payloads.map(async (item) => {
    const shouldDisable = item.usageCountAfterUpdate === 0

    if (!shouldDisable) return null;

    await Discount.update(
      { enabled: false },
      {where: {id: item.discountId ,userId: item.userId} }
    );

    return {
      ...item,
    };
  });

  const results = await Promise.all(modifyPayloads);
  return results.filter((item): item is StateMessage => item !== null);
};