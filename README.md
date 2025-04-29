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

#### 1. Introduzione

Questo progetto è un'interfaccia web frontend progettata per interagire con un sistema backend di gestione smart home. Consente agli utenti di:
* Autenticarsi (registrarsi e accedere).
* Gestire "Case" (Homes).
* Gestire dispositivi globali come sensori di luminosità e tapparelle (Roller Shutters).
* Associare sensori e tapparelle a case specifiche.
* Controllare lo stato delle tapparelle (apertura/chiusura percentuale, apri/chiudi tutto).
* Creare, visualizzare ed eliminare "Routine" automatiche basate su orari o livelli di luminosità per controllare le tapparelle.
* Visualizzare lo stato dei sensori di luminosità associati.

L'interfaccia utilizza HTML per la struttura, CSS (principalmente Bootstrap con stili personalizzati) per l'aspetto, e JavaScript per la logica, l'interattività e la comunicazione con un API backend.

#### 2. Prerequisiti

Per riutilizzare o sviluppare questo frontend, sono necessarie le seguenti conoscenze e strumenti:

* **Conoscenze di Base:**
    * HTML
    * CSS
    * JavaScript (incluse chiamate asincrone - `async/await`, `fetch`)
* **Strumenti:**
    * Un browser web moderno (es. Chrome, Firefox, Edge)
    * Un editor di testo o IDE (es. Visual Studio Code, Sublime Text)
    * (Opzionale ma consigliato) Un server web locale (come Live Server per VS Code o un server Python/Node.js semplice) per servire i file ed evitare problemi legati a CORS durante lo sviluppo.
* **Backend API:** Il frontend è progettato per comunicare con un'API backend specifica. È **fondamentale** avere accesso a questa API o a una sua implementazione compatibile affinché il frontend funzioni correttamente. L'URL base dell'API è attualmente configurato in `js/auth.js`.

#### 3. Installazione e Setup

Il setup del frontend è relativamente semplice:

1.  **Ottenere i File:** Scarica o copia tutti i file e le cartelle del progetto (`dashboard.html`, `login.html`, `register.html`, la cartella `js/` con i suoi file, la cartella `css/` con `styles.css`).
2.  **Struttura Cartelle:** Mantieni la struttura delle cartelle originale:
    ```
    /Frontend
    |-- dashboard.html
    |-- login.html
    |-- register.html
    |-- /css
    |   |-- styles.css
    |-- /js
    |   |-- auth.js
    |   |-- dashboard.js
    |   |-- register.js
    |   |-- routines.js
    |   |-- shutters.js
    ```
3.  **Configurare l'URL dell'API:**
    * Apri il file `js/auth.js`.
    * Trova la costante `API_BASE_URL`.
    * Modifica il valore (attualmente `"http://localhost:8080"`) con l'URL corretto del tuo backend API.
4.  **Esecuzione:**
    * **Senza Server Web:** Puoi aprire direttamente il file `login.html` o `register.html` nel tuo browser. Tuttavia, potresti incontrare problemi con le chiamate API a seconda della configurazione del browser e dell'API (CORS).
    * **Con Server Web Locale (Consigliato):** Avvia un server web locale nella directory `Frontend`. Accedi all'applicazione tramite l'URL fornito dal server (es. `http://localhost:5500/login.html` o `http://127.0.0.1:8000/login.html`).

#### 4. Architettura Generale

* **Pagine Multiple:** Sebbene abbia funzionalità dinamiche tipiche di una Single Page Application (SPA), il progetto utilizza file HTML separati per le sezioni principali: Login, Registrazione e Dashboard. La navigazione tra queste pagine avviene tramite reindirizzamenti standard del browser (`window.location.href`).
* **JavaScript Modulare (per Funzionalità):** Il codice JavaScript è suddiviso ### Frontend Gestione Smart Home - Manuale di Riuso

#### 1. Introduzione

Questo progetto è un'interfaccia web frontend progettata per interagire con un sistema backend di gestione smart home. Consente agli utenti di:
* Autenticarsi (registrarsi e accedere).
* Gestire "Case" (Homes), che sembrano essere raggruppamenti logici di dispositivi.
* Gestire dispositivi globali come sensori di luminosità e tapparelle (Roller Shutters).
* Associare sensori e tapparelle a case specifiche.
* Controllare lo stato delle tapparelle (apertura/chiusura percentuale, apri/chiudi tutto).
* Creare, visualizzare ed eliminare "Routine" automatiche basate su orari o livelli di luminosità per controllare le tapparelle.
* Visualizzare lo stato dei sensori di luminosità associati.

L'interfaccia utilizza HTML per la struttura, CSS (principalmente Bootstrap con stili personalizzati) per l'aspetto, e JavaScript vanilla per la logica, l'interattività e la comunicazione con un API backend.

#### 2. Prerequisiti

Per riutilizzare o sviluppare questo frontend, sono necessarie le seguenti conoscenze e strumenti:

* **Conoscenze di Base:**
    * HTML
    * CSS
    * JavaScript (incluse chiamate asincrone - `async/await`, `fetch`)
* **Strumenti:**
    * Un browser web moderno (es. Chrome, Firefox, Edge)
    * Un editor di testo o IDE (es. Visual Studio Code, Sublime Text)
    * (Opzionale ma consigliato) Un server web locale (come Live Server per VS Code o un server Python/Node.js semplice) per servire i file ed evitare problemi legati a CORS durante lo sviluppo.
* **Backend API:** Il frontend è progettato per comunicare con un'API backend specifica. È **fondamentale** avere accesso a questa API o a una sua implementazione compatibile affinché il frontend funzioni correttamente. L'URL base dell'API è attualmente configurato in `js/auth.js`.

#### 3. Installazione e Setup

Il setup del frontend è relativamente semplice:

1.  **Ottenere i File:** Scarica o copia tutti i file e le cartelle del progetto (`dashboard.html`, `login.html`, `register.html`, la cartella `js/` con i suoi file, la cartella `css/` con `styles.css`).
2.  **Struttura Cartelle:** Mantieni la struttura delle cartelle originale:
    ```
    /Frontend
    |-- dashboard.html
    |-- login.html
    |-- register.html
    |-- /css
    |   |-- styles.css
    |-- /js
    |   |-- auth.js
    |   |-- dashboard.js
    |   |-- register.js
    |   |-- routines.js
    |   |-- shutters.js
    ```
3.  **Configurare l'URL dell'API:**
    * Apri il file `js/auth.js`.
    * Trova la costante `API_BASE_URL`.
    * Modifica il valore (attualmente `"http://localhost:8080"`) con l'URL corretto del tuo backend API.
4.  **Esecuzione:**
    * **Senza Server Web:** Puoi aprire direttamente il file `login.html` o `register.html` nel tuo browser. Tuttavia, potresti incontrare problemi con le chiamate API a seconda della configurazione del browser e dell'API (CORS).
    * **Con Server Web Locale (Consigliato):** Avvia un server web locale nella directory `Frontend`. Accedi all'applicazione tramite l'URL fornito dal server (es. `http://localhost:5500/login.html` o `http://127.0.0.1:8000/login.html`).

#### 4. Architettura Generale

* **Pagine Multiple:** Il progetto utilizza file HTML separati per le sezioni principali: Login, Registrazione e Dashboard. La navigazione tra queste pagine avviene tramite reindirizzamenti standard del browser (`window.location.href`).
* **JavaScript Modulare (per Funzionalità):** Il codice JavaScript è suddiviso in file basati sulla funzionalità principale che gestiscono:
    * `auth.js`: Autenticazione, gestione token JWT, funzione `fetchApi` per le chiamate backend.
    * `register.js`: Logica specifica per il form di registrazione.
    * `dashboard.js`: Logica principale della dashboard, gestione case, gestione dispositivi globali, caricamento dati iniziali, gestione form di modifica.
    * `shutters.js`: Logica per il controllo delle tapparelle (selezione, aggiustamenti, apri/chiudi tutto).
    * `routines.js`: Logica per la gestione delle routine (creazione, visualizzazione, eliminazione, gestione form).
* **Interazione con API:** Tutta la comunicazione con il backend avviene tramite la funzione `fetchApi` in `js/auth.js`. Questa funzione centralizza la gestione degli header (incluso il token JWT per le richieste autenticate), la gestione degli errori HTTP e la gestione delle risposte (JSON o testo).
* **Styling:** Utilizza Bootstrap 5 (caricato da CDN) per la struttura di base, il layout responsive e i componenti. Un file `css/styles.css` personalizza l'aspetto con un tema scuro e stili specifici per gli elementi dell'interfaccia.
* **Gestione dello Stato:** Lo stato dell'applicazione (dati su case, dispositivi, routine) viene recuperato dall'API al caricamento della pagina o a seguito di azioni dell'utente. 
Lo stato di autenticazione è gestito tramite un token JWT memorizzato nel `localStorage` del browser.

#### 5. Componenti Chiave e Funzionalità

Vediamo nel dettaglio i diversi moduli e le loro responsabilità:

* **Autenticazione (`login.html`, `register.html`, `js/auth.js`, `js/register.js`)**
    * **Registrazione:** Il file `register.html` contiene il form. `js/register.js` gestisce l'invio del form, chiama la funzione `sha256` (da `auth.js`) per l'hashing della password e invia i dati all'endpoint `/api/auth/register` tramite `fetchApi`. In caso di successo, reindirizza alla pagina di login.
    * **Login:** `login.html` contiene il form. `js/auth.js` gestisce l'invio, esegue l'hashing della password e invia le credenziali all'endpoint `/api/auth/authenticate`. Se l'API restituisce un token JWT, questo viene salvato nel `localStorage` e l'utente viene reindirizzato alla `dashboard.html`.
    * **Protezione Pagine:** La funzione `checkAuthentication` in `auth.js` viene chiamata all'inizio del caricamento della `dashboard.js`. Controlla la presenza del token JWT nel `localStorage`. Se manca, reindirizza l'utente a `login.html`.
    * **Logout:** Il pulsante Logout nella dashboard chiama la funzione `logout` in `auth.js`, che rimuove il token JWT dal `localStorage` e reindirizza a `login.html`.
    * **`fetchApi`:** Funzione centrale in `auth.js` per tutte le chiamate API. Aggiunge automaticamente l'header `Authorization: Bearer <token>` se un token esiste e `sendAuthToken` è `true`. Gestisce errori HTTP e parsing delle risposte.

* **Dashboard (`dashboard.html`, `js/dashboard.js`)**
    * **Layout:** `dashboard.html` definisce la struttura principale usando contenitori e sezioni Bootstrap. Include aree per la gestione delle case, dei dispositivi globali, delle routine e sezioni nascoste che vengono mostrate dinamicamente per la modifica dei dettagli della casa o la gestione dei dispositivi associati.
    * **Caricamento Dati Iniziale:** All'evento `DOMContentLoaded`, `dashboard.js` esegue `checkAuthentication`, collega i listener ai form/pulsanti e chiama le funzioni per caricare i dati iniziali: `loadHomes`, `loadGlobalLightSensors`, `loadGlobalRollerShutters`, `loadRoutines`.
    * **Gestione Case:**
        * `loadHomes`: Recupera l'elenco delle case da `/api/entities/home/` e le visualizza in una lista, aggiungendo pulsanti per Modifica Dettagli, Elimina e Gestisci Tapparelle.
        * `addHome`: Gestisce il form per aggiungere una nuova casa, inviando una POST a `/api/entities/home/create`.
        * `showEditHomeForm`: Nasconde le sezioni principali e mostra un form precompilato per modificare i dettagli di una casa specifica. Recupera i dettagli attuali della casa (sensore e tapparelle associate) e carica gli elenchi di sensori e tapparelle disponibili per l'associazione nei rispettivi select e checkbox. Utilizza `loadAvailableSensorsForEditHome` e `loadAvailableShuttersForEditHome`.
        * `submitEditHome`: Gestisce il salvataggio delle modifiche alla casa. Confronta i valori nuovi con quelli originali (memorizzati nel `dataset` del form) ed esegue chiamate PATCH separate e specifiche solo per i campi modificati (nome, sensore, tapparelle) agli endpoint `/api/entities/home/patch/name/{id}`, `/api/entities/home/patch/lightSensor/{id}`, `/api/entities/home/patch/rollerShutters/{id}`. L'associazione avviene inviando il nome del dispositivo.
        * `deleteHome`: Chiede conferma ed esegue una DELETE a `/api/entities/home/delete/{id}`.
        * `showShuttersForHome`: Mostra una sezione dedicata alla gestione delle tapparelle associate a una specifica casa, nascondendo le altre sezioni principali. Chiama `loadHomeShuttersForManagement`.
        * `loadHomeShuttersForManagement`: Carica e visualizza solo le tapparelle associate alla casa selezionata, recuperandole da `/api/entities/rollerShutter/` e filtrandole (o recuperando i dettagli della casa per ottenere i nomi delle tapparelle associate). Include controlli per selezionare una tapparella e pulsanti per eliminarla (chiamando `globalDeleteRollerShutter`).
        * `hideShuttersForHome`: Nasconde la sezione di gestione tapparelle e ripristina la vista principale.
    * **Gestione Dispositivi Globali:**
        * `loadGlobalLightSensors`, `loadGlobalRollerShutters`: Caricano e visualizzano elenchi di tutti i sensori/tapparelle disponibili globalmente dagli endpoint `/api/entities/lightSensor/` e `/api/entities/rollerShutter/`, aggiungendo pulsanti Modifica (nome) ed Elimina per ciascuno.
        * `globalCreateLightSensor`, `globalCreateRollerShutter`: Gestiscono i form per aggiungere nuovi dispositivi globali, inviando POST a `/api/entities/lightSensor/create` e `/api/entities/rollerShutter/create`.
        * `globalShowEditLightSensorForm`, `globalShowEditRollerShutterForm`: Implementano la modifica *inline* del nome. Sostituiscono il nome del dispositivo con un campo input e pulsanti Salva/Annulla direttamente nell'elemento della lista. Il salvataggio invia una PATCH a `/api/entities/lightSensor/patch/name/{id}` o `/api/entities/rollerShutter/patch/name/{id}`.
        * `globalDeleteLightSensor`, `globalDeleteRollerShutter`: Chiedono conferma ed eseguono DELETE agli endpoint `/api/entities/lightSensor/delete/{id}` o `/api/entities/rollerShutter/delete/{id}`.

* **Controllo Tapparelle (`js/shutters.js`)**
    * **Selezione:** `selectRollerShutter` viene chiamata quando si clicca su una tapparella nelle liste di controllo o gestione. Memorizza l'ID e il nome della tapparella selezionata in variabili globali (`selectedRollerShutterId`, `selectedRollerShutterName`), aggiorna il testo di stato e aggiunge la classe `active` all'elemento della lista selezionato.
    * **Aggiustamento (+/- 10%):** `adjustRollerShutterOpening` legge lo stato di apertura corrente dall'elemento della lista attivo (o dallo stato), calcola il nuovo valore (assicurandosi che rimanga tra 0 e 100) e invia una PATCH all'endpoint `/api/entities/rollerShutter/patch/opening/{id}` con il *delta* (la variazione, +10 o -10) nel payload `{ "value": delta }`. Aggiorna l'interfaccia.
    * **Apri/Chiudi Tutto:** `openAllShutters` e `closeAllShutters` recuperano lo stato di *tutte* le tapparelle da `/api/entities/rollerShutter/`. Calcolano il delta necessario per portare ciascuna tapparella rispettivamente a 100% o 0% e inviano chiamate PATCH individuali (con il delta calcolato) solo per quelle che necessitano di essere modificate. Usano `Promise.all` per eseguire le chiamate in parallelo e aggiornano l'interfaccia ottimisticamente.

* **Gestione Routine (`js/routines.js`)**
    * **Visualizzazione:** `loadRoutines` recupera tutte le routine da `/api/entities/routine/` e le visualizza in una lista. Per ogni routine, formatta le informazioni sul trigger (ora o luminosità con sensore, condizione e soglia) e sull'azione (percentuale di apertura target e tapparelle coinvolte). Aggiunge pulsanti per Modifica Nome ed Elimina.
    * **Modifica Nome (Inline):** `globalShowEditRoutineForm` funziona in modo simile alle funzioni di modifica inline per i dispositivi globali, sostituendo il nome con un input e pulsanti Salva/Annulla. Il salvataggio invia una PATCH a `/api/entities/routine/patch/name/{id}`.
    * **Form Creazione:**
        * `showRoutinesForm`: Mostra il form di creazione/modifica (attualmente solo creazione), lo resetta, imposta i valori predefiniti e chiama `loadSensorsForRoutineForm` e `loadShuttersForRoutineForm` per popolare le opzioni dinamiche.
        * `loadSensorsForRoutineForm`: Popola il dropdown dei sensori (per trigger luminosità) recuperando i dati da `/api/entities/lightSensor/`.
        * `loadShuttersForRoutineForm`: Popola l'area con le checkbox delle tapparelle target recuperando i dati da `/api/entities/rollerShutter/`.
        * `toggleTriggerOptions`: Mostra/nasconde le opzioni specifiche per il trigger (luminosità vs tempo) in base alla selezione nel dropdown `triggerType` e imposta/rimuove l'attributo `required` sui campi pertinenti.
        * `cancelRoutines`: Nasconde e resetta il form.
    * **Salvataggio:** `saveRoutines` gestisce l'invio del form di creazione. Raccoglie tutti i dati, inclusi nome, tipo di trigger, valori del trigger (ora o sensore/soglia/condizione), azione (apri/chiudi), percentuale e tapparelle target (selezionate tramite checkbox). Determina l'endpoint API corretto (`/api/entities/routine/create/actionTime` o `/api/entities/routine/create/lightSensor`) in base al tipo di trigger. Costruisce il payload JSON corretto, che include il nome, l'array di tapparelle target (come `{name: 'nome_tapparella'}`), il valore `rollerShutterValue` (calcolato in base ad apri/chiudi e percentuale) e i dati specifici del trigger (ora formattata o oggetto `lightSensor` con nome e oggetto `lightValueRecord` con valore e metodo booleano per sopra/sotto). Invia la richiesta POST e, in caso di successo, chiude il form e ricarica l'elenco delle routine.
    * **Eliminazione:** `deleteRoutine` chiede conferma ed esegue una DELETE all'endpoint `/api/entities/routine/delete/{id}`.

* **Styling (`css/styles.css`)**
    * Definisce un tema scuro personalizzato per tutti gli elementi (sfondi, testo, bordi).
    * Sovrascrive e personalizza gli stili di Bootstrap per bottoni, liste, form e contenitori per adattarli al tema scuro.
    * Utilizza gradienti e bordi per il contenitore principale.
    * Include stili per l'evidenziazione degli elementi attivi nelle liste (es. tapparelle selezionate).
    * Fornisce stili responsive di base per adattare leggermente layout e dimensioni su schermi più piccoli.

#### 6. Personalizzazione

Questo frontend può essere personalizzato in diversi modi:

* **Endpoint API:** Modifica la costante `API_BASE_URL` in `js/auth.js` per puntare a un backend diverso. Assicurati che il nuovo backend esponga endpoint compatibili con quelli chiamati dal frontend.
* **Aspetto Grafico:** Modifica `css/styles.css` per cambiare colori, font, spaziature e layout. Puoi anche cambiare la versione di Bootstrap o usare un tema Bootstrap diverso (richiederà aggiustamenti agli stili personalizzati).
* **Testo e Lingua:** Modifica le stringhe di testo direttamente nei file HTML e nei messaggi `alert()` o `textContent` all'interno dei file JavaScript.
* **Aggiungere Nuovi Tipi di Dispositivi:** Richiederebbe modifiche significative:
    * Aggiungere nuove sezioni nell'HTML (`dashboard.html`).
    * Creare nuovi file JavaScript (o estendere quelli esistenti) per gestire la logica specifica del nuovo dispositivo.
    * Aggiungere nuove funzioni di caricamento, creazione, modifica ed eliminazione in `dashboard.js`.
    * Definire nuovi stili in `css/styles.css`.
    * Assicurarsi che l'API backend supporti il nuovo tipo di dispositivo.
* **Modificare Funzionalità Esistenti:** Ad esempio, cambiare il modo in cui vengono associate le tapparelle (per ID invece che per nome) richiederebbe di modificare le funzioni `submitEditHome`, `loadAvailableShuttersForEditHome`, `saveRoutines`, e `loadShuttersForRoutineForm` per gestire gli ID e assicurarsi che l'API li accetti.

#### 7. Dipendenze

* **Bootstrap 5:** Utilizzato per layout, componenti e responsività. Caricato tramite CDN nei file HTML.
* **API Backend:** Dipendenza **fondamentale**. Il frontend è inutile senza un'API backend compatibile che fornisca gli endpoint attesi per autenticazione, gestione di case, dispositivi (sensori, tapparelle) e routine.

#### 8. Integrazione API (Endpoints Attesi)

Il frontend si aspetta che il backend API esponga i seguenti endpoint:

* **Autenticazione:**
    * `POST /api/auth/register` (Payload: `{ username, password }` - password hashata)
    * `POST /api/auth/authenticate` (Payload: `{ username, password }` - password hashata) -> Restituisce `{ jwt }`
* **Case (Homes):**
    * `GET /api/entities/home/` -> Restituisce array di oggetti Home
    * `POST /api/entities/home/create` (Payload: `{ name }`)
    * `DELETE /api/entities/home/delete/{id}`
    * `PATCH /api/entities/home/patch/name/{id}` (Payload: `{ name }`)
    * `PATCH /api/entities/home/patch/lightSensor/{id}` (Payload: `{ lightSensor: { name: sensorName } }` o `{ lightSensor: null }`)
    * `PATCH /api/entities/home/patch/rollerShutters/{id}` (Payload: `{ rollerShutters: [{ name: shutterName1 }, ...] }`)
* **Sensori di Luminosità:**
    * `GET /api/entities/lightSensor/` -> Restituisce array di oggetti LightSensor
    * `POST /api/entities/lightSensor/create` (Payload: `{ name }`)
    * `DELETE /api/entities/lightSensor/delete/{id}`
    * `PATCH /api/entities/lightSensor/patch/name/{id}` (Payload: `{ name }`)
* **Tapparelle (Roller Shutters):**
    * `GET /api/entities/rollerShutter/` -> Restituisce array di oggetti RollerShutter
    * `POST /api/entities/rollerShutter/create` (Payload: `{ name }`)
    * `DELETE /api/entities/rollerShutter/delete/{id}`
    * `PATCH /api/entities/rollerShutter/patch/name/{id}` (Payload: `{ name }`)
    * `PATCH /api/entities/rollerShutter/patch/opening/{id}` (Payload: `{ value: delta }`)
* **Routine:**
    * `GET /api/entities/routine/` -> Restituisce array di oggetti Routine
    * `POST /api/entities/routine/create/actionTime` (Payload: `{ name, time: "HH:MM:SS", rollerShutters: [{name},...], rollerShutterValue }`)
    * `POST /api/entities/routine/create/lightSensor` (Payload: `{ name, lightSensor: {name}, lightValueRecord: {value, method}, rollerShutters: [{name},...], rollerShutterValue }`)
    * `DELETE /api/entities/routine/delete/{id}`
    * `PATCH /api/entities/routine/patch/name/{id}` (Payload: `{ name }`)in file basati sulla funzionalità principale che gestiscono:
    * `auth.js`: Autenticazione, gestione token JWT, funzione `fetchApi` per le chiamate backend.
    * `register.js`: Logica specifica per il form di registrazione.
    * `dashboard.js`: Logica principale della dashboard, gestione case, gestione dispositivi globali, caricamento dati iniziali, gestione form di modifica.
    * `shutters.js`: Logica per il controllo delle tapparelle (selezione, aggiustamenti, apri/chiudi tutto).
    * `routines.js`: Logica per la gestione delle routine (creazione, visualizzazione, eliminazione, gestione form).
* **Interazione con API:** Tutta la comunicazione con il backend avviene tramite la funzione `fetchApi` in `js/auth.js`. Questa funzione centralizza la gestione degli header (incluso il token JWT per le richieste autenticate), la gestione degli errori HTTP e la gestione delle risposte (JSON o testo).
* **Styling:** Utilizza Bootstrap 5 (caricato da CDN) per la struttura di base, il layout responsive e i componenti. Un file `css/styles.css` personalizza l'aspetto con un tema scuro e stili specifici per gli elementi dell'interfaccia.
* **Gestione dello Stato:** Lo stato dell'applicazione (dati su case, dispositivi, routine) viene recuperato dall'API al caricamento della pagina o a seguito di azioni dell'utente. Non sembra esserci una gestione dello stato complessa lato client al di fuori delle variabili globali semplici (come `selectedRollerShutterId` in `shutters.js`). Lo stato di autenticazione è gestito tramite un token JWT memorizzato nel `localStorage` del browser.