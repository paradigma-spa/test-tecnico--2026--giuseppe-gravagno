import { type Request, type Response } from "express";
import { DiscountDynamo } from "../models/discountModel";
import { randomUUID } from "crypto";

const parseExpiresAtToEpochSeconds = (expiresAt: unknown) => {
  const parsed = Date.parse(String(expiresAt));
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed / 1000;
};

export const getDiscount = async (req: Request, res: Response) => {
  try {
    const allDiscounts = await DiscountDynamo.scan().exec();
    return res.status(200).json({ allDiscounts });
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { userId, coupon, couponValue, usageCount, enabled, expiresAt } =
      req.body;

    const expiresAtEpochSeconds = parseExpiresAtToEpochSeconds(expiresAt);
    if (expiresAtEpochSeconds === null) {
      return res
        .status(400)
        .json({ message: "Formato data expiresAt non valido" });
    }

    const newDiscount = new DiscountDynamo({
      userId,
      couponId: randomUUID(),
      coupon,
      couponValue,
      usageCount,
      enabled,
      expiresAt: expiresAtEpochSeconds,
    });
    await newDiscount.save();
    return res
      .status(201)
      .json({ message: "Discount created successfully", newDiscount });
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const updateDiscont = async (req: Request, res: Response) => {
  try {
    const couponId = req.params.couponId;
    const id = Array.isArray(couponId) ? couponId[0] : couponId;

    if (!id) {
      return res.status(400).json({ message: "Id coupon mancante" });
    }

    const { enabled, usageCount, expiresAt } = req.body;

    const foundCoupons = await DiscountDynamo.scan("couponId")
      .eq(id)
      .limit(1)
      .exec();
    const coupon = foundCoupons[0] as
      | { userId: string; couponId: string }
      | undefined;

    if (!coupon) {
      return res
        .status(404)
        .json({ message: `Nessun coupon presente con l'id: ${id}` });
    }

    const updates: {
      enabled?: boolean;
      usageCount?: number;
      expiresAt?: number;
    } = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (usageCount !== undefined) updates.usageCount = usageCount;
    if (expiresAt !== undefined) {
      const expiresAtEpochSeconds = parseExpiresAtToEpochSeconds(expiresAt);
      if (expiresAtEpochSeconds === null) {
        return res
          .status(400)
          .json({ message: "Formato data expiresAt non valido" });
      }
      updates.expiresAt = expiresAtEpochSeconds;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nessun campo da aggiornare" });
    }

    await DiscountDynamo.update(
      { userId: coupon.userId, couponId: coupon.couponId },
      updates,
    );

    return res.status(200).json({ message: "Coupon modificato correttamente" });
  } catch (error) {
    console.error("Errore updateDiscont:", error);
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    const couponId = req.params.couponId;
    const id = Array.isArray(couponId) ? couponId[0] : couponId;

    if (!id) {
      return res.status(400).json({ message: "Id coupon mancante" });
    }

    const foundCoupons = await DiscountDynamo.scan("couponId")
      .eq(id)
      .limit(1)
      .exec();
    const coupon = foundCoupons[0] as
      | { userId: string; couponId: string }
      | undefined;

    if (!coupon) {
      return res
        .status(404)
        .json({ message: `Nessun coupon presente con l'id: ${id}` });
    }

    await DiscountDynamo.delete({
      userId: coupon.userId,
      couponId: coupon.couponId,
    });

    return res.status(200).json({ message: "Coupon eliminato correttamente" });
  } catch (error) {
    console.error("Errore deleteDiscount:", error);
    res.status(500).json({ message: "Errore interno server" });
  }
};
