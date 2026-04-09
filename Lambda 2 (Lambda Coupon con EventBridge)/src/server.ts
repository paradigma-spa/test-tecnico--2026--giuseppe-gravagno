import { createDiscountFromPayload } from "./utils/createDiscount";
import { OrderDynamo } from "./models/orderModel";

type EventPayload = Record<string, unknown>;

const readEventPayload = (event: unknown): EventPayload => {
  if (!event || typeof event !== "object") {
    return {};
  }

  if ("detail" in event) {
    const detail = (event as { detail?: unknown }).detail;
    if (detail && typeof detail === "object") {
      return detail as EventPayload;
    }
  }

  return event as EventPayload;
};

const readUserIdFromPayload = (payload: EventPayload): string => {
  return String(payload.userId ?? "").trim();
};

const getLastUserIdFromOrders = async (): Promise<string | null> => {
  const orders = (await OrderDynamo.scan().exec()) as Array<{
    userId?: string;
    createdAt?: string;
  }>;

  if (!orders.length) {
    return null;
  }

  const latestOrder = orders
    .filter((item) => item.userId && item.createdAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    )[0];

  return latestOrder?.userId?.trim() ?? null;
};

export const handler = async (event: unknown) => {
  const payload = readEventPayload(event);

  const inputUserId = readUserIdFromPayload(payload);
  const effectiveUserId = inputUserId || (await getLastUserIdFromOrders());

  if (!effectiveUserId) {
    throw new Error(
      "Nessun userId nel payload e nessun ordine trovato in DynamoDB.",
    );
  }

  const payloadToCreate = {
    ...payload,
    userId: effectiveUserId,
  };

  const created = await createDiscountFromPayload(payloadToCreate);

  console.log("Coupon creato con successo", {
    userId: effectiveUserId,
    couponId: created.couponId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Coupon creato" }),
  };
};
