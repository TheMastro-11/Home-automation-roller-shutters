# Manuale di Riuso - Routine Agent

## 1. Introduzione

Routine Agent è un microservizio sviluppato con Spring Boot che ha lo scopo di gestire e schedulare l'esecuzione di automazioni. Un componente scheduler interno si occupa di verificare periodicamente le routine definite e di invocare il backend all'orario specificato per ciascuna routine.

## 2. Architettura e Componenti Principali

* **Framework:** Spring Boot 3.x
* **Linguaggio:** Java
* **Build Tool:** Gradle
* **Database:** PostgreSQL (utilizzato tramite Spring Data JPA)
* **Controller REST (`RoutineController.java`):** Espone endpoint HTTP per la gestione delle routine (CRUD).
* **Service Layer (`RoutineAgentService.java`):** Contiene la logica di business per la manipolazione delle routine nel database.
* **Persistence Layer:**
    * `Routine.java`: Entità JPA che rappresenta una routine.
    * `RoutineRepository.java`: Interfaccia Spring Data JPA per le operazioni sul database relative alle routine.
* **Scheduler (`DynamicRoutineSchedulerService.java`):** Servizio che si attiva a intervalli regolari per pianificare le chiamate API basate sull'`actionTime` delle routine presenti nel database. Utilizza `TaskScheduler` di Spring.
* **Client API Esterno (`ExternalApiClient.java`):** Componente che effettua chiamate HTTP POST verso un servizio backend quando una routine deve essere attivata.

## 3. Configurazione

Le configurazioni principali si trovano nel file `src/main/resources/application.properties`:

* `server.port`: Porta su cui il servizio ascolta (default: 8081).
* `spring.application.name`: Nome dell'applicazione Spring (default: routineAgent).
* `spring.datasource.url`: URL di connessione al database PostgreSQL.
* `spring.datasource.username`: Nome utente per il database.
* `spring.datasource.password`: Password per il database.
* `spring.jpa.hibernate.ddl-auto`: Strategia di Hibernate per la gestione dello schema.
* `logging.level.*`: Configurazione del livello di logging per debug.
* **URL del Backend:** L'URL del servizio backend chiamato da `ExternalApiClient` è hardcoded nel codice (`http://backend:8080`).

## 4. API Endpoints

Il servizio espone le seguenti API REST sotto il percorso base `/api/agent/routine`:

* **`POST /create`**:
    * Crea una nuova routine.
    * **Request Body:** Oggetto JSON rappresentante la `Routine` (es. `{"id": 1, "name": "RoutineMattina", "actionTime": "08:00:00"}`).
    * **Response:** Messaggio di successo o errore.
* **`DELETE /delete/{id}`**:
    * Elimina la routine con l'ID specificato.
    * **Path Variable:** `id` (Long) dell'entità `Routine` da eliminare.
    * **Response:** Messaggio di successo o errore.
* **`PATCH /patch/name/{id}`**:
    * Modifica il nome della routine con l'ID specificato.
    * **Path Variable:** `id` (Long) della routine.
    * **Request Body:** Stringa contenente il nuovo nome.
    * **Response:** Messaggio di successo o errore.
* **`PATCH /patch/actionTime/{id}`**:
    * Modifica l'orario di esecuzione (`actionTime`) della routine con l'ID specificato.
    * **Path Variable:** `id` (Long) della routine.
    * **Request Body:** Stringa rappresentante l'orario nel formato `HH:mm:ss` (es. `"14:30:00"`).
    * **Response:** Messaggio di successo o errore.

## 5. Logica di Schedulazione e Chiamata Esterna

* Il `DynamicRoutineSchedulerService` si attiva ogni giorno alle 01:30.
* Ad ogni attivazione, cancella tutti i task precedentemente schedulati e ricarica tutte le routine dal database (`routineRepository.findAll()`).
* Per ogni routine, controlla se `actionTime` è impostato e se è futuro rispetto all'orario corrente.
* Se le condizioni sono soddisfatte, schedula una chiamata API tramite `taskScheduler.schedule()` per l'orario `actionTime` del giorno corrente.
* Il task schedulato invoca il metodo `externalApiClient.callApi()`.
* `ExternalApiClient` effettua una richiesta `POST` all'endpoint `/api/entities/routine/activate/{routineId}` del backend.

## 6. Dipendenze Esterne

Per funzionare correttamente, `routineAgent` richiede:

1.  **Database PostgreSQL:** Accessibile tramite le credenziali in `application.properties`. La tabella `routine` deve esistere o essere creabile da Hibernate (`ddl-auto=update`).
2.  **Servizio Backend:** Un servizio HTTP che risponda all'endpoint `POST /api/entities/routine/activate/{id}` all'indirizzo configurato (default `http://backend:8080`).