export type OrderEmailPayload = {
  id: string;
  userId: string;
  typeFood: string;
  quantity?: number;
  price?: number;
  createdAt?: string;
};

export type OrderEmailMessage = {
  toEmail?: string;
  subject?: string;
  template?: string;
  payload: OrderEmailPayload;
};
