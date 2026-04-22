# Lambda 2 - Coupon, EventBridge, DynamoDB Streams e SES

Questa Lambda gestisce tre flussi distinti tramite un unico entrypoint:

1. creazione coupon tramite evento EventBridge
2. aggiornamento stato coupon quando DynamoDB Streams segnala una modifica su `DiscountsTable`
3. invio email ordine e generazione PDF quando arriva un messaggio su SQS

L'entrypoint unico e' `src/mainHandler.ts`, che instrada l'evento verso il dominio corretto in base alla forma dell'evento ricevuto.

## Architettura

### Entry point

- `src/mainHandler.ts`
  - se l'evento contiene `Records` con `body`, viene trattato come evento SQS
  - se l'evento contiene `Records` con `OldImage/NewImage`, viene trattato come evento DynamoDB Streams (coupon-state)
  - se l'evento contiene `detail`, viene trattato come evento EventBridge

### Dominio coupon

- `src/domains/coupon/handlers/couponEventBridgeHandler.ts`
- `src/domains/coupon/services/createDiscountService.ts`
- `src/domains/coupon/services/targetUpdaterService.ts`
- `src/domains/coupon/utils/eventPayload.ts`

Questo flusso:

1. legge il payload EventBridge
2. recupera o deduce `userId`
3. crea un coupon in DynamoDB
4. aggiorna il target EventBridge per la successiva invocazione

### Dominio coupon-state

- `src/domains/coupon-state/handler/couponStateHandler.ts`
- `src/domains/coupon-state/services/applyCouponStateChangeService.ts`
- `src/domains/coupon-state/utils/readModifyPayloads.ts`

Questo flusso:

1. riceve record `MODIFY` da DynamoDB Streams sulla tabella coupon
2. confronta `OldImage` e `NewImage`
3. quando `usageCount` passa da >0 a 0, disabilita automaticamente il coupon (`enabled=false`)

### Dominio orders-email

- `src/domains/orders-email/handler/emailSqsHandler.ts`
- `src/domains/orders-email/sqsOrderEmail/sqsService.ts`
- `src/domains/orders-email/services/sendOrderMail.ts`
- `src/domains/orders-email/types/OrderEmailMessage.ts`

Questo flusso:

1. riceve un evento SQS
2. deserializza i messaggi ordine
3. genera un PDF riepilogo ordine
4. salva il PDF su S3 (`PDF_BUCKET_NAME`, key `<userId>/ordine_<orderId>.pdf`)
5. invia una mail tramite Amazon SESv2 con allegato PDF

## Infrastruttura

La funzione e' definita in `serverless.ts` come una singola Lambda:

- nome function: `orderCouponEmailHandler`
- handler: `src/mainHandler.handler`

La stessa Lambda:

1. e' agganciata a DynamoDB Streams sulla tabella coupon (`DISCOUNTS_STREAM_ARN`)
2. consuma messaggi dalla coda SQS `orderQueue`
3. puo' essere invocata anche da EventBridge (instradamento applicativo su `detail`)

## Variabili ambiente

Il file `.env` deve contenere almeno:

```env
DEPLOY=functions
EVENTBRIDGE_RULE_NAME=eventCoupon
EVENTBRIDGE_TARGET_ID=Id33368d08-7d89-4862-9ef4-9afbb8b0cc62
EVENTBRIDGE_TARGET_ARN=arn:aws:lambda:eu-south-1:847041281071:function:coupon-service-dev-orderCouponEmailHandler
DISCOUNTS_STREAM_ARN=arn:aws:dynamodb:eu-south-1:847041281071:table/order-api-dev-discounts/stream/2026-04-14T06:43:34.645
ORDER_EMAIL_QUEUE_ARN=arn:aws:sqs:eu-south-1:847041281071:orderQueue
SES_FROM_EMAIL=example@example.com
SES_TO_EMAIL=example@example.com
```

Note:

- `EVENTBRIDGE_TARGET_ARN` deve puntare alla Lambda effettivamente deployata
- `DISCOUNTS_STREAM_ARN` deve essere l'ARN dello stream attivo della tabella coupon, non l'ARN base della tabella
- `ORDER_EMAIL_QUEUE_ARN` deve essere l'ARN della coda SQS usata da Lambda 1 per accodare eventi email ordine
- `SES_FROM_EMAIL` deve essere una mail verificata su SES
- `PDF_BUCKET_NAME` e' valorizzata dalla configurazione serverless (`order-bill-s3`)

## Permessi IAM

La Lambda ha permessi per:

1. CloudWatch Logs
2. SES/SESv2 (`ses:SendEmail`, `ses:SendRawEmail`, `sesv2:SendEmail`)
3. DynamoDB table access per ordini e coupon
4. lettura DynamoDB Streams (`DescribeStream`, `GetRecords`, `GetShardIterator`, `ListStreams`)
5. EventBridge `PutTargets`
6. SQS (`SendMessage`, `ReceiveMessage`, `DeleteMessage`, `GetQueueAttributes`)
7. S3 (`ListBucket`, `GetObject`, `PutObject`, `DeleteObject`)

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

1. la tabella coupon emette un evento `MODIFY` su DynamoDB Streams
2. `mainHandler` riconosce stream con `OldImage` + `NewImage`
3. viene eseguito `couponStateHandler`
4. i coupon con `usageCount` arrivato a 0 vengono disabilitati automaticamente

## Dipendenze principali

- `@aws-sdk/client-eventbridge`
- `@aws-sdk/client-sesv2`
- `@aws-sdk/util-dynamodb`
- `dynamoose`
- `nodemailer`
- `puppeteer-core`
- `@sparticuz/chromium`
