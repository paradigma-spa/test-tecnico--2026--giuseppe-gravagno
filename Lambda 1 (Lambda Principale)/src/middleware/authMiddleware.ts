import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSecrets } from "../secret";
import { body } from "express-validator";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

type UserPayload = {
  id: string;
  username: string;
  role: string;
};

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Nessun token fornito" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token mancante o malformato" });
    }

    const { JWT_SECRET } = await getSecrets();
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role ?? undefined,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token non valido" });
  }
};

export const validateRegister = [
  body("username").notEmpty(),
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .notEmpty()
    .withMessage("Inserisci una mail con un formato valido"),
  body("password")
    .trim()
    .notEmpty()
    .isStrongPassword()
    .withMessage(
      "La password deve essere di almeno 8 caratteri, contenere una maiuscola, un carattere speciale ed un numero",
    ),
];

export const validateLogin = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .notEmpty()
    .withMessage("Inserisci una mail con un formato valido"),
  body("password")
    .trim()
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("Inserisci una password valida"),
];

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Accesso negato" });
  }
};
