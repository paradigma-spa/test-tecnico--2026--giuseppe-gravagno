Server di ordini

Abbiamo due rotte principali:

- "/auth" per accedere a registrazione e login

- "/orders" per visualizzare, creare, modificare ed eliminare gli ordini

AUTH:

- "/register" dove bisogna inserire nel body della richiesta usurname, email e password
. "/login" dove bisogna inserire nel body della richiesta email e password e verrà restituito il JWT

ORDERS:

- "/" effettuato tramite get per vedere tutti gli ordini di tutti gli utenti

- "/me" effettuato tramite get con token nell'url per vedere tutti gli ordini dell'utente

- "/" effettuato tramite post con token e nel body: typeFood, quantity, date, hours per creare un nuovo ordine

- "/" effettuato tramite patch con token e nell'url l'id dell'ordine e con nel body: typeFood, quantity, date, hours per modificare solo o tutti i campi interessati

- "/" effettuato tramite delete con token nell'url l'id dell'ordine