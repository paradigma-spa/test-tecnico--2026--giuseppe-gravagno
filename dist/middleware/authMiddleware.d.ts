import express, { type Request, type Response, type NextFunction } from 'express';
declare module "express-serve-static-core" {
    interface Request {
        user?: {
            _id: string;
            username: string;
        };
    }
}
export declare const verifyJWT: (req: Request, res: Response, next: NextFunction) => express.Response<any, Record<string, any>> | undefined;
export declare const validateRegister: import("express-validator").ValidationChain[];
export declare const validateLogin: import("express-validator").ValidationChain[];
//# sourceMappingURL=authMiddleware.d.ts.map