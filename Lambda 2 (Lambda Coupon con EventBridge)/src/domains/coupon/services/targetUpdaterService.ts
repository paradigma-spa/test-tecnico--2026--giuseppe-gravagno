import {
  EventBridgeClient,
  PutTargetsCommand,
} from "@aws-sdk/client-eventbridge";
import { EventPayload } from "../types/eventPayload";
import { getLastUserIdFromOrders } from "../../orders-email/services/orderLookupService";

const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || "eu-south-1",
});

export const updateRuleTargetInputForNextInvocation = async (
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
