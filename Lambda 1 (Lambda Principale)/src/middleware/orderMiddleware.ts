import { body } from "express-validator";

export const validateCreateOrder = () => [
  body("typeFood")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("typeFood e' obbligatorio"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("quantity deve essere un intero maggiore di 0"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("price deve essere un numero maggiore o uguale a 0"),
  body("coupon")
    .optional()
    .isString()
    .trim()
    .withMessage("coupon deve essere una stringa"),
];
