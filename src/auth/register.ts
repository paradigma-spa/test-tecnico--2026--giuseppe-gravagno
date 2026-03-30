import { randomUUID } from "crypto";
import { type Request, type Response } from "express";
import { UserDynamo } from "../models/userModel";

export const userRegister = async (req: Request, res: Response) => {
  try {
    const newUsername = req.body.username;
    const newEmail = req.body.email;
    const newPassword = req.body.password;

    const existing = await UserDynamo.query("email")
      .using("EmailIndex")
      .eq(newEmail)
      .exec();

    if (existing.count > 0) {
      return res
        .status(409)
        .json({ message: "Non puoi usare questa mail, è già registrata" });
    }

    await UserDynamo.create({
      id: randomUUID(),
      username: newUsername,
      email: newEmail,
      password: newPassword,
    });

    return res.status(201).json({ message: "Utente creato" });
  } catch (error) {
    return res.status(500).json({ message: "Creazione Utente fallita" });
  }
};
