# Lambda 2 - Coupon con EventBridge e Email

## Architettura

Questa Lambda gestisce:

- Stato dei coupon tramite EventBridge e SQS.
- Invio di email tramite SQS e SES.

### Modifiche recenti

In passato, questa Lambda utilizzava DynamoDB Streams per:

- Aggiornare lo stato dei coupon.
- Inviare email relative agli ordini.

**Cambiamento:**

- DynamoDB Streams è stato sostituito da SQS per migliorare la modularità e la scalabilità.
- I file legacy relativi a DynamoDB Streams (`emailStreamsHandler.ts` e `readInsertPayloads.ts`) sono mantenuti nel repository ma non sono collegati al flusso runtime corrente.

### File legacy mantenuti

Per facilitare eventuali rollback/riconversioni verso DynamoDB Streams, alcuni file storici sono lasciati nel codice:

- `src/domains/orders-email/handler/emailStreamsHandler.ts`
- `src/domains/orders-email/utils/readInsertPayloads.ts`

Stato attuale:

- non importati da `src/mainHandler.ts`
- non usati dal deploy corrente
- da considerare solo come riferimento tecnico per una conversione futura

### Permessi IAM

La configurazione attuale include permessi per:

- SQS: invio, ricezione e cancellazione di messaggi.
- SES: invio di email.

I permessi relativi a DynamoDB Streams sono stati rimossi.

## Infrastruttura

La funzione è definita in `serverless.ts` come una singola Lambda:

- Nome funzione: `orderCouponEmailHandler`
- Handler: `src/mainHandler.handler`

La stessa Lambda:

1. Consuma messaggi dalla coda SQS `orderQueue`.
2. Può essere invocata anche da EventBridge (instradamento applicativo su `detail`).

**Nota:** La precedente configurazione con DynamoDB Streams (`DISCOUNTS_STREAM_ARN`) è stata rimossa.

## Variabili ambiente

Il file `.env` deve contenere almeno:

```env
DEPLOY=functions
EVENTBRIDGE_RULE_NAME=eventCoupon
EVENTBRIDGE_TARGET_ID=Id33368d08-7d89-4862-9ef4-9afbb8b0cc62
EVENTBRIDGE_TARGET_ARN=arn:aws:lambda:eu-south-1:847041281071:function:coupon-service-dev-orderCouponEmailHandler
ORDER_EMAIL_QUEUE_ARN=arn:aws:sqs:eu-south-1:847041281071:orderQueue
SES_FROM_EMAIL=example@example.com
SES_TO_EMAIL=example@example.com
```

Note:

- `EVENTBRIDGE_TARGET_ARN` deve puntare alla Lambda effettivamente deployata
- `ORDER_EMAIL_QUEUE_ARN` deve essere l'ARN della coda SQS usata da Lambda 1 per accodare eventi email ordine
- `LAMBDA1_BASE_URL` deve puntare all'endpoint API Gateway di Lambda 1 (`https://.../dev`), non a un'istanza EC2
- `SES_FROM_EMAIL` deve essere una mail verificata su SES
- `PDF_BUCKET_NAME` e' valorizzata dalla configurazione serverless (`order-bill-s3`)

## Deploy

### Deploy layer

```bash
npm run deploy:layer
```

### Deploy funzioni

```bash
npm run deploy:functions:dev
```

## Flusso operativo

### Flusso coupon

1. EventBridge invoca la Lambda
2. `mainHandler` riconosce un evento con `detail`
3. viene eseguito `couponEventBridgeHandler`
4. viene creato il coupon

### Flusso email ordine

1. Lambda 1 accoda un messaggio ordine su SQS
2. la Lambda viene invocata dal trigger SQS
3. `mainHandler` riconosce un evento SQS (`Records[].body`)
4. viene eseguito `emailSqsHandler`
5. viene generato il PDF ordine, salvato su S3 e inviato via email

### Flusso coupon-state

1. Lambda 1 accoda messaggi di stato coupon su SQS
2. la Lambda viene invocata dal trigger SQS
3. `mainHandler` instrada al `couponStateHandler`
4. i coupon con `usageCount` arrivato a 0 vengono disabilitati automaticamente

## Dipendenze principali

- `@aws-sdk/client-eventbridge`
- `@aws-sdk/client-sesv2`
- `@aws-sdk/util-dynamodb`
- `dynamoose`
- `nodemailer`
- `puppeteer-core`
- `@sparticuz/chromium`
