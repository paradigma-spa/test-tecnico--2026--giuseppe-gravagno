import { type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { OrderDynamo } from "../models/orderModel";
import {
  applyCouponToPrice,
  decrementCouponUsage,
  findValidCouponByCode,
} from "../services/discountService";

export const getOrders = async (req: Request, res: Response) => {
  try {
    const allOrders = await OrderDynamo.scan().exec();
    return res.status(200).json({ allOrders });
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const newOrder = async (req: Request, res: Response) => {
  try {
    const { typeFood, quantity, price, coupon } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    if (coupon && String(coupon).trim() !== "") {
      const ckeckCoupon = await findValidCouponByCode(
        req.user._id,
        String(coupon),
      );

      if (!ckeckCoupon) {
        return res.status(404).json({ message: "Coupon non trovato" });
      }

      if (!ckeckCoupon.enabled) {
        return res.status(400).json({ message: "Coupon disabilitato" });
      }

      if (ckeckCoupon.usageCount <= 0) {
        return res.status(400).json({ message: "Coupon esaurito" });
      }

      if (
        ckeckCoupon.expiresAt &&
        ckeckCoupon.expiresAt <= Math.floor(Date.now() / 1000)
      ) {
        return res.status(400).json({ message: "Coupon scaduto" });
      }

      const applyCoupon = await applyCouponToPrice(
        price,
        ckeckCoupon.couponValue,
      );

      const priceFinal = applyCoupon.priceFinal;
      const discountApplied = applyCoupon.discountApplied;

      await decrementCouponUsage(
        req.user._id,
        ckeckCoupon.couponId,
        ckeckCoupon.usageCount,
      );

      await OrderDynamo.create({
        id: randomUUID(),
        typeFood,
        quantity,
        price: priceFinal,
        coupon: ckeckCoupon.coupon,
        couponId: ckeckCoupon.couponId,
        userId: req.user._id,
      });

      return res.status(201).json({
        message:
          "Nuovo ordine creato correttamente con lo sconto di: " +
          discountApplied,
      });
    }

    await OrderDynamo.create({
      id: randomUUID(),
      typeFood,
      quantity,
      price: Number(price ?? 0),
      userId: req.user._id,
    });

    return res
      .status(201)
      .json({ message: "Nuovo ordine creato correttamente" });
  } catch (error) {
    return res.status(500).json({ message: "Errore lato server" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      return res.status(400).json({ message: "Id ordine mancante" });
    }

    const { typeFood, quantity } = req.body;

    const order = (await OrderDynamo.get(id)) as unknown as
      | { userId: string }
      | undefined;

    if (!order) {
      return res
        .status(404)
        .json({ message: `Nessun ordine presente con l'id: ${id}` });
    }

    if (order.userId !== req.user?._id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const updates: { typeFood?: string; quantity?: number } = {};
    if (typeFood !== undefined) updates.typeFood = typeFood;
    if (quantity !== undefined) updates.quantity = quantity;

    if (Object.keys(updates).length > 0) {
      await OrderDynamo.update(id, updates);
    }

    return res.status(200).json({ message: "Ordine modificato correttamente" });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      return res.status(400).json({ message: "Id ordine mancante" });
    }

    const order = (await OrderDynamo.get(id)) as unknown as
      | { userId: string }
      | undefined;

    if (!order) {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    if (order.userId !== req.user._id) {
      return res
        .status(403)
        .json({ message: "Non puoi eliminare questo ordine" });
    }

    await OrderDynamo.delete(id);

    return res
      .status(200)
      .json({ message: `Ordine con id ${id} eliminato correttamente` });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const getMyOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const orders = await OrderDynamo.query("userId")
      .using("UserOrdersIndex")
      .eq(req.user._id)
      .exec();

    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const getMostPopularOrder = async (req: Request, res: Response) => {
  try {
    const orders = await OrderDynamo.scan().exec();

    if (orders.length === 0) {
      return res.status(404).json({ message: "Nessun ordine trovato" });
    }

    const counts = new Map<string, number>();
    for (const order of orders) {
      const key = order.typeFood;
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    if (counts.size === 0) {
      return res.status(404).json({ message: "Nessun ordine trovato" });
    }

    let mostPopular = "";
    let maxCount = 0;
    for (const [food, count] of counts.entries()) {
      if (count > maxCount) {
        mostPopular = food;
        maxCount = count;
      }
    }

    return res.status(200).json({
      mostPopular,
      count: maxCount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};
