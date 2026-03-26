import { type Request, type Response } from "express";
import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel";

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    if (user!.password !== password) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { id: user!._id, username: user!.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Errore lato server" });
  }
};
