import { DiscountDynamo } from "../models/discountModel";

type CouponEntity = {
  userId: string;
  couponId: string;
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

  const results = (await DiscountDynamo.scan("userId")
    .eq(userId)
    .exec()) as unknown as CouponEntity[];

  const found = results.find(
    (item) => (item.coupon ?? "").trim().toLowerCase() === normalized,
  );
  if (!found) return null;

  return found;
};

export const decrementCouponUsage = async (
  userId: string,
  couponId: string,
  currentUsageCount: number,
) => {
  await DiscountDynamo.update(
    { userId, couponId },
    { usageCount: currentUsageCount - 1 },
  );
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
