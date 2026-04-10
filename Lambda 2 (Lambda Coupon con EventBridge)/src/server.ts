import { createDiscountFromPayload } from "./utils/createDiscount";
import { OrderDynamo } from "./models/orderModel";
import {
  EventBridgeClient,
  PutTargetsCommand,
} from "@aws-sdk/client-eventbridge";

type EventPayload = Record<string, unknown>;

const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || "eu-south-1",
});

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

const updateRuleTargetInputForNextInvocation = async (
  payload: EventPayload,
): Promise<void> => {
  const ruleName = (process.env.EVENTBRIDGE_RULE_NAME || "").trim();
  const targetId = (process.env.EVENTBRIDGE_TARGET_ID || "").trim();
  const targetArn = (process.env.EVENTBRIDGE_TARGET_ARN || "").trim();

  if (!ruleName || !targetId || !targetArn) {
    console.warn(
      "EVENTBRIDGE_RULE_NAME / EVENTBRIDGE_TARGET_ID / EVENTBRIDGE_TARGET_ARN non configurate: salto aggiornamento target EventBridge.",
    );
    return;
  }

  const nextUserId = await getLastUserIdFromOrders();
  if (!nextUserId) {
    console.warn(
      "Nessun ordine disponibile per calcolare il prossimo userId: target non aggiornato.",
    );
    return;
  }

  const nextPayload: EventPayload = {
    ...payload,
    userId: nextUserId,
  };

  await eventBridgeClient.send(
    new PutTargetsCommand({
      Rule: ruleName,
      Targets: [
        {
          Id: targetId,
          Arn: targetArn,
          Input: JSON.stringify(nextPayload),
        },
      ],
    }),
  );

  console.log("Input del target EventBridge aggiornato", {
    ruleName,
    targetId,
    nextUserId,
  });
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

  try {
    await updateRuleTargetInputForNextInvocation(payloadToCreate);
  } catch (error) {
    // Non bloccare la creazione del coupon se update target fallisce.
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
