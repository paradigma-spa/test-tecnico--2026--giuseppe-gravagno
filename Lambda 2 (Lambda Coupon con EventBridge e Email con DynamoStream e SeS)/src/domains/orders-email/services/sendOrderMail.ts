import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { OrderEmailMessage } from "../types/OrderEmailMessage";
import puppeteer from "puppeteer-core";
import nodemailer from "nodemailer";
const chromium = require("@sparticuz/chromium");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client();

export const sendOrderMail = async (message: OrderEmailMessage) => {
  const order = message.payload;
  const from = process.env.SES_FROM_EMAIL;
  const to = message.toEmail || process.env.SES_TO_EMAIL;

  if (!from || !to) {
    throw new Error("SES_FROM_EMAIL o SES_TO_EMAIL non configurate");
  }

  const sesClient = new SESv2Client({
    region: process.env.AWS_REGION || "eu-south-1",
  });

  const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  });

  let pdfBuffer: Buffer;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Riepilogo Ordine #${order?.id}</h1>
          <br>
          <br>
          <p><strong>User ID:</strong> ${order?.userId}</p>
          <p><strong>Cibo:</strong> ${order?.typeFood}</p>
          <p><strong>Prezzo:</strong> €${order?.price}</p>
          <p><strong>Quantità:</strong> ${order?.quantity}</p>
          <p><strong>Data:</strong> ${order?.createdAt}</p>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    pdfBuffer = (await page.pdf({
      format: "A4",
      printBackground: true,
    })) as Buffer;
  } finally {
    await browser.close();
  }

  const command = new PutObjectCommand({
    Bucket: process.env.PDF_BUCKET_NAME!,
    Key: `${order?.userId}/ordine_${order?.id}.pdf`,
    Body: pdfBuffer,
    ContentType: "application/pdf",
    Metadata: {
      "order-id": order?.id,
    },
  });

  await s3Client.send(command);     

  await transporter.sendMail({
    from,
    to,
    subject: message.subject || "Nuovo ordine ricevuto",
    text: `Grazie per l'ordine effettuato! ID: ${order?.id}`,
    attachments: [
      {
        filename: `ordine_${order?.id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};
