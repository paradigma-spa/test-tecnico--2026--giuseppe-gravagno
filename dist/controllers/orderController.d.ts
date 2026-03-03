import express, { type Request, type Response } from 'express';
export declare const getOrders: (req: Request, res: Response) => express.Response<any, Record<string, any>> | undefined;
export declare const newOrder: (req: Request, res: Response) => Promise<void>;
export declare const updateOrder: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const deleteOrder: (req: Request, res: Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const getMyOrder: (req: Request, res: Response) => express.Response<any, Record<string, any>>;
//# sourceMappingURL=orderController.d.ts.map