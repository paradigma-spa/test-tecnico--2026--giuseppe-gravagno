export type OrderStatusPayload = {
  id: string;
  status: string;
  nextStatusAt: number | null;
};