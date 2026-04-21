import type { OrderInsertPayload } from "./OrderInsertPayload";

export type OrderEmailMessage = {
  toEmail?: string;
  subject?: string;
  template?: string;
  payload: OrderInsertPayload;
};
