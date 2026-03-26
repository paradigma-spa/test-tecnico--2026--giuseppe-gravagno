import { type Request, type Response } from "express";
import { User } from "../models/userModel";
import { Order } from "../models/orderModel";

export const allUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await User.find();
    return res.status(200).json({allUsers});
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const getTopCustomer = async (req: Request, res: Response) => {
  try {
    let { startDate, endDate } = req.query;

    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const start = startDate ? new Date(startDate as string) : oneMonthAgo;
    const end = endDate ? new Date(endDate as string) : now;

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
    ]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Nessun ordine trovato nel periodo" });
    }

    return res.status(200).json({
      topCustomer: result[0]._id,
      email: result[0].userData.email,
      totalOrders: result[0].totalOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};
