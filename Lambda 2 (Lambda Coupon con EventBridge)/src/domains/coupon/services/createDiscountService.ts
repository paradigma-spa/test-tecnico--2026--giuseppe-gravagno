import { randomUUID } from "crypto";
import { DiscountDynamo } from "../../../models/discountModel";
import { EventPayload } from "../types/eventPayload";

type DiscountInput = {
  userId: string;
  coupon: string;
  couponValue: number;
  usageCount: number;
  enabled: boolean;
  expiresAt: number | undefined;
};

const parseEventPayload = (payload: EventPayload): DiscountInput => {
  const userId = String(payload.userId ?? "").trim();
  const coupon = String(payload.coupon ?? "").trim();
  const couponValue = Number(payload.couponValue);
  const usageCount =
    payload.usageCount === undefined ? 1 : Number(payload.usageCount);
  const enabled =
    payload.enabled === undefined ? true : Boolean(payload.enabled);

  if (!userId) throw new Error("userId mancante nell'evento");
  if (!coupon) throw new Error("coupon mancante nell'evento");
  if (!Number.isFinite(couponValue) || couponValue <= 0) {
    throw new Error("couponValue non valido");
  }
  if (!Number.isFinite(usageCount) || usageCount < 1) {
    throw new Error("usageCount non valido");
  }

  const expiresAtRaw = payload.expiresAt;
  let expiresAt: number | undefined;

  if (
    expiresAtRaw === undefined ||
    expiresAtRaw === null ||
    expiresAtRaw === ""
  ) {
    expiresAt = undefined;
  } else if (typeof expiresAtRaw === "number") {
    expiresAt =
      expiresAtRaw > 1e12
        ? Math.floor(expiresAtRaw / 1000)
        : Math.floor(expiresAtRaw);
  } else {
    const parsed = Date.parse(String(expiresAtRaw));
    if (Number.isNaN(parsed)) {
      throw new Error("Formato expiresAt non valido");
    }
    expiresAt = Math.floor(parsed / 1000);
  }

  return {
    userId,
    coupon,
    couponValue,
    usageCount,
    enabled,
    expiresAt,
  };
};

export const createDiscountFromPayload = async (payload: EventPayload) => {
  const data = parseEventPayload(payload);

  const newDiscount = new DiscountDynamo({
    userId: data.userId,
    couponId: randomUUID(),
    coupon: data.coupon,
    couponValue: data.couponValue,
    usageCount: data.usageCount,
    enabled: data.enabled,
    expiresAt: data.expiresAt,
  });

  await newDiscount.save();

  return newDiscount;
};
