# Manuale di Riuso - Frontend

## Introduzione

Questo manuale descrive i componenti riutilizzabili del frontend il cui scopo è facilitare la manutenzione, l'estensione e la comprensione del codice.

## Tecnologie Utilizzate

* HTML5
* CSS3 (con [Bootstrap 5](https://getbootstrap.com/docs/5.3/getting-started/introduction/))
* JavaScript (ES6+)

## Struttura Generale dei File

Il frontend è organizzato come segue:

* **File HTML (`*.html`):** Contengono la struttura delle pagine principali (Login, Registrazione, Dashboard). Utilizzano Bootstrap per il layout e includono i CSS e JS necessari.
* **CSS (`css/styles.css`):** Foglio di stile personalizzato che si aggiunge o sovrascrive gli stili di Bootstrap per adattare l'aspetto dell'applicazione.
* **JavaScript (`js/`):** Directory contenente i file JavaScript modulari:
    * `auth.js`: Gestisce l'autenticazione (login, registrazione, gestione token JWT) e fornisce una funzione wrapper (`fetchApi`) per tutte le chiamate API al backend.
    * `dashboard.js`: Contiene la logica specifica per la pagina Dashboard, come caricare e gestire case, dispositivi globali (sensori, tapparelle) e interazioni generali della dashboard.
    * `register.js`: Gestisce la logica specifica del form di registrazione.
    * `routines.js`: Logica per creare, visualizzare, modificare ed eliminare le routine.
    * `shutters.js`: Logica per controllare le tapparelle (selezione, regolazione apertura, apri/chiudi tutto).

## Componenti Riutilizzabili

### 1. Stili CSS (`css/styles.css`)

Il file `styles.css` definisce l'aspetto dell'applicazione, basandosi su Bootstrap 5. Elementi riutilizzabili includono:

* **Layout Base:** Struttura basata su classi Bootstrap (`container`, `row`, `col-*`, `mb-*`, `d-flex`, etc.).
* **Container Personalizzato (`.container`):** Applica uno sfondo gradiente e bordi arrotondati alle sezioni principali.
* **Bottoni (`.btn`, `.btn-*`):** Stili coerenti per tutti i bottoni (es. `.btn-primary`, `.btn-danger`, `.btn-warning`, `.btn-sm`), inclusi effetti al passaggio del mouse.
* **Liste (`.list-group`, `.list-group-item`):** Stili uniformi per visualizzare elenchi di elementi (case, sensori, tapparelle, routine), con sfondo scuro e testo chiaro.
* **Form:** Stili per elementi dei form (`form`, `.form-label`, `.form-control`, `.form-select`, `.form-check`) per garantire un aspetto omogeneo.
* **Responsività:** Regole `@media` per adattare l'interfaccia a diverse dimensioni dello schermo, migliorando l'usabilità su dispositivi mobili.

### 2. Funzionalità JavaScript

#### a. Gestione API (`js/auth.js`)

Questo file è fondamentale per l'interazione con il backend.

* **`fetchApi(path, method = 'GET', body = null, extraHeaders = {}, sendAuthToken = true)`:**
    * **Scopo:** Funzione centrale per tutte le chiamate HTTP all'API backend. È progettata per essere riutilizzata ovunque sia necessaria una comunicazione con il server.
    * **Caratteristiche Chiave:**
        * **Invio Token Automatico:** Aggiunge automaticamente il token JWT (recuperato dal `localStorage`) all'header `Authorization: Bearer <token>` per le richieste autenticate.
        * **Gestione Tipi Contenuto:** Imposta `Content-Type: application/json` e serializza automaticamente l'oggetto `body` in una stringa JSON.
        * **Gestione Metodi e Risposte:** Supporta vari metodi HTTP (GET, POST, PATCH, DELETE). Gestisce le risposte parsando il JSON o restituendo testo.
        * **Gestione Errori:** Intercetta errori di rete e risposte API con status non OK (es. 4xx, 5xx), estrae il messaggio di errore dal corpo della risposta (se JSON) e lancia un oggetto `Error` contenente i dettagli, semplificando la gestione degli errori nei punti di chiamata.
    
* **`sha256(message)`:**
    * **Scopo:** Funzione asincrona per calcolare l'hash SHA-256 di una stringa. Usata specificamente per l'hashing della password prima dell'invio al backend durante la registrazione e il login.

* **Autenticazione (`checkAuthentication()`, `logout()`):**
    * `checkAuthentication()`: Verifica la presenza del token JWT nel `localStorage`. Se assente, reindirizza l'utente alla pagina di login. Da usare all'inizio del caricamento di pagine che richiedono autenticazione.
    * `logout()`: Rimuove il token JWT dal `localStorage` e reindirizza alla pagina di login. Da associare all'azione di logout dell'utente.

#### b. Pattern Comuni per Liste e Form (in `dashboard.js`, `routines.js`, `shutters.js`)

Diversi file JavaScript implementano pattern simili per gestire l'interfaccia utente in modo dinamico:

* **Caricamento Dati in Liste:**
    1.  Identificare l'elemento contenitore (`ul` o `div`).
    2.  Mostrare un messaggio di "Loading...".
    3.  Usare `fetchApi` per recuperare i dati.
    4.  Pulire il contenitore.
    5.  Iterare sui dati e generare dinamicamente l'HTML per ogni elemento (`li` o `div`), includendo i dati stessi e bottoni per azioni (Modifica, Elimina) con i relativi `onclick`.
    6.  Gestire gli errori mostrando un messaggio all'interno del contenitore.
    * **Esempi:** `loadHomes`, `loadGlobalLightSensors`, `loadRoutines`, `loadHomeShuttersForManagement`.

* **Gestione Form (Creazione/Modifica):**
    1.  **Visualizzazione:** Funzioni dedicate (es. `showEditHomeForm`, `showRoutinesForm`) gestiscono la visibilità del form, lo resettano (per creazione) o lo popolano con i dati esistenti (per modifica), e caricano eventuali dati ausiliari necessari (es. liste per `<select>`).
    2.  **Annullamento:** Funzioni (es. `cancelEditHome`, `cancelRoutines`) nascondono il form e ripristinano la vista precedente, spesso ricaricando le liste aggiornate.
    3.  **Salvataggio:** Funzioni collegate all'evento `submit` del form (es. `submitEditHome`, `saveRoutines`) raccolgono i dati, li validano, chiamano `fetchApi` (con `POST` per creare, `PATCH` per modificare), gestiscono la risposta (successo/errore), aggiornano l'UI e forniscono feedback all'utente. È buona pratica disabilitare il bottone di submit durante la chiamata API.

#### c. Logica Specifica (`shutters.js`, `routines.js`)

* **Controllo Tapparelle (`shutters.js`):** Gestisce lo stato della tapparella selezionata (`selectedRollerShutterId`) e implementa azioni specifiche come `adjustRollerShutterOpening`, `openAllShutters`, `closeAllShutters` che interagiscono con l'API tramite `fetchApi`.
* **Form Routine (`routines.js`):** Include logica per gestire la complessità del form delle routine, come mostrare/nascondere campi in base al tipo di trigger (tempo/luminosità), aggiornare dinamicamente i display dei valori degli slider, e popolare le liste di sensori/tapparelle disponibili.
