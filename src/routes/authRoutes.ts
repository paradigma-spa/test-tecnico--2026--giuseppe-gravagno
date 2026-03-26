import { Router } from "express";
import { type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";
import { userRegister } from "../auth/register";
import { userLogin } from "../auth/login";
import { validateLogin, validateRegister } from "../middleware/authMiddleware";

const router = Router();

const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  console.log("checkValidation chiamato");
  const errors = validationResult(req);
  console.log("Errori trovati:", JSON.stringify(errors.array()));

  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.post("/register", validateRegister, checkValidation, userRegister);
router.post("/login", validateLogin, checkValidation, userLogin);

export default router;
