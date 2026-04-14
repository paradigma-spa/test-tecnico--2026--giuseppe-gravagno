# Lambda 2 - Coupon, EventBridge, DynamoDB Streams e SES

Questa Lambda gestisce due flussi distinti tramite un unico entrypoint:

1. creazione coupon tramite evento EventBridge
2. invio email quando DynamoDB Streams segnala un nuovo ordine nella tabella ordini

L'entrypoint unico e' `src/mainHandler.ts`, che instrada l'evento verso il dominio corretto in base alla forma dell'evento ricevuto.

## Architettura

### Entry point

- `src/mainHandler.ts`
  - se l'evento contiene `Records`, viene trattato come evento DynamoDB Streams
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

### Dominio orders-email

- `src/domains/orders-email/handler/emailStreamsHandler.ts`
- `src/domains/orders-email/utils/readInsertPayloads.ts`
- `src/domains/orders-email/services/sendOrderMail.ts`
- `src/domains/orders-email/types/OrderInsertPayload.ts`

Questo flusso:

1. riceve un evento DynamoDB Streams
2. filtra solo i record `INSERT`
3. converte `NewImage` con `unmarshall`
4. invia una mail tramite Amazon SES per ogni nuovo ordine trovato

## Infrastruttura

La funzione e' definita in `serverless.ts` come una singola Lambda:

- nome function: `orderCouponEmailHandler`
- handler: `src/mainHandler.handler`

La stessa Lambda:

1. puo' essere invocata da EventBridge
2. e' agganciata a DynamoDB Streams sulla tabella ordini

## Variabili ambiente

Il file `.env` deve contenere almeno:

```env
DEPLOY=functions
EVENTBRIDGE_RULE_NAME=eventCoupon
EVENTBRIDGE_TARGET_ID=Id33368d08-7d89-4862-9ef4-9afbb8b0cc62
EVENTBRIDGE_TARGET_ARN=arn:aws:lambda:eu-south-1:847041281071:function:coupon-service-dev-orderCouponEmailHandler
ORDERS_STREAM_ARN=arn:aws:dynamodb:eu-south-1:847041281071:table/order-api-dev-orders/stream/2026-04-14T06:43:34.645
SES_FROM_EMAIL=example@example.com
SES_TO_EMAIL=example@example.com
```

Note:

- `EVENTBRIDGE_TARGET_ARN` deve puntare alla Lambda effettivamente deployata
- `ORDERS_STREAM_ARN` deve essere l'ARN dello stream attivo della tabella ordini, non l'ARN base della tabella
- `SES_FROM_EMAIL` deve essere una mail verificata su SES

## Permessi IAM

La Lambda ha permessi per:

1. CloudWatch Logs
2. SES (`ses:SendEmail`, `ses:SendRawEmail`)
3. DynamoDB table access per ordini e coupon
4. lettura DynamoDB Streams (`DescribeStream`, `GetRecords`, `GetShardIterator`, `ListStreams`)
5. EventBridge `PutTargets`

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

1. DynamoDB Streams emette un evento sulla tabella ordini
2. la Lambda viene invocata tramite trigger stream
3. `mainHandler` riconosce un evento con `Records`
4. viene eseguito `emailStreamsHandler`
5. per ogni `INSERT` viene inviata una mail con SES

## Dipendenze principali

- `@aws-sdk/client-eventbridge`
- `@aws-sdk/client-ses`
- `@aws-sdk/util-dynamodb`
- `dynamoose`
