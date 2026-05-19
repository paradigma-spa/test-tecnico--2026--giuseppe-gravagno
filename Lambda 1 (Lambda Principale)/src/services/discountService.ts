import { Discount } from "../models/discountModel";
import { enqueueCouponStateCheck } from "./sqsService";

type CouponEntity = {
  id: string;
  userId: string;
  coupon: string;
  couponValue: number;
  usageCount: number;
  enabled: boolean;
  expiresAt?: number;
};

export const findValidCouponByCode = async (
  userId: string,
  couponCode: string,
) => {
  const normalized = couponCode.trim().toLowerCase();

  const results = await Discount.findOne({
    where: { userId: userId, coupon: normalized },
  });

  if (!results) return null;

  return {
    id: results.get("id"),
    userId: results.get("userId"),
    coupon: results.get("coupon"),
    couponValue: results.get("couponValue"),
    usageCount: results.get("usageCount"),
    enabled: results.get("enabled"),
    expiresAt: results.get("expiresAt"),
  } as CouponEntity;
};

export const decrementCouponUsage = async (
  userId: string,
  id: string,
  currentUsageCount: number,
) => {
  await Discount.update(
    { usageCount: currentUsageCount - 1 },
    { where: { userId, id } },
  );
  if (currentUsageCount === 1) {
    await enqueueCouponStateCheck({
      eventType: "coupon-state-check",
      discountId: id,
      userId: userId,
      usageCountAfterUpdate: 0,
    });
  }
};

export const applyCouponToPrice = async (
  basePrice: number,
  couponValue: number | string,
) => {
  const normalizedBasePrice = Number(basePrice);
  const normalizedCouponValue = Number(couponValue);

  if (!Number.isFinite(normalizedBasePrice) || normalizedBasePrice < 0) {
    throw new Error("Prezzo base non valido");
  }

  if (!Number.isFinite(normalizedCouponValue) || normalizedCouponValue < 0) {
    throw new Error("Valore coupon non valido");
  }

  const discountApplied = Math.min(normalizedBasePrice, normalizedCouponValue);
  const priceFinal = normalizedBasePrice - discountApplied;

  return {
    priceOriginal: normalizedBasePrice,
    discountApplied,
    priceFinal,
  };
};
