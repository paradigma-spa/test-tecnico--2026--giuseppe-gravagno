import { type Request, type Response } from "express";
import { UserDynamo } from "../models/userModel";
import { OrderDynamo } from "../models/orderModel";

export const allUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await UserDynamo.scan().exec();
    return res.status(200).json({ allUsers });
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const { userId, newRole } = req.body as {
      userId?: string;
      newRole?: string;
    };

    if (!userId || !newRole) {
      return res
        .status(400)
        .json({ message: "userId e newRole sono obbligatori" });
    }

    if (newRole !== "user" && newRole !== "admin") {
      return res.status(400).json({ message: "newRole non valido" });
    }

    const targetUser = await UserDynamo.get(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    await UserDynamo.update(userId, { role: newRole });
    return res.status(200).json({ message: `Ruolo aggiornato a ${newRole}` });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const getTopCustomer = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const start = startDate ? new Date(startDate as string) : oneMonthAgo;
    const end = endDate ? new Date(endDate as string) : now;

    const orders = await OrderDynamo.scan().exec();
    const counters = new Map<string, number>();

    for (const order of orders) {
      const userId = (order as unknown as { userId?: string }).userId;
      const createdAt = (order as unknown as { createdAt?: string }).createdAt;
      if (!userId || !createdAt) continue;

      const createdDate = new Date(createdAt);
      if (Number.isNaN(createdDate.getTime())) continue;

      if (createdDate >= start && createdDate <= end) {
        counters.set(userId, (counters.get(userId) ?? 0) + 1);
      }
    }

    if (counters.size === 0) {
      return res
        .status(404)
        .json({ message: "Nessun ordine trovato nel periodo" });
    }

    let topCustomerId = "";
    let totalOrders = 0;
    for (const [userId, count] of counters.entries()) {
      if (count > totalOrders) {
        topCustomerId = userId;
        totalOrders = count;
      }
    }

    const userData = (await UserDynamo.get(topCustomerId)) as unknown as
      | { email?: string }
      | undefined;

    return res.status(200).json({
      topCustomer: topCustomerId,
      email: userData?.email,
      totalOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};
