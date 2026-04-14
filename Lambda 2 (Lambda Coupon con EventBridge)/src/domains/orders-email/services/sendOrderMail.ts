import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { OrderInsertPayload } from "../types/OrderInsertPayload";

export const sendOrderMail = async (order: OrderInsertPayload) => {
  const sesClient = new SESClient({
    region: process.env.AWS_REGION || "eu-south-1",
  });

  await sesClient.send(
    new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [process.env.SES_TO_EMAIL || ""],
      },
      Message: {
        Subject: {
          Data: "Nuovo ordine ricevuto",
        },
        Body: {
          Text: {
            Data: `Grazie per l'ordine effettuato! \n ID dell'ordine: ${order?.id} \n Il tuo user ID: ${order?.userId} \n Tipo di cibo ordinato: ${order?.typeFood} \n Prezzo: ${order?.price} \n Quantità: ${order?.quantity} \n Data dell'ordine: ${order?.createdAt}`,
          },
        },
      },
    }),
  );
};
