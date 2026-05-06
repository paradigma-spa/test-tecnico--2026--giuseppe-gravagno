import { type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { OrderDynamo } from "../models/orderModel";
import {
  applyCouponToPrice,
  decrementCouponUsage,
  findValidCouponByCode,
} from "../services/discountService";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { enqueueOrderEmail } from "../services/sqsService";
import { OrderStatusPayload } from "../types/orderStatus";

type OrderOwner = { userId: string };

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
        req.user.id,
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
        req.user.id,
        ckeckCoupon.couponId,
        ckeckCoupon.usageCount,
      );

      const orderData = {
        id: randomUUID(),
        typeFood,
        quantity,
        price: priceFinal,
        coupon: ckeckCoupon.coupon,
        couponId: ckeckCoupon.couponId,
        userId: req.user.id,
      };

      const savedOrder = await OrderDynamo.create(orderData);

      await enqueueOrderEmail({
        subject: "Nuovo ordine ricevuto",
        template: "order-confirmation",
        payload: {
          id: orderData.id,
          userId: orderData.userId,
          typeFood: orderData.typeFood,
          quantity: orderData.quantity,
          price: orderData.price,
          createdAt: savedOrder.createdAt,
        },
      });

      return res.status(201).json({
        message:
          "Nuovo ordine creato correttamente con lo sconto di: " +
          discountApplied,
      });
    }

    const orderData = {
      id: randomUUID(),
      typeFood,
      quantity,
      price: Number(price ?? 0),
      userId: req.user.id,
    };

    const savedOrder = await OrderDynamo.create(orderData);

    await enqueueOrderEmail({
      subject: "Nuovo ordine ricevuto",
      template: "order-confirmation",
      payload: {
        id: orderData.id,
        userId: orderData.userId,
        typeFood: orderData.typeFood,
        quantity: orderData.quantity,
        price: orderData.price,
        createdAt: savedOrder.createdAt,
      },
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

    const order = (await OrderDynamo.get(id)) as
      | Partial<OrderOwner>
      | undefined;

    if (!order || typeof order.userId !== "string") {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    if (order.userId !== req.user?.id) {
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

    const order = (await OrderDynamo.get(id)) as
      | Partial<OrderOwner>
      | undefined;

    if (!order || typeof order.userId !== "string") {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    if (order.userId !== req.user?.id) {
      return res.status(403).json({ message: "Non autorizzato" });
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
    if (!req.user?.id) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const orders = await OrderDynamo.query("userId")
      .using("UserOrdersIndex")
      .eq(req.user.id)
      .exec();

    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const getMostPopularOrder = async (req: Request, res: Response) => {
  try {
    const orders = await OrderDynamo.scan().exec();

    const counters = new Map<string, number>();
    let mostPopular: string | null = null;
    let maxCount = 0;

    for (const { typeFood } of orders) {
      if (!typeFood) continue;

      const nextCount = (counters.get(typeFood) ?? 0) + 1;
      counters.set(typeFood, nextCount);

      if (nextCount > maxCount) {
        maxCount = nextCount;
        mostPopular = typeFood;
      }
    }

    if (!mostPopular) {
      return res.status(404).json({ message: "Nessun ordine trovato" });
    }

    return res.status(200).json({
      mostPopular,
      count: maxCount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const getOrderBills = async (req: Request, res: Response) => {
  try {
    const s3Client = new S3Client({ region: "eu-south-1" });

    const personalBills = new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: `${req.user?.id}/`,
    });

    const data = s3Client.send(personalBills);

    if (!(await data).Contents) {
      return res
        .status(404)
        .json({ message: "Non è stato trovato alcun dato per il tuo user ID" });
    }

    const billsMap = (await data).Contents?.map(async (file) => {
      const getPersonalBills = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: file.Key,
      });

      const getPresignedLink = await getSignedUrl(s3Client, getPersonalBills, {
        expiresIn: 60,
      });

      return {
        name: file.Key?.split("/").pop(),
        url: getPresignedLink,
        expiresIn: 60,
      };
    });

    const promise = await Promise.all(billsMap!);

    return res.status(200).json({ bills: promise });
  } catch (error) {
    return res.status(500).json({ message: "Errore lato server" });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const orderIdParam = req.params.id;
    if (!orderIdParam) {
      return res.status(400).json({ message: "Id ordine mancante" });
    }

    const orderId = Array.isArray(orderIdParam)
      ? orderIdParam[0]
      : orderIdParam;

    if (!orderId) {
      return res.status(400).json({ message: "Id ordine mancante" });
    }

    const order = (await OrderDynamo.get(
      orderId,
    )) as unknown as OrderStatusPayload;

    if (!order) {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    return res.status(200).json({
      id: order.id,
      status: order.status,
      nextStatusAt: order.nextStatusAt ?? null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};
