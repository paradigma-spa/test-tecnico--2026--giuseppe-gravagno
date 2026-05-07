# Order API - Documentazione

API REST serverless su AWS Lambda + API Gateway per:

- autenticazione utenti
- gestione ordini
- gestione utenti (funzioni admin)
- gestione coupon/sconti

## Stack Tecnologico

- Node.js 20
- TypeScript
- Express
- Serverless Framework
- DynamoDB (via Dynamoose)
- JWT per autenticazione

## Architettura

### Entry point

- `src/server.ts`
  - carica le variabili ambiente con `dotenv`
  - espone l'app Express tramite `serverless-http`

- `src/app.ts`
  - inizializza middleware e routing principali

### Struttura logica

- `src/auth`
  - login e registrazione
- `src/controllers`
  - logica applicativa delle rotte
- `src/routes`
  - definizione endpoint HTTP
- `src/middleware`
  - autenticazione JWT, autorizzazioni e validazioni
- `src/models`
  - modelli Dynamoose per utenti, ordini e coupon
- `src/services`
  - servizi applicativi di supporto

## Infrastruttura

La Lambda e' definita in `serverless.ts` come una singola funzione HTTP:

- nome function: `lambda`
- handler: `src/server.handler`
- trigger: API Gateway (`/` e `/{proxy+}`)

Le tabelle DynamoDB vengono create nello stack:

1. `UsersTable`
2. `OrdersTable`
3. `DiscountsTable`

### Nota su DynamoDB Streams

La tabella ordini (`OrdersTable`) espone anche DynamoDB Streams con:

- `StreamViewType: NEW_IMAGE`

Questa configurazione serve per integrare Lambda 2, che ascolta i nuovi ordini e invia mail tramite SES.

## Variabili ambiente

Le variabili principali esposte alla funzione sono:

- `USERS_TABLE`
- `ORDERS_TABLE`
- `DISCOUNTS_TABLE`
- `BUCKET_NAME`
- `ORDER_EMAIL_QUEUE_URL`

Inoltre la funzione espone anche:

- `ACCOUNT_ID`
- `LAYER_VERSION`

Per il deploy locale/dev conviene avere anche un file `.env` coerente con lo stage usato.

## Permessi IAM

La Lambda ha permessi per:

1. accesso DynamoDB su utenti, ordini e coupon
2. accesso agli indici GSI delle tre tabelle
3. lettura secret da AWS Secrets Manager
4. invio/ricezione messaggi su SQS (`orderQueue`) per pipeline email ordini
5. accesso bucket S3 (`order-bill-s3`) per listing/upload/download fatture PDF

## Deploy

I comandi disponibili nel progetto sono:

### Installazione

```bash
npm install
```

### Test

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

### Deploy layer

```bash
npm run deploy:layer
```

### Deploy funzioni (stage dev)

```bash
npm run deploy:functions:dev
```

## Avvio e Deploy

### Installazione

npm install

### Test

npm test
npm run test:coverage

### Deploy Layer

npm run deploy:layer

### Deploy Funzioni (stage dev)

npm run deploy:functions:dev

## URL Base

In ambiente dev il deploy corrente espone:

https://b208kvfkbb.execute-api.eu-south-1.amazonaws.com/dev

Root health check:

GET /

Risposta attesa:

- 200 con messaggio API online

## Autenticazione e Ruoli

- Le rotte protette richiedono header Authorization nel formato:
  Bearer <token>
- Il token JWT viene ottenuto da login.
- Alcune rotte sono limitate agli admin.

## Rotte Disponibili

### Auth

Prefisso: /auth

1. POST /auth/register

- Descrizione: registra un nuovo utente
- Body richiesto:
  - username (string)
  - email (string, email valida)
  - password (string forte)
- Risposte tipiche:
  - 201 Utente creato
  - 409 email già registrata

2. POST /auth/login

- Descrizione: login utente e ritorno JWT
- Body richiesto:
  - email (string)
  - password (string)
- Risposte tipiche:
  - 200 con token
  - 401 credenziali non valide

### Orders

Prefisso: /orders

1. GET /orders

- Descrizione: lista ordini globali
- Auth: no

2. GET /orders/me

- Descrizione: ordini dell'utente autenticato
- Auth: si

3. POST /orders

- Descrizione: crea nuovo ordine
- Auth: si
- Body tipico:
  - typeFood (string)
  - quantity (number)
  - price (number opzionale, default 0)
  - coupon (string opzionale)
- Note coupon:
  - se coupon presente, viene cercato per utente e codice
  - controllo stato: abilitato, usageCount > 0, non scaduto

4. PATCH /orders/:id

- Descrizione: aggiorna ordine
- Auth: si
- Body aggiornabile:
  - typeFood (string)
  - quantity (number)

5. DELETE /orders/:id

- Descrizione: elimina ordine
- Auth: si

6. GET /orders/most_order

- Descrizione: restituisce piatto piu ordinato
- Auth: no

7. GET /orders/bills

- Descrizione: recupera elenco fatture PDF utente da S3 con URL pre-firmati (validita' 60s)
- Auth: si

### Users

Prefisso: /users

1. GET /users/all

- Descrizione: lista utenti
- Auth: si
- Ruolo: admin

2. POST /users/update_role

- Descrizione: cambia ruolo utente
- Auth: si
- Ruolo: admin
- Body richiesto:
  - userId (string)
  - newRole (user | admin)

3. GET /users/top_customer

- Descrizione: cliente con piu ordini nel periodo
- Auth: si
- Ruolo: admin
- Query opzionali:
  - startDate
  - endDate

### Discounts

Prefisso: /discounts

1. GET /discounts

- Descrizione: lista coupon
- Auth: si

2. POST /discounts

- Descrizione: crea coupon
- Auth: si
- Ruolo: admin
- Body richiesto:
  - userId (string)
  - coupon (string)
  - couponValue (number)
  - usageCount (number)
  - enabled (boolean)
  - expiresAt (string data valida)
- Note:
  - couponId non va passato nel body: viene sempre generato lato server con randomUUID
  - expiresAt viene convertito e salvato in secondi Unix (coerente con TTL)

3. PATCH /discounts/:couponId

- Descrizione: aggiorna coupon
- Auth: si
- Ruolo: admin
- Body aggiornabile:
  - enabled (boolean)
  - usageCount (number)
  - expiresAt (string data valida)

4. DELETE /discounts/:couponId

- Descrizione: elimina coupon
- Auth: si
- Ruolo: admin

## Integrazione Lambda 2

Quando viene creato un ordine (`POST /orders`), Lambda 1 pubblica un messaggio su SQS (`orderQueue`) tramite `ORDER_EMAIL_QUEUE_URL`.
Lambda 2 consuma la coda e si occupa dell'invio email + generazione PDF ordine.

## Modello Dati (Sintesi)

### Users Table

- PK: id
- GSI: EmailIndex (email)

### Orders Table

- PK: id
- GSI: UserOrdersIndex (userId + createdAt)

### Discounts Table

- PK: userId
- SK: couponId
- GSI: UserDiscountsIndex (userId + createdAt)
- expiresAt usato come timestamp in secondi (TTL)

## Errori Comuni

- 401 su route protette: token mancante/non valido
- 403 su route admin: utente non admin
- Coupon non trovato: codice inesistente per quello userId
- Coupon scaduto: confronto su timestamp in secondi contro ora corrente

## Note Operative

- Se usi CloudFront/custom domain e ricevi HTML 403, verifica URL e stage corretti.
- Per test rapido usa direttamente endpoint execute-api.
