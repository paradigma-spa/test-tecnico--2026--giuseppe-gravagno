export type OrderBasePayload = {
id: string;
userId: string;
typeFood: string;
quantity?: number;
price?: number;
createdAt?: string;
};

export type OrderStatusPayload = OrderBasePayload & {
status: "CREATED" | "PROCESSING" | "PREPARATION" | "READY" | "COMPLETED";
nextStatusAt?: number;
};