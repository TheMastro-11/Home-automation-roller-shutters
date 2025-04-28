# Gestione di un sistema di domotica per il controllo delle tapparelle

## 1. Requisiti ad alto livello
- Il sistema prevede l’utilizzo di dispositivi dotati di motore passo-passo e sensore di luminosità, per il controllo e l’automazione delle finestre di un’abitazione. Le letture sono salvate in un database AWS e gestite secondo il paradigma delle shadow things (prevedere scalabilità a livello sia di abitazione sia di finestre gestite);

- Il dispositivo, per ciascuna finestra, è in grado di aprire o chiudere completamente la tapparella, o posizionarla ad altezze intermedie. Di base, regola la tapparella a seconda delle condizioni di luminosità esterna, abbassandola in presenza di sole diretto, o chiudendola nelle ore notturne;

- Il proprietario può, tramite una interfaccia web, visionare lo stato di tutte le tapparelle, programmare la chiusura o apertura automatica per fasce orarie, o regolare manualmente la posizione di ciascuna (permettendo anche l’apertura o chiusura globale).

---

## 2. Specifiche del progetto
Il progetto mira a sviluppare un sistema di automazione domestica scalabile per il controllo delle tapparelle, utilizzando dispositivi IoT, un'infrastruttura cloud, un database per la memorizzazione dei dati e un'interfaccia web.

Le specifiche principali includono:  
- **Controllo Automatico Basato sulla Luce**: La posizione delle tapparelle viene regolata dinamicamente in base alle letture di un sensore di luce in tempo reale.  
- **Gestione Remota**: Gli utenti possono sovrascrivere l'automazione per regolare manualmente le tapparelle, impostare programmi o attivare azioni globali.  
- **Applicazione Web**: Piattaforma backend realizzata in **java** con *springboot* e *gradle*, frontend realizzato con javascript e html.
- **Scalabilità**: Utilizzo degli AWS IoT Shadow per gestire singole finestre e intere abitazioni.  
- **Archiviazione Dati**: I dati dei sensori, le credenziali e i dati degli utenti sono gestite in PostgreSQL.  
- **Integrazione Dispositivi**: Microcontrollori ESP8266 interfacciati con motori passo-passo e sensori di luce. 
- **RoutineAgent**: Un agente separato per la gestione delle routine basate sul tempo.

---

### 2.1  Requisiti funzionali dettagliati del sistema

#### **Requisiti di Controllo del Dispositivo**  
- **Controllo del Motore Passo-Passo**:  
  - Muovere le tapparelle a posizioni precise (0–100% di apertura).  
  - Supportare override manuale tramite interfaccia web.  
- **Integrazione del Sensore di Luce**:  
  - Misurare i livelli di luce ambientale a intervalli configurabili.  
  - Attivare regolazioni delle tapparelle se la luce supera/scende sotto soglie predefinite.  
- **Sincronizzazione con Shadow**:  
  - Segnalare lo stato del dispositivo (posizione, livello di luce) all'AWS IoT Thing Shadow.  

#### **Regole di Automazione**  
- **Programmazione Temporale**:  
  - Definire programmi di apertura/chiusura (es. "Chiudi tutte le tapparelle alle 22:00 ogni giorno").  
- **Automazione Basata sulla Luce**:  
  - Chiudere le tapparelle in caso di luce solare diretta (es. luce > 800 lux) o aprirle all'alba.  
- **Azioni Globali**:  
  - Comandi one-click per aprire/chiudere tutte le tapparelle di un'abitazione.  

#### **Interazione Utente**  
- **Interfaccia Web**:  
  - Dashboard in tempo reale con informazioni riguardo le case, i sensori, le tapparelle e le routine.  
  - Possibilità di regolare l'apertura delle tapparelle.
  - Pannello di configurazione per le automazioni.  
- **Autenticazione**:  
  - Registrazione/login utenti.  

#### **Gestione Dati**  
- **Dati dei Sensori**:  
  - Memorizzare luce/posizioni.  
- **Dati Utenti**:  
  - Profili utenti, credenziali e dispositivi personali.  

#### **Attori del sistema**  
**Proprietario/Utente:**  
    L'utente potrà:
    - verificare lo stato attuale degli oggetti 
    - controllare l'apertura o chiusura delle tapparelle o tramite delle automazioni o con comandi diretti
    - aggiungere o rimuovere elementi

#### **Casi d’uso principali:**  
Apertura automatizzata di una taparella tramite trigger

**Descrizione**
Apertura automatizzata di una taparella sulla base di un orario specifico

**Pre-Condizioni**
Un utente ha definito tempo prima un'apertura parziale della tapparella di camera sua all'alba(es. 06:00).
*RoutineAgent* è in esecuzione sul master ed ha un flusso definito secondo il criterio sopra descritto.

**Sequenza**
1. La tapparella è chiusa, è notte.
2. Alle 6:00 scatta il trigger per l'apertura del 40% della tapparella
3. La tapparella si apre

**Post-condizioni**
Lo stato della tapparella viene aggiornato sulla shadow e backend.

------------ 

Apertura manuale di una taparella tramite interfaccia web

**Descrizione**
Apertura manuale di una taparella sulla base dell'input dell'utente.

**Pre-Condizioni**
Un utente vuole farsi un riposino pomeridiano e decide di chiudere le tapparelle.

**Sequenza**
1. Apre l'interfaccia web e imposta la chiusura.
2. Il backend riceve l'input e comanda l'esecuzione tramite MQTT.
1. La tapparella è chiusa.

**Post-condizioni**
Lo stato della tapparella viene aggiornato sulla shadow e backend.

---

### 2.2 Implementazione del sistema

**Fasi principali dell’implementazione:**

1. **Prototipazione del Dispositivo IoT:**  
   - Configurazione dell’ESP8266 connesso al sensore di luminosità e al motore passo-passo.
   - Sviluppo del firmware che consente l’elaborazione dei dati e l’invio degli aggiornamenti tramite mqtt.
2. **Integrazione AWS IoT** 
   - Sviluppo di flussi che gestiscono le richieste di comando dal backend Java e la sincronizzazione dello stato.  
3. **Sviluppo del Backend e Frontend in Java:**  
   - **Backend:** Operazioni CRUD per la gestione degli utenti (salvate su PostgreSQL) e per la programmazione delle operazioni.
   - **Frontend:** Realizzazione di un’interfaccia web in Java che permetta la visualizzazione dello stato dei dispositivi e la configurazione delle automazioni.
4. **Database e Storage:**  
   - **PostgreSQL:** Utilizzato per gestire i dati degli utenti, i log-in, le automazioni e i dati provenienti dai dispositivi.

---

#### 2.2.1 architettura HW-SW
**Flusso di Dati** 
1. Il **sensore di luminosità** invia i dati all'**ESP8266**.  
2. L'ESP8266 trasmette i dati al **AWS IoT Shadow** tramite *mqtt*.
3. Il **backend Java** riceve il messaggio e aggiorna i dati.  
4. Il **frontend Java** visualizza i dati in tempo reale.

**Configurazione Hardware**  
- **Configurazione ESP8266**:  
  - Collegare il motore passo-passo e sensore di luce.  
  - Alimentazione a 5V; abilitare Wi-Fi per la comunicazione MQTT.  
- **Calibrazione del Motore**:  
  - Definire i passi per il movimento del motore.  

**Configurazione AWS IoT**  
1. **Creazione IoT Things**:  
   - Registrare ogni ESP8266 come "Thing" in AWS IoT Core.  
   - Associare certificati per comunicazione MQTT sicura.  
2. **Configurazione Shadow**:  
   - Definire schemi JSON per `reported` (stato attuale) e `desired` (stato target).  

**Backend & Frontend**  
- **Backend Spring Boot**:  
  - API REST per autenticazione utenti, controllo tapparelle e gestione programmi.  
  - Integrazione con PostgreSQL. 
- **Frontend**:  
  - Dashboard interattiva con aggiornamenti in tempo reale.  

**Integrazione Database**  
- **PostgreSQL**:  
  - Tabelle per la gestione utenti e dispositivi.  

---

#### 2.2.2 Tecnologie utilizzate


| **Componente**              | **Tecnologia**                    | **Connessione**              | **Scopo / Descrizione**                                                                                                                                                   |
|-----------------------------|-----------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Microcontrollore**       | ESP8266                           | Wi-Fi                        | Controllo dei dispositivi e raccolta dei dati dai sensori; comunica con aws per l'invio dei dati e il controllo del motore.                                           |                                                                       |                                     |
| **IoT Shadow**      | AWS IoT Shadow              | HTTP                  | Memorizza e sincronizza lo stato desiderato/effettivo dei dispositivi. | 
| **Backend**                 | Java/SpringBoot                  | REST API                     | Gestisce l'autenticazione, la logica API, le comunicazioni MQTT e interagisce con PostgreSQL per la gestione dei dati e degli utenti.                           |
|**RoutineAgent**| Java/SpringBoot | REST API                     | Gestisce le routine basate sull'orario | 
| **Frontend**                | Javascript         | WebSocket/API                | Fornisce un'interfaccia web per il monitoraggio e il controllo interattivo, con aggiornamenti in tempo reale.                                                               |
| **Database1**    | PostgreSQL                        | SQL Queries                  | Gestisce le credenziali degli utenti, i processi di login, registrazione e la gestione dei programmi.                                                                      |
| **Database2**    | PostgreSQL                        | SQL Queries                  | Gestisce le automazioni.     |

---


## 3 Contesto, problematiche da affrontare, motivazione delle scelte progettuali svolte
Abbiamo scelto di utilizzare java per poter programmare con un unico linguaggio e soprattutto del quale avessimo conoscenze pregresse, springBoot è una ottima soluzione per questo tipo di progetti.
La scelta dell'utilizzo di un agente separato con un proprio database per la gestione delle routine ci permette di non sovraccaricare il server principale e poterne garantire uno sviluppo e manutenzione separata secondo la logica dei microservizi.
Javascript è il linguaggio più semplice per la realizzazione di interfacce web.
Tutti i programmi vengono eseguiti su docker per poter avere una gestione migliore dei diversi ambienti, permettere un porting su qualsiasi macchina e garantire una futura scalabilità.



## 4 Validazione e sperimentazione
Il focus sarà incentrato su:
    
La fase di validazione ha lo scopo di verificare che il sistema soddisfi i requisiti funzionali, garantendo affidabilità, performance. I test sono suddivisi in:  
- **Test Funzionali**: Verificare il corretto funzionamento di ciascun caso d'uso.  
- **Test di Integrazione**: Controllare la corretta interazione tra i vari componenti (dispositivo, AWS IoT, backend e frontend).  
- **Test di Performance e Scalabilità**: Valutare la latenza nelle comunicazioni, la capacità di gestione simultanea di più dispositivi e l'efficienza nell'aggiornamento in tempo reale. 


- **Test sul Campo**:  
  - Simulazione delle condizioni di luminosità variabile per verificare la reazione del dispositivo e il corretto invio dei dati. 
  - Verifica del funzionamento del motore passo-passo in risposta ai comandi automatizzati e manuali.
  - gestione corretta dei dati del sensore, per esempio evitare di scambiare istanti di buio dovuti ad fattori accidentali (nuvola che passa per pochi secondi) e quindi implementare controlli o utilizzo di intervalli temporali etc.
- **Test Software**:  
  - **Unit Test**: Validazione delle funzioni individuali del backend Java.  
  - **Integration Test**: Controllo dell'interazione tra ESP8266 e AWS IoT Shadow, verificando la corretta sincronizzazione dei dati.
  - **End-to-End Test**: Simulazione del flusso completo, dall'acquisizione dei dati dal sensore fino alla visualizzazione e controllo tramite l'interfaccia web.
- **Test di Sicurezza**:  
  - Verifica dell'autenticazione tramite PostgreSQL. 


## 5 Manuale Riuso
Il codice è suddiviso in 3 sottocartelle:
  - [Backend](Backend/): sistema in java che gestisce tutte le chiamate REST e la logica delle entità.
  - [Frontend](Frontend/): interfaccia in javascript e html per interazione utente e chiamate api.
  - [RoutineAgent](routineAgent/) : sistema in java per la gestione delle routine basate sull'orario.

All'esterno sono presenti alcuni file utili per la gestione del docker-compose.

### Backend

#### 1. Architettura Generale

Il backend segue un'architettura stratificata tipica delle applicazioni Spring Boot:

* **Controller (Routes):** Espongono le API REST per l'interazione con il frontend o altri client. Gestiscono le richieste HTTP in entrata e restituiscono le risposte.
* **Service:** Contengono la logica di business principale. Coordinano le operazioni tra i repository, altri servizi e componenti esterni (es. MQTT, API esterne).
* **Persistence (Repository, Entities, DTOs):** Gestiscono l'interazione con il database.
    * **Entities:** Rappresentano le tabelle del database (es. `User`, `Home`, `RollerShutter`, `LightSensor`, `Routine`).
    * **Repositories:** Forniscono metodi standard e personalizzati per accedere ai dati tramite JPA (Java Persistence API).
    * **DTOs (Data Transfer Objects):** Oggetti semplici usati per trasferire dati tra i layer, specialmente tra service e controller, per evitare di esporre direttamente le entities.
* **Security:** Gestisce l'autenticazione (JWT) e l'autorizzazione basata sui ruoli e permessi.
* **Config:** Configurazione dell'applicazione, inclusi MQTT e l'importazione dei segreti.
* **Utils:** Classi di utilità generiche (es. gestione JWT, enum per ruoli/permessi).

#### 2. Prerequisiti per il Riuso/Estensione

* **Java Development Kit (JDK):** Versione compatibile con Spring Boot (controllare `build.gradle` o la documentazione Spring Boot per la versione specifica usata).
* **Gradle:** Build tool utilizzato per gestire le dipendenze e compilare il progetto.
* **Database:** PostgreSQL. Le credenziali e l'URL sono configurati in `application.properties`.
* **(Opzionale) Account AWS IoT:** Necessario se si intende riutilizzare o modificare la comunicazione con i dispositivi IoT. Le credenziali specifiche (certificati, endpoint) sono in `application-secrets.yml`.
* **(Opzionale) Routine Agent:** Un servizio esterno (presumibilmente accessibile all'hostname `routineAgent` sulla porta 8081) con cui il backend comunica per gestire le routine temporizzate.

#### 3. Componenti Chiave e Possibilità di Riuso

##### 3.1. Configurazione (`com.hars.config`, `resources`)

* **`MqttConfig.java`:** Configura la connessione al broker AWS IoT MQTT, i canali di input/output (Spring Integration) e le opzioni di connessione sicura (SSL/TLS) usando i certificati forniti.
    * **Riuso:** La logica per stabilire una connessione MQTT sicura con AWS IoT può essere riutilizzata. I parametri (endpoint, ID client, certificati) sono esterni nei file di properties/secrets, rendendo la configurazione flessibile.
    * **Estensione:** Si possono aggiungere nuovi topic di sottoscrizione o pubblicazione modificando le properties e, se necessario, aggiungendo nuovi `MqttPahoMessageDrivenChannelAdapter` o `MessageHandler`.
* **`application.properties`:** Contiene le configurazioni principali come nome dell'applicazione, topic MQTT, URL del database, configurazione JPA/Hibernate.
* **`application-secrets.yml`:** Contiene informazioni sensibili come le chiavi e i certificati AWS IoT. Viene importato da `application.properties`.

##### 3.2. Sicurezza (`com.hars.security`)

* **`SecurityConfig.java`:** Configura Spring Security. Definisce le regole di autorizzazione per le diverse API REST, abilita CORS, disabilita CSRF (comune per API stateless), e configura il `JwtAuthenticationFilter`. Include una regola specifica per permettere l'accesso all'attivazione delle routine solo dall'IP del `routineAgent`.
    * **Riuso:** La configurazione base di Spring Security con JWT è riutilizzabile.
    * **Estensione:** Si possono aggiungere o modificare regole di autorizzazione per nuove API o ruoli. La logica di controllo IP per il `routineAgent` può essere adattata se l'indirizzo o il meccanismo cambiano.
* **`JwtUtil.java`:** Utility per generare, validare ed estrarre informazioni dai token JWT.
    * **Riuso:** Classe riutilizzabile per la gestione standard di JWT. La chiave segreta e la durata sono definite internamente.
* **`JwtAuthenticationFilter.java`:** Filtro Spring Security che intercetta le richieste, estrae il token JWT dall'header `Authorization`, lo valida e imposta l'autenticazione nel contesto di sicurezza.
    * **Riuso:** Filtro standard riutilizzabile in qualsiasi applicazione Spring Security basata su JWT.
* **`UserService.java` (parte `UserDetailsService`):** Implementa l'interfaccia `UserDetailsService` di Spring Security per caricare i dettagli dell'utente (incluso password e ruoli/permessi) dal database durante l'autenticazione.
* **`AuthController.java`:** Controller per la registrazione (`/register`) e l'autenticazione (`/authenticate`) degli utenti.

##### 3.3. Persistenza (`com.hars.persistence`)

* **Entità (`entities` package):** Classi Java annotate con JPA (`@Entity`, `@Table`, `@Id`, `@Column`, relazioni come `@OneToOne`, `@OneToMany`, `@ManyToMany`) che mappano le tabelle del database.
    * **Riuso:** Le definizioni delle entità sono specifiche del dominio HARS.
    * **Estensione:** Si possono aggiungere nuove entità o nuovi campi/relazioni a quelle esistenti. È importante aggiornare la configurazione `ddl-auto` in `application.properties` (es. `update`) per riflettere i cambiamenti nel database all'avvio (con cautela in produzione).
* **Repositories (`repository` package):** Interfacce che estendono `JpaRepository`. Forniscono operazioni CRUD base e permettono di definire query personalizzate (es. `findByUsername`, `findByName`).
    * **Riuso:** Il pattern repository è standard.
    * **Estensione:** Si possono aggiungere nuovi metodi di query seguendo le convenzioni di Spring Data JPA o usando l'annotazione `@Query`.
* **DTOs (`dto` package):** Classi semplici (spesso con `record` interni per definire input specifici) per trasferire dati. Contengono solo i campi necessari per specifiche operazioni, disaccoppiando l'API dalle entità del database.
    * **Riuso:** Specifici del dominio HARS.
    * **Estensione:** Creare nuovi DTO o modificare quelli esistenti quando si aggiungono/modificano API o entità.

##### 3.4. Servizi (`com.hars.services`)

* **Servizi specifici per Entità (es. `HomeService`, `RollerShutterService`, etc.):** Contengono la logica per gestire le operazioni CRUD e altre logiche specifiche per ogni entità (es. `activateRoutine`, `patchOpeningRollerShutter`). Interagiscono con i rispettivi repository e, a volte, con altri servizi (es. MQTT, `OwnershipService`).
    * **Riuso:** La logica è legata al dominio HARS.
    * **Estensione:** Aggiungere nuovi metodi di servizio per nuove funzionalità o modificare quelli esistenti.
* **`OwnershipService.java`:** Gestisce la relazione tra utenti ed entità (chi possiede cosa). Sembra basarsi su un'entità `Ownership` che tiene traccia degli ID delle entità per utente.
    * **Riuso:** Il concetto di ownership può essere riutilizzato, ma l'implementazione attuale che memorizza liste di ID potrebbe non scalare bene e potrebbe essere ripensata (es. usando relazioni dirette tra `User` ed entità o tabelle di join dedicate).
    * **Estensione:** Aggiungere il tracciamento della ownership per nuove entità.
* **`MqttPublisherService.java`:** Servizio per pubblicare messaggi MQTT tramite il `MqttGateway`.
    * **Riuso:** Servizio generico per l'invio di messaggi MQTT.
* **`MqttMessageListener.java`:** Componente che ascolta i messaggi in arrivo sul canale `mqttInboundChannel`. Contiene la logica per processare i messaggi da topic specifici (attualmente implementato per `lightSensor` per triggerare il controllo delle routine).
    * **Riuso:** Il meccanismo di ascolto è standard Spring Integration.
    * **Estensione:** Aggiungere logica nel metodo `processReceivedMessage` per gestire nuovi topic o modificare la gestione di quelli esistenti.
* **`ExternalApiClient.java`:** Client WebClient (reattivo) per comunicare con l'API del `routineAgent` esterno e sincronizzare la creazione/modifica/eliminazione delle routine temporizzate.
    * **Riuso:** Il pattern per creare un client API esterno è riutilizzabile.
    * **Estensione:** Aggiungere metodi per chiamare nuovi endpoint dell'agent o modificare quelli esistenti.

##### 3.5. API Endpoints (`com.hars.routes`)

* **Controller per Entità (es. `HomeController`, `RoutineController`, etc.):** Definiscono gli endpoint REST (usando `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PatchMapping`, `@DeleteMapping`) per interagire con le risorse. Delegano la logica ai servizi corrispondenti. Usano DTO per i body delle richieste/risposte. Implementano il controllo della ownership recuperando l'utente autenticato e filtrando i risultati tramite `OwnershipService`.
    * **Riuso:** La struttura dei controller è standard Spring MVC.
    * **Estensione:** Aggiungere nuovi controller per nuove entità o nuovi endpoint a controller esistenti per nuove operazioni.


### RoutineAgent

#### 1. Panoramica

`routineAgent` è un'applicazione Spring Boot progettata per schedulare ed eseguire routine a orari specifici. Ogni routine attivata fa scattare una chiamata API verso un servizio backend esterno. L'applicazione gestisce le routine (creazione, modifica, cancellazione) tramite API REST e utilizza uno scheduler dinamico per pianificare le esecuzioni giornaliere.

**Tecnologie Principali:**

* Java
* Spring Boot 3.4.4 (basato su `HELP.md`)
* Spring Web (per API REST)
* Spring Data JPA (con Hibernate) per l'interazione con il database
* PostgreSQL (come database)
* Spring TaskScheduler (per la pianificazione delle routine)
* Gradle (per la gestione delle dipendenze e build)
* WebClient (per chiamate API esterne)

#### 2. Architettura

L'applicazione segue un'architettura a layer tipica di Spring Boot:

* **Controller (`routes`):** Gestisce le richieste HTTP in entrata per l'API REST.
* **Service (`services`):** Contiene la logica di business principale.
    * `RoutineAgentService`: Logica per la gestione delle routine (CRUD).
    * `DynamicRoutineSchedulerService`: Logica per la schedulazione dinamica delle routine.
    * `ExternalApiClient`: Logica per la comunicazione con l'API backend esterna.
* **Persistence (`persistence`):** Gestisce l'interazione con il database.
    * **Entities (`entities`):** Definiscono le strutture dati mappate sulle tabelle del database (`Routine`, `ScheduledTaskDefinition`).
    * **Repositories (`repository`):** Interfacce Spring Data JPA per l'accesso ai dati (`RoutineRepository`, `ScheduledTaskRepository`).
* **Configurazione:**
    * `RoutineAgentApplication`: Classe principale di avvio, abilita la schedulazione (`@EnableScheduling`) e configura un bean `Clock`.
    * `application.properties`: File di configurazione per porta server, connessione al database, e altre impostazioni Spring.

#### 3. Componenti Chiave

##### 3.1. Gestione Routine (`Routine` entity, `RoutineRepository`, `RoutineAgentService`, `RoutineController`)

* **`Routine.java`:** Entità JPA che rappresenta una singola routine. Contiene:
    * `id`: Identificativo univoco (Long).
    * `name`: Nome della routine (String).
    * `actionTime`: Orario di esecuzione giornaliero (LocalTime).
* **`RoutineRepository.java`:** Interfaccia per accedere ai dati delle `Routine` nel database.
* **`RoutineAgentService.java`:** Servizio che implementa le operazioni CRUD sulle routine, interagendo con il `RoutineRepository`.
* **`RoutineController.java`:** Espone le API REST per gestire le routine (vedi sezione API).

##### 3.2. Schedulazione (`DynamicRoutineSchedulerService`)

* Questo servizio è il cuore della schedulazione.
* **Metodo `scheduleDailyRoutines()`:**
    * Viene eseguito ogni 5 minuti (configurato con `@Scheduled(cron = "0 */5 * * * ?")`).
    * Cancella tutti i task precedentemente schedulati (`cancelAllTasks()`).
    * Recupera tutte le `Routine` dal database (`RoutineRepository.findAll()`).
    * Per ogni routine con un `actionTime` definito:
        * Calcola l'orario di esecuzione per il giorno corrente (`today.atTime(actionTime)`).
        * Se l'orario è futuro rispetto all'istante attuale:
            * Schedula l'esecuzione della chiamata API (`scheduleApiCall()`) per quell'orario usando `TaskScheduler`.
* **Gestione Task:** Mantiene una mappa (`scheduledTasks`) dei task attivi (`ScheduledFuture<?>`) per permetterne la cancellazione individuale (`cancelTask()`) o collettiva (`cancelAllTasks()`).
* **Gestione Fuso Orario:** Utilizza un `Clock` bean (configurato in `RoutineAgentApplication` per `Europe/Rome`) per gestire correttamente date e orari.
* **Pulizia:** Cancella tutti i task rimanenti allo spegnimento dell'applicazione (`@PreDestroy`, `onShutdown()`).

#### 3.3. Chiamata API Esterna (`ExternalApiClient`)

* Utilizza `WebClient` per effettuare chiamate asincrone non bloccanti.
* Configurato per puntare al base URL `http://backend:8080`.
* Il metodo `callApi(String routineName, Long routineId)` esegue una richiesta POST all'endpoint `/api/entities/routine/activate/{routineId}` del backend quando un task schedulato viene eseguito.
* Gestisce e logga successi ed errori della chiamata API.

#### 3.4. Configurazione (`application.properties`)

* `spring.application.name`: Nome dell'applicazione (`routineAgent`).
* `server.port`: Porta HTTP su cui l'applicazione ascolta (`8081`).
* `spring.datasource.url`: URL JDBC per il database PostgreSQL (`jdbc:postgresql://db:5433/ROUTINEAGENT`). Assume un host chiamato `db` sulla porta `5433`.
* `spring.datasource.username`: Utente database (`admin`).
* `spring.datasource.password`: Password database (`ESIT2024`).
* `spring.datasource.driver-class-name`: Driver JDBC PostgreSQL.
* `spring.jpa.database-platform`: Dialetto Hibernate per PostgreSQL.
* `spring.jpa.hibernate.ddl-auto`: Strategia di generazione/aggiornamento dello schema (`update`). Aggiorna lo schema all'avvio se necessario.

#### 4. API REST (`RoutineController`)

Base path: `/api/agent/routine`

* **`POST /create`**
    * **Descrizione:** Crea una nuova routine.
    * **Request Body:** Oggetto JSON rappresentante la `Routine` (es. `{"id": 1, "name": "RoutineMattina", "actionTime": "08:00:00"}`).
    * **Risposta Successo (200 OK):** `{"Response" : "Routines saved successfully!"}`
    * **Risposta Errore (500 Internal Server Error):** Dettagli dell'eccezione.
* **`DELETE /delete/{id}`**
    * **Descrizione:** Cancella una routine esistente tramite il suo ID.
    * **Path Variable:** `id` (Long) - L'ID della routine da cancellare.
    * **Risposta Successo (200 OK):** `"Routine deleted successfully!"`
    * **Risposta Errore (500 Internal Server Error):** `{"Error" : "Cannot Delete" , " StackTrace" : "..."}`
* **`PATCH /patch/name/{id}`**
    * **Descrizione:** Modifica il nome di una routine esistente.
    * **Path Variable:** `id` (Long) - L'ID della routine da modificare.
    * **Request Body:** Stringa contenente il nuovo nome (es. `"NuovoNomeRoutine"`).
    * **Risposta Successo (200 OK):** `"Routine Modified successfully"`
    * **Risposta Errore (500 Internal Server Error):** `{"Error" : "Cannot Modify name" , " StackTrace" : "..."}`
* **`PATCH /patch/actionTime/{id}`**
    * **Descrizione:** Modifica l'orario di esecuzione (`actionTime`) di una routine esistente.
    * **Path Variable:** `id` (Long) - L'ID della routine da modificare.
    * **Request Body:** Stringa rappresentante il nuovo orario nel formato `HH:mm:ss` (es. `"14:30:00"`).
    * **Risposta Successo (200 OK):** `""` (Stringa vuota)
    * **Risposta Errore (500 Internal Server Error):** `{"Error" : "Cannot Modify action time" , " StackTrace" : "..."}`


### Frontend

#### 1. Struttura HTML e Componenti UI

I file HTML definiscono la struttura delle pagine principali:

* **`login.html` e `register.html`:**
    * **Scopo:** Forniscono form semplici per l'autenticazione e la registrazione degli utenti.
    * **Struttura:** Utilizzano Bootstrap 5 per il layout responsivo (griglia, `d-flex`, `justify-content-center`, `align-items-center`). Contengono un form standard (`<form>`) con campi per username/password (`<input>`), etichette (`<label>`) e un pulsante di invio (`<button type="submit">`). Includono link per navigare tra le due pagine.
    * **Riuso:** La struttura base del form centrato verticalmente e orizzontalmente può essere riutilizzata per altre pagine con form semplici. I singoli campi del form (`div.mb-3`) sono componenti standard di Bootstrap riutilizzabili.
* **`dashboard.html`:**
    * **Scopo:** Pagina principale dopo il login, mostra contenuti diversi per utenti standard e amministratori.
    * **Struttura:** Include un pulsante di logout. Contiene due sezioni principali (`#admin-section` e `#user-section`) la cui visibilità è gestita via JavaScript. L'admin section è più complessa e suddivisa ulteriormente per gestire case, sensori globali, tapparelle globali, e routine. Utilizza liste (`<ul>`, `.list-group`) per visualizzare dati e form (`<form>`) per aggiungere/modificare entità. Include elementi dinamici come select (`<select>`) e liste di checkbox (`div.dynamic-list-container`) popolate via JavaScript.
    * **Riuso:**
        * **Layout Sezioni:** Il pattern di avere sezioni separate per ruoli diversi (`#admin-section`, `#user-section`) è riutilizzabile.
        * **Liste Dinamiche:** Le liste (`.list-group`) popolate dinamicamente (es. `#admin-homes-list`, `#Routines-list`) sono un pattern comune. Lo stile CSS associato può essere riutilizzato per altre liste.
        * **Form Modali/Nascosti:** L'uso di form nascosti (`#edit-home-form`, `#admin-edit-light-sensor`, `#Routines-form`) che vengono mostrati su richiesta è un pattern riutilizzabile per operazioni di modifica o aggiunta senza cambiare pagina.
        * **Contenitori Dinamici:** I `div.dynamic-list-container` usati per le checkbox delle tapparelle nei form di modifica casa e routine sono riutilizzabili per visualizzare liste selezionabili.

#### 2. Stili CSS (`styles.css`)

* **Scopo:** Definisce l'aspetto visuale dell'applicazione, sovrascrivendo e personalizzando Bootstrap.
* **Tema:** Tema scuro (`background-color: #1c1c1c`, `color: #ffffff`).
* **Componenti Stilizzati:**
    * **Container:** Stile personalizzato con bordo gradiente (`.container`).
    * **Form:** Sfondo scuro (`#2a2a2a`), etichette bianche e in grassetto (`.form-label`), input e select con sfondo scuro (`#444`) e testo bianco.
    * **Bottoni:** Stili personalizzati per diversi tipi di azioni (`.btn-danger`, `.btn-primary`, `.btn-warning`, `.btn-info`, `.btn-secondary`, `.btn-outline-success`). Tutti i bottoni sono in grassetto.
    * **Liste:** Stili specifici per gli elementi delle liste (`.list-group-item`) con sfondi scuri e bordi definiti. Stili hover per le liste admin (`.admin-home-item:hover`). Stili per liste con scroll (`.global-list-container`, `.dynamic-list-container`).
    * **Spinner:** Animazione di caricamento (`.spinner`).
* **Riuso:**
    * L'intero tema scuro può essere applicato ad altre applicazioni web.
    * Le classi CSS personalizzate per bottoni, form e liste possono essere estratte e riutilizzate.
    * Il layout responsivo basato su Bootstrap è intrinsecamente riutilizzabile.

#### 3. Logica JavaScript

* **`api.js`:**
    * **Scopo:** Centralizza la comunicazione con l'API backend e gestisce l'autenticazione iniziale (login) e l'hashing delle password.
    * **Funzioni Chiave:**
        * `sha256(message)`: Funzione asincrona per calcolare l'hash SHA-256 di una stringa (usata per le password prima dell'invio). Riutilizzabile ovunque sia necessario hashare dati nel frontend.
        * `fetchApi(path, method, body, extraHeaders, sendAuthToken)`: Funzione wrapper per `fetch`. Gestisce l'aggiunta automatica del token JWT (se `sendAuthToken` è `true`), l'impostazione degli header, la serializzazione del body in JSON e la gestione base degli errori HTTP e del parsing della risposta (JSON o testo). **Altamente riutilizzabile** per qualsiasi interazione con l'API backend.
        * **Gestore Login:** Il listener `DOMContentLoaded` in `api.js` gestisce specificamente l'invio del form di login (`#loginForm`), chiamando `fetchApi` per `/api/auth/authenticate` senza inviare il token, e salvando il JWT ricevuto in `localStorage`.
    * **Riuso:** `fetchApi` è il componente più critico e riutilizzabile per interagire con il backend. `sha256` è una utility generica. Il gestore del login è specifico ma il pattern (leggere form, hashare password, chiamare API, salvare token, reindirizzare) è comune.
* **`auth.js` / `register.js`:**
    * **Scopo:** Gestiscono l'autenticazione post-login, il logout e la registrazione.
    * **Funzioni Chiave (`auth.js`):**
        * `checkAuthentication()`: Controlla la presenza del JWT in `localStorage` e reindirizza al login se assente. Usato all'inizio del caricamento delle pagine protette (es. `dashboard.js`). Riutilizzabile per proteggere rotte/pagine.
        * `getUserRole()`: Decodifica il JWT per estrarre il ruolo dell'utente. Riutilizzabile per controlli basati sul ruolo.
        * `isAdmin()`: Funzione helper che usa `getUserRole()` per verificare se l'utente è admin. Riutilizzabile.
        * `logout()`: Rimuove il JWT da `localStorage` e reindirizza al login. Associato al pulsante Logout. Riutilizzabile.
    * **Funzioni Chiave (`register.js`):** Gestisce l'invio del form di registrazione (`#registerForm`), chiama `sha256` e poi `fetchApi` per `/api/auth/register` (senza token). Riutilizzabile se la logica di registrazione è simile.
* **`dashboard.js`:**
    * **Scopo:** Orchestrazione della pagina dashboard.
    * **Funzioni Chiave:**
        * **Listener `DOMContentLoaded`:** Esegue `checkAuthentication`, collega il listener per il `logout`, chiama `displayDashboardBasedOnRole` e `attachFormListeners`. Questo pattern di inizializzazione è riutilizzabile per pagine complesse.
        * `displayDashboardBasedOnRole()`: Usa `isAdmin()` per mostrare/nascondere le sezioni `#admin-section`/`#user-section` e chiama le funzioni di caricamento dati appropriate (`loadAdminHomes` o `loadUserHomeDetails`). Riutilizzabile per UI basate sui ruoli.
        * `attachFormListeners()`: Collega i gestori di eventi (`submit`) ai vari form presenti nel dashboard (aggiunta/modifica casa, aggiunta sensore/tapparella globale, modifica sensore/tapparella admin, salvataggio routine, creazione/modifica sensore utente). Centralizzare i listener è una buona pratica riutilizzabile.
* **`admin.js`:**
    * **Scopo:** Contiene tutta la logica specifica per la vista Amministratore nel dashboard.
    * **Funzionalità Principali:**
        * **Gestione Case:** `loadAdminHomes`, `addHome`, `deleteHome`, `showEditHomeForm`, `cancelEditHome`, `submitEditHome`. Gestiscono il caricamento della lista, aggiunta, eliminazione e modifica delle case, inclusa l'assegnazione di proprietario, sensore e tapparelle (con caricamento dinamico di utenti/sensori/tapparelle disponibili tramite funzioni helper come `loadUsersForOwnerSelect`, `loadAvailableSensorsForEditHome`, `loadAvailableShuttersForEditHome`).
        * **Gestione Sensori (Admin):** `showSensorsForHome`, `hideSensorsForHome`, `adminLoadLightSensors` (carica sensori *per una casa specifica*), `adminShowEditSensorForm`, `cancelAdminEditSensor`, `adminSubmitEditSensor`, `adminDeleteLightSensor`.
        * **Gestione Tapparelle (Admin):** `showShuttersForHome`, `hideShuttersForHome`, `adminLoadRollerShutters` (carica tapparelle *per una casa specifica*), `adminShowEditShutterForm`, `cancelAdminEditShutter`, `adminSubmitEditShutter`, `adminDeleteRollerShutter`.
        * **Gestione Globale (Sensori/Tapparelle):** `loadGlobalLightSensors`, `globalCreateLightSensor`, `globalShowEditLightSensorForm`, `globalDeleteLightSensor` (e funzioni analoghe per le tapparelle). Permettono di creare/modificare/eliminare entità a livello di sistema, indipendentemente dalle case.
        * **Gestione Routine (Navigazione):** `showAllRoutinesView` per mostrare la sezione routine (il caricamento è in `routines.js`).
    * **Riuso:** Le funzioni sono specifiche per l'admin ma i pattern sono riutilizzabili: caricare liste, mostrare/nascondere form di modifica, gestire invio form con chiamate API (GET, POST, PATCH, DELETE), popolare select/checkbox dinamicamente. Le funzioni di gestione globale sono riutilizzabili se si ha un concetto simile di entità globali.
* **`user.js`:**
    * **Scopo:** Gestisce il caricamento dei dati per la vista Utente standard nel dashboard.
    * **Funzioni Chiave:** `loadUserHomeDetails`. Chiama l'API `/api/entities/home/` per ottenere la casa (o le case) dell'utente e poi invoca le funzioni di caricamento specifiche per tapparelle (`loadRollerShutters`), sensori (`loadLightSensors`) e routine (`loadRoutines`), potenzialmente passando l'ID della casa se necessario per filtrare (anche se le funzioni chiamate potrebbero non usare l'ID passato). Gestisce il caso in cui l'utente non ha case assegnate.
    * **Riuso:** Il pattern di caricare l'entità principale (casa) e poi le entità correlate è comune e riutilizzabile.
* **`sensors.js`:**
    * **Scopo:** Gestisce la logica relativa ai sensori di luminosità per la vista utente (e alcune funzioni usate anche dall'admin, anche se l'admin ha le sue specifiche in `admin.js`).
    * **Funzioni Chiave:** `loadLightSensors` (carica e visualizza sensori, potenzialmente filtrati per casa), `createLightSensor` (gestisce form aggiunta), `showEditSensorForm`, `cancelEditSensor`, `submitEditSensor` (gestisce form modifica), `deleteLightSensor`.
    * **Riuso:** Le funzioni CRUD (Create, Read, Update, Delete) per i sensori sono un pattern standard. La logica per popolare/aggiornare la UI è riutilizzabile.
* **`shutters.js`:**
    * **Scopo:** Gestisce la logica relativa alle tapparelle per la vista utente.
    * **Funzioni Chiave:** `loadRollerShutters` (carica lista), `selectRollerShutter` (gestisce selezione e mostra controlli), `adjustRollerShutterOpening` (invia PATCH per +/- 10%), `openAllShutters`, `closeAllShutters` (invia PATCH a 100% o 0% per tutte le tapparelle).
    * **Riuso:** Funzioni CRUD e di controllo per le tapparelle. Il concetto di selezionare un elemento da una lista per abilitare controlli specifici è riutilizzabile. Le funzioni "Open/Close All" sono specifiche ma il pattern di iterare su una lista ed eseguire un'azione API per ciascuno è riutilizzabile.
* **`routines.js`:**
    * **Scopo:** Gestisce la logica per le routine (visualizzazione, creazione, eliminazione).
    * **Funzioni Chiave:** `loadRoutines` (carica e visualizza tutte le routine accessibili), `loadSensorsForRoutineForm`, `loadShuttersForRoutineForm` (popolano dinamicamente le select/checkbox nel form routine), `toggleTriggerOptions` (mostra/nasconde campi form in base al tipo di trigger), `showRoutinesForm` (resetta e mostra il form), `cancelRoutines` (nasconde e resetta il form), `saveRoutines` (gestisce l'invio del form per creare routine via API POST), `deleteRoutines`.
    * **Riuso:** Funzioni CRUD per le routine. Il caricamento dinamico di opzioni nei form (`loadSensorsForRoutineForm`, `loadShuttersForRoutineForm`) è un pattern riutilizzabile. La gestione della visibilità condizionale dei campi form (`toggleTriggerOptions`) è comune.

#### 4. Dipendenze

* **Bootstrap 5:** Usato pesantemente per layout, componenti UI e stili base. Il riutilizzo dipende dalla disponibilità di Bootstrap nel nuovo contesto.
* **API Backend:** Tutto il codice JavaScript che interagisce con le entità (case, sensori, tapparelle, routine, utenti) dipende strettamente dalla struttura e dagli endpoint dell'API backend definita in `api.js` e usata in tutti gli altri file JS. Qualsiasi riutilizzo richiede un backend compatibile o un adattamento significativo del codice `fetchApi` e delle chiamate specifiche.



