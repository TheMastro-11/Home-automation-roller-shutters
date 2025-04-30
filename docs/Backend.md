# Manuale di Riuso - Backend

## 1. Introduzione

Questo documento descrive come configurare, eseguire e riutilizzare i componenti del backend del sistema HARS. Il backend è sviluppato utilizzando Java e Spring Boot e gestisce la logica di business per il controllo di tapparelle (`RollerShutter`), la lettura di sensori di luminosità (`LightSensor`) e l'esecuzione di routine automatiche (`Routine`), interagendo con dispositivi IoT tramite MQTT e un database PostgreSQL.

## 2. Prerequisiti

Per buildare ed eseguire il backend, sono necessari:
* **Java Development Kit (JDK):** Versione 17 o superiore.
* **Gradle:** Il sistema di build utilizzato dal progetto.
* **Database PostgreSQL:** Un'istanza accessibile per la persistenza dei dati.
* **AWS Account & CLI:** Per la connessione ad AWS IoT per MQTT. Le credenziali sono necessarie.
* **Docker & Docker Compose:** Per l'esecuzione tramite containers.

## 3. Configurazione

La configurazione principale avviene tramite due file nella cartella `src/main/resources`:

1.  **`application.properties`**:
    * `spring.application.name`: Nome dell'applicazione.
    * `spring.datasource.url`, `username`, `password`: Credenziali per la connessione al database PostgreSQL.
    * `spring.datasource.driver-class-name`, `spring.jpa.database-platform`, `spring.jpa.hibernate.ddl-auto`: Configurazioni JPA/Hibernate.
    * `mqtt.topics.publish`, `mqtt.topics.subscribe`: Topics MQTT di default (anche se la configurazione specifica avviene in `MqttConfig`).
    * `mqtt.channels.outbound`, `mqtt.channels.inbound`: Canali Spring Integration per MQTT.
    * `logging.level.*`: Livelli di log per debug.
    * `management.endpoints.web.exposure.include=health`: Espone l'endpoint di health check (`/actuator/health`).

2.  **`application-secrets.yml`**:
    * Contiene informazioni sensibili, principalmente per la connessione ad AWS IoT tramite MQTT.
    * `aws.iot.endpoint`: L'URL dell'endpoint AWS IoT.
    * `aws.iot.clientId`: L'ID client per la connessione MQTT (viene generato un UUID casuale se si usa `${random.uuid}`).
    * `aws.iot.privateKeyPem`, `aws.iot.certificatePem`, `aws.iot.caCertificatePem`: Chiave privata, certificato del client e certificato della CA in formato PEM per l'autenticazione TLS reciproca con AWS IoT. **Questi valori sono strettamente confidenziali.**

**Importante:** Assicurarsi che le credenziali del database e di AWS IoT siano corrette per l'ambiente di destinazione. Il file `application-secrets.yml` non è presente nella repository.

## 4. Architettura Generale

Il backend segue un'architettura stratificata:

* **Controller (`com.hars.routes.*`):** Espongono gli endpoint API REST, gestiscono le richieste HTTP e invocano i servizi appropriati.
* **Service (`com.hars.services.*`):** Contengono la logica di business principale, coordinano le interazioni tra repository, altri servizi e sistemi esterni (MQTT, Agente Esterno).
* **Repository (`com.hars.persistence.repository.*`):** Interfacce (basate su Spring Data JPA) per l'interazione con il database.
* **Entities (`com.hars.persistence.entities.*`):** Oggetti che rappresentano le tabelle del database (annotati con JPA).
* **DTO (`com.hars.persistence.dto.*`):** Data Transfer Objects usati per trasferire dati tra i layer, specialmente tra Controller e Service, e per definire la struttura dei dati nelle API REST.
* **Config (`com.hars.config.*`, `com.hars.security.*`):** Configurazioni per Spring Boot, Sicurezza, MQTT, ecc.
* **Utils (`com.hars.utils.*`):** Classi di utilità (e.g., `JwtUtil`) ed enumerazioni (`Role`, `Permission`).

**Tecnologie Chiave:**
* Spring Boot
* Spring Security (JWT Authentication)
* Spring Data JPA / Hibernate
* Spring Integration MQTT
* Eclipse Paho MQTT Client
* PostgreSQL Driver
* BouncyCastle (per gestione certificati TLS)
* Jackson (JSON processing)
* SLF4j / Logback (Logging)

## 5. API Endpoints (Riutilizzo tramite API REST)

Le API sono esposte sotto il prefisso `/api`. L'accesso richiede autenticazione tramite JWT (Bearer Token), eccetto per `/api/auth/**`, `/v3/api-docs/**`, `/swagger-ui/**`, `/actuator/health` e `/api/entities/routine/activate/*` (quest'ultimo accessibile solo dall'indirizzo dell'agente esterno per le automazioni).

* **Autenticazione (`/api/auth`)**:
    * `POST /register`: Registra un nuovo utente. Richiede `username` e `password` nel body (`AuthenticationRequest`).
    * `POST /authenticate`: Effettua il login e restituisce un token JWT. Richiede `username` e `password` (`AuthenticationRequest`). Restituisce `AuthenticationResponse` con il token.

* **Case (`/api/entities/home`)**:
    * `GET /`: Ottiene tutte le case accessibili all'utente autenticato.
    * `POST /create`: Crea una nuova casa (richiede `name` nel body `HomeDTO.nameInput`).
    * `DELETE /delete/{id}`: Elimina una casa per ID.
    * `PATCH /patch/name/{id}`: Modifica il nome di una casa (richiede `name` nel body `HomeDTO.nameInput`).
    * `PATCH /patch/rollerShutters/{id}`: Associa tapparelle a una casa (richiede lista di `RollerShutter` nel body `HomeDTO.rollerShutterInput`).
    * `PATCH /patch/lightSensor/{id}`: Associa/dissocia un sensore di luce a una casa (richiede `LightSensor` nel body `HomeDTO.lightSensorInput` o `null` per dissociare).

* **Tapparelle (`/api/entities/rollerShutter`)**:
    * `GET /`: Ottiene tutte le tapparelle accessibili all'utente.
    * `POST /create`: Crea una nuova tapparella (richiede `name` nel body `RollerShutterDTO.nameInput`).
    * `DELETE /delete/{id}`: Elimina una tapparella.
    * `PATCH /patch/name/{id}`: Modifica il nome (richiede `name` nel body `RollerShutterDTO.nameInput`).
    * `PATCH /patch/opening/{id}`: Imposta la percentuale di apertura (richiede `value` nel body `RollerShutterDTO.openingInput`). **Questa azione invia un messaggio MQTT al dispositivo.**

* **Sensori di Luce (`/api/entities/lightSensor`)**:
    * `GET /`: Ottiene tutti i sensori accessibili all'utente.
    * `POST /create`: Crea un nuovo sensore (richiede `name` nel body `LightSensorDTO.nameInput`).
    * `DELETE /delete/{id}`: Elimina un sensore (lo rimuove anche dalle case associate).
    * `PATCH /patch/name/{id}`: Modifica il nome (richiede `name` nel body `LightSensorDTO.nameInput`).
    * `PATCH /patch/value/{id}`: Aggiorna il valore letto dal sensore (tipicamente chiamato dal listener MQTT, non direttamente dall'utente) (richiede `value` nel body `LightSensorDTO.lightValueInput`).

* **Routine (`/api/entities/routine`)**:
    * `GET /`: Ottiene tutte le routine accessibili all'utente.
    * `POST /create/actionTime`: Crea una routine basata sull'orario (richiede `name`, `time`, `rollerShutters`, `rollerShutterValue` nel body `RoutineDTO.actiontTimeCreateInput`). **Notifica l'agente esterno.**
    * `POST /create/lightSensor`: Crea una routine basata sul valore del sensore di luce (richiede `name`, `lightSensor`, `lightValueRecord`, `rollerShutters`, `rollerShutterValue` nel body `RoutineDTO.lightSensorCreateInput`).
    * `DELETE /delete/{id}`: Elimina una routine. **Notifica l'agente esterno se è una routine temporizzata.**
    * `PATCH /patch/name/{id}`: Modifica il nome (richiede `name` nel body `RoutineDTO.nameInput`). **Notifica l'agente esterno se è temporizzata.**
    * `PATCH /patch/actionTime/{id}`: Modifica l'orario di azione (richiede `time` nel body `RoutineDTO.actionTimeInput`). **Notifica l'agente esterno.**
    * `PATCH /patch/lightSensor/{id}`: Modifica il sensore di luce associato (richiede `LightSensor` nel body `RoutineDTO.lightSensorInput`).
    * `PATCH /patch/rollerShutters/{id}`: Modifica le tapparelle associate (richiede lista di `RollerShutter` nel body `RoutineDTO.rollerShutterInput`).
    * `POST /activate/{id}`: Attiva manualmente una routine (eseguendo l'azione sulle tapparelle associate via MQTT). **Accessibile solo da IP/Hostname specifico (Routine Agent).**

* **Utenti (`/api/users/`)**:
    * `GET /`: Ottiene la lista di tutti gli utenti.

## 6. Comunicazione MQTT (Riutilizzo/Integrazione MQTT)

Il backend utilizza MQTT per comunicare con i dispositivi IoT tramite AWS IoT Core.

* **Configurazione:** Definita in `MqttConfig.java` e `application-secrets.yml`. Utilizza TLS con autenticazione reciproca basata su certificati.
* **Sottoscrizione:** Il backend si sottoscrive ai topic degli *shadow* dei dispositivi AWS IoT (`$aws/things/+/shadow/update/accepted`, `$aws/things/+/shadow/get/accepted`, `$aws/things/+/shadow/update/delta`).
    * Ascolta i messaggi su questi topic tramite `MqttMessageListener`.
    * Quando riceve un messaggio `update/accepted` o `get/accepted`, estrae lo stato `reported`.
    * Cerca nel database `LightSensor` o `RollerShutter` il cui nome (`name`) corrisponde a una chiave nello stato `reported`.
    * Aggiorna il valore (`lightValue` per sensori, `percentageOpening` per tapparelle) nel database tramite i rispettivi servizi (`LightSensorService.patchValueLightSensor`, `RollerShutterService.patchOpeningRollerShutter`).
    * Se viene aggiornato un valore di `LightSensor`, verifica se qualche routine basata su quel sensore deve essere attivata (`RoutineService.lightSensorValueCheck`).
* **Pubblicazione:** Il backend pubblica messaggi MQTT per controllare i dispositivi, principalmente le tapparelle.
    * Utilizza `MqttPublisherService`.
    * Quando viene chiamato l'endpoint `PATCH /api/entities/rollerShutter/patch/opening/{id}` o quando una routine viene attivata (`RoutineService.activateRoutine`), viene inviato un messaggio.
    * Il topic di pubblicazione tipico è dello *shadow* del dispositivo, ad esempio `$aws/things/ESP8266_Tapparella/shadow/update`.
    * Il payload è un JSON che imposta lo stato `desired` dello shadow, e.g., `{ "state": {"desired": {"<nome_tapparella>": <valore_apertura>}}}`.

**Per integrare un nuovo dispositivo:**
1.  Creare il dispositivo ("Thing") in AWS IoT.
2.  Assicurarsi che il dispositivo pubblichi il suo stato sullo *shadow* in formato JSON, usando una chiave che corrisponda al `name` dell'entità `LightSensor` o `RollerShutter` nel database del backend.
3.  Se il dispositivo deve essere controllato dal backend (e.g., una tapparella), assicurarsi che si sottoscriva al suo topic di *shadow update* (`$aws/things/<thingName>/shadow/update`) e reagisca ai cambiamenti nello stato `desired`.

(Nel nostro caso abbiamo utilizzato un'unica shadow che gestisce più dispositivi)

## 7. Integrazione Agente Esterno (Routine Agent)

Il backend interagisce con un servizio esterno ("Routine Agent") per la gestione delle routine basate sul tempo.

* **Comunicazione:** Avviene tramite chiamate API REST dal backend verso l'agente, utilizzando `ExternalApiClient`.
* **Endpoint Agente:** L'agente è atteso all'indirizzo `http://routineAgent:8081`.
* **Operazioni:**
    * Quando una routine basata sul tempo viene creata (`/create/actionTime`), il backend chiama `POST /api/agent/routine/create` sull'agente, inviando ID, nome e orario della routine.
    * Quando una routine temporizzata viene eliminata (`/delete/{id}`), il backend chiama `DELETE /api/agent/routine/delete/{id}` sull'agente.
    * Quando il nome (`/patch/name/{id}`) o l'orario (`/patch/actionTime/{id}`) di una routine temporizzata vengono modificati, il backend chiama le corrispondenti API PATCH sull'agente.
* **Callback dall'Agente:** L'agente, quando arriva l'ora di eseguire una routine, chiama l'endpoint `POST /api/entities/routine/activate/{id}` del backend.
* **Sicurezza:** L'endpoint `/api/entities/routine/activate/{id}` è protetto e accessibile solo se la richiesta proviene dall'hostname `routineAgent` .

## 8. Modello Dati (Database)

Le entità principali nel database PostgreSQL sono:

* **`User`**: Informazioni utente (username, password, ruolo, permessi).
* **`RollerShutter`**: Tapparelle (ID, nome, percentuale di apertura attuale).
* **`LightSensor`**: Sensori di luce (ID, nome, valore di luminosità attuale).
* **`Home`**: Case (ID, nome). Ha una relazione One-to-Many con `RollerShutter` e One-to-One con `LightSensor`.
* **`Routine`**: Routine (ID, nome, orario di azione `actionTime` , valore soglia sensore `lightSensorValue` , valore di apertura tapparelle `rollerShutterValue`). Ha una relazione Many-to-One con `LightSensor` e Many-to-Many con `RollerShutter`.
* **`Ownership`**: Mappa gli utenti (tramite `username`) agli ID delle entità (Case, Tapparelle, Sensori, Routine) che possiedono o a cui hanno accesso. Usato per l'autorizzazione a livello di dati.

Le relazioni e lo schema vengono gestiti da JPA/Hibernate.

## 9. Sicurezza

* **Autenticazione:** Basata su token JWT. L'utente (Frontend) si autentica con username/password (`/api/auth/authenticate`), riceve un token che deve includere nell'header `Authorization: Bearer <token>` per le richieste successive.
* **Filtro JWT:** `JwtAuthenticationFilter` intercetta le richieste, valida il token e imposta il contesto di sicurezza di Spring.
* **Autorizzazione:**
    * Basata su endpoint: `SecurityConfig` definisce quali endpoint richiedono autenticazione.
    * Basata su Dati (Ownership): I controller (`HomeController`, `RollerShutterController`, etc.) utilizzano `OwnershipService` per recuperare gli ID delle entità associate all'utente autenticato e filtrare i risultati, assicurando che un utente veda/modifichi solo le proprie entità.
    * Autorizzazione Specifica per IP/Hostname: L'endpoint `/api/entities/routine/activate/{id}` è accessibile solo da un hostname specifico (`routineAgent`).
* **CORS:** Configurato per permettere richieste da qualsiasi origine (`*`). Potrebbe essere necessario restringere in produzione.
* **CSRF:** Disabilitato (`csrf.disable()`), comune per API stateless basate su token.