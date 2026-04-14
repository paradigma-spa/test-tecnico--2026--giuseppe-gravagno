export type OrderInsertPayload = {
  id: string;
  userId: string;
  typeFood: string;
  createdAt?: string;
  price?: number;
  quantity?: number;
};