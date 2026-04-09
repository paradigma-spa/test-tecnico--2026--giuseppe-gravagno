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
  - price (number)
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
  - couponId (string, richiesto dalla validazione attuale)
  - coupon (string)
  - couponValue (number)
  - usageCount (number)
  - enabled (boolean)
  - expiresAt (string data valida)
- Note:
  - couponId viene rigenerato lato server con randomUUID
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
