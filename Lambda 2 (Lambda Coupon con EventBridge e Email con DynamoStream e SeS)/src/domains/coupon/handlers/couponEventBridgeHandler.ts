import { createDiscountFromPayload } from "../services/createDiscountService";
import { updateRuleTargetInputForNextInvocation } from "../services/targetUpdaterService";
import { getLastUserIdFromOrders } from "../../orders-email/services/orderLookupService";
import { readEventPayload, readUserIdFromPayload } from "../utils/eventPayload";

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

  try {
    await updateRuleTargetInputForNextInvocation(payloadToCreate);
  } catch (error) {
    console.error("Errore aggiornando il target EventBridge", error);
  }

  console.log("Coupon creato con successo", {
    userId: effectiveUserId,
    couponId: created.couponId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Coupon creato" }),
  };
};
