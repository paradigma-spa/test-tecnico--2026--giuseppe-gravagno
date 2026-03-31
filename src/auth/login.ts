import { type Request, type Response } from "express";
import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";
import { UserDynamo } from "../models/userModel";
import * as bcrypt from 'bcrypt';


export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const results = await UserDynamo.query("email")
      .using("EmailIndex")
      .eq(email)
      .exec();

    if (!results || results.count === 0) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user!.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { id: user!.id, username: user!.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ message: "Errore lato server" });
  }
};
