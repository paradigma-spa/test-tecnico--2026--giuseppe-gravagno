import { DynamoDBStreamEvent } from "aws-lambda";
import { applyCouponStateChangeService } from "../services/applyCouponStateChangeService";

export const couponStateHandler = async (event: DynamoDBStreamEvent) => {
  const updatedCoupons = await applyCouponStateChangeService(event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Coupon state aggiornato",
      processed: updatedCoupons.length,
    }),
  };
};
