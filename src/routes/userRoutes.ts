import { Router } from "express";
import { validationResult } from "express-validator";
import { type Request, type Response, type NextFunction } from "express";
import { allUsers, getTopCustomer } from "../controllers/userController";

const router = Router();

const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  console.log("checkValidation chiamato");
  const errors = validationResult(req);
  console.log("Errori trovati:", JSON.stringify(errors.array()));

  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.get("/all", checkValidation, allUsers);
router.get("/top_customer", checkValidation, getTopCustomer);

export default router;
