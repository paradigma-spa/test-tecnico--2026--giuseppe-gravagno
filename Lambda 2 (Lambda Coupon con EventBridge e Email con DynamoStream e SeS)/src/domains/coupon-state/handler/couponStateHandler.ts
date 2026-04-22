import { DynamoDBStreamEvent } from "aws-lambda";
import { applyCouponStateChangeService } from "../services/applyCouponStateChangeService";

export const couponStateHandler = async (event: DynamoDBStreamEvent) => {
  try {
    const updatedCoupons = await applyCouponStateChangeService(event);
    return {
      body: JSON.stringify({
        message: "Coupon state aggiornato",
        processed: updatedCoupons.length,
      }),
    };
  } catch (error) {
    console.error("Errore nel handler coupon state", error);
    throw error;
  }
};
