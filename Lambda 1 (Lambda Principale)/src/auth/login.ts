import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel";
import * as bcrypt from "bcrypt";
import { getSecrets } from "../secret";

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const userPassword = user.get("password") as string;

    const passwordMatch = await bcrypt.compare(password, userPassword);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const secrets = await getSecrets() || { JWT_SECRET: process.env.JWT_SECRET };

    if (!secrets.JWT_SECRET) {
      return res
        .status(500)
        .json({ message: "JWT_SECRET non trovato nel secret" });
    }

    const token = jwt.sign(
      {
        id: user.get("id"),
        username: user.get("username"),
        role: user.get("role"),
      },
      secrets.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Errore lato server:", error });
  }
};
