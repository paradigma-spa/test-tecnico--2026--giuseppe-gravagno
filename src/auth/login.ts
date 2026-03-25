import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { JWT_SECRET } from "../config.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Inserisci uno user" });
    }

    if (user!.password !== password) {
      return res.status(404).json({ message: "Le password non corrispondono" });
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
