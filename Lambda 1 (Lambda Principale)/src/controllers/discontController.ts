import { type Request, type Response } from "express";
import { Discount } from "../models/discountModel";
import { randomUUID } from "crypto";

const parseExpiresAtToIsoString = (expiresAt: unknown) => {
  const parsed = Date.parse(String(expiresAt));
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
};

export const getDiscount = async (req: Request, res: Response) => {
  try {
    const allDiscounts = await Discount.findAll();
    return res.status(200).json({ allDiscounts });
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { userId, coupon, couponValue, usageCount, enabled, expiresAt } =
      req.body;

    const expiresAtIso = parseExpiresAtToIsoString(expiresAt);
    if (expiresAtIso === null) {
      return res
        .status(400)
        .json({ message: "Formato data expiresAt non valido" });
    }

    const newDiscount = await Discount.create({
      userId,
      couponId: randomUUID(),
      coupon,
      couponValue,
      usageCount,
      enabled,
      expiresAt: expiresAtIso,
    });

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
    const userId = req.body.userId || req.query.userId;

    if (!id || !userId) {
      return res.status(400).json({ message: "Id coupon o userId mancante" });
    }

    const { enabled, usageCount, expiresAt } = req.body;


    const coupon = await Discount.findOne({ where: { id, userId } });

    if (!coupon) {
      return res
        .status(404)
        .json({
          message: `Nessun coupon presente con l'id: ${id} e userId: ${userId}`,
        });
    }

    const updates: {
      enabled?: boolean;
      usageCount?: number;
      expiresAt?: string;
    } = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (usageCount !== undefined) updates.usageCount = usageCount;
    if (expiresAt !== undefined) {
      const expiresAtIso = parseExpiresAtToIsoString(expiresAt);
      if (expiresAtIso === null) {
        return res
          .status(400)
          .json({ message: "Formato data expiresAt non valido" });
      }
      updates.expiresAt = expiresAtIso;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nessun campo da aggiornare" });
    }

    await Discount.update(updates, { where: { id, userId } });

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
    const userId = req.body.userId || req.query.userId;

    if (!id || !userId) {
      return res.status(400).json({ message: "Id coupon o userId mancante" });
    }

    const coupon = await Discount.findOne({ where: { id, userId } });

    if (!coupon) {
      return res
        .status(404)
        .json({
          message: `Nessun coupon presente con l'id: ${id} e userId: ${userId}`,
        });
    }

    await Discount.destroy({ where: { id, userId } });

    return res.status(200).json({ message: "Coupon eliminato correttamente" });
  } catch (error) {
    console.error("Errore deleteDiscount:", error);
    res.status(500).json({ message: "Errore interno server" });
  }
};
