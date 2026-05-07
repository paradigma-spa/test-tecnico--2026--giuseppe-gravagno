export type DiscountInput = {
  userId: string;
  coupon: string;
  couponValue: number;
  usageCount: number;
  enabled: boolean;
  expiresAt: number | undefined;
};

export type EventPayload = Partial<DiscountInput>;