# Gestione di un sistema di domotica per il controllo delle tapparelle

## 1. Requisiti ad alto livello
- Il sistema prevede l’utilizzo di dispositivi dotati di motore passo-passo e sensore di luminosità, per il controllo e l’automazione delle finestre di un’abitazione. Le letture sono salvate in un database AWS e gestite secondo il paradigma delle shadow things (prevedere scalabilità a livello sia di abitazione sia di finestre gestite);

- Il dispositivo, per ciascuna finestra, è in grado di aprire o chiudere completamente la tapparella, o posizionarla ad altezze intermedie. Di base, regola la tapparella a seconda delle condizioni di luminosità esterna, abbassandola in presenza di sole diretto, o chiudendola nelle ore notturne;

- Il proprietario può, tramite una interfaccia web, visionare lo stato di tutte le tapparelle, programmare la chiusura o apertura automatica per fasce orarie, o regolare manualmente la posizione di ciascuna (permettendo anche l’apertura o chiusura globale).

---

## 2. Specifiche del progetto
Il progetto mira a sviluppare un sistema di automazione domestica scalabile per il controllo delle tapparelle, utilizzando dispositivi IoT, un'infrastruttura cloud, diversi database per la memorizzazione dei dati e un'interfaccia web.

Le specifiche principali includono:  
- **Controllo Automatico Basato sulla Luce**: La posizione delle tapparelle viene regolata dinamicamente in base alle letture di un sensore di luce in tempo reale.  
- **Gestione Remota**: Gli utenti possono sovrascrivere l'automazione per regolare manualmente le tapparelle, impostare programmi o attivare azioni globali.  
- **Interfaccia Web**: Piattaforma (backend e frontend) realizzata in **java** con *springboot* e *gradle*.
- **Scalabilità**: Utilizzo degli AWS IoT Shadow per gestire singole finestre e intere abitazioni.  
- **Archiviazione Dati**: I dati dei sensori sono memorizzati in DynamoDB, mentre le credenziali e i dati degli utenti sono gestite in PostgreSQL.  
- **Integrazione Dispositivi**: Microcontrollori ESP8266 interfacciati con motori passo-passo e sensori di luce. 
- **Notifiche (Opzionali)**: Notifiche per la segnalazione di variazione di stato dei sensori o del motore.

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
  - Eseguire cambiamenti dello stato desiderato.  

#### **Regole di Automazione**  
- **Programmazione Temporale**:  
  - Definire programmi di apertura/chiusura (es. "Chiudi tutte le tapparelle alle 22:00 ogni giorno").  
- **Automazione Basata sulla Luce**:  
  - Chiudere le tapparelle in caso di luce solare diretta (es. luce > 800 lux) o aprirle all'alba.  
- **Azioni Globali**:  
  - Comandi one-click per aprire/chiudere tutte le tapparelle di un'abitazione.  

#### **Interazione Utente**  
- **Interfaccia Web**:  
  - Dashboard in tempo reale con posizioni delle tapparelle, livelli di luce e stato dell'automazione.  
  - Slider manuali per regolare singole tapparelle.  
  - Pannello di configurazione per programmi con fasce orarie.  
- **Autenticazione**:  
  - Registrazione/login utenti con accesso basato su ruoli (es. admin vs. guest).  

#### **Gestione Dati**  
- **Dati dei Sensori**:  
  - Memorizzare luce/posizioni in DynamoDB.  
- **Dati Utenti**:  
  - PostgreSQL per profili utenti, credenziali e preferenze.  

#### **Attori del sistema**  
1. **Proprietario/Utente Finale:**  
    L'utente potrà, sulla base delle autorizzazioni concesse dall'amministratore, avere una o più facoltà:
    - verificare lo stato attuale degli oggetti 
    - controllare l'apertura o chiusura delle tapparelle o tramite delle automazioni o con comandi diretti
    - aggiungere o rimuovere elementi
2. **Amministratore di Sistema:**  
   - Gestisce le configurazioni e l’assegnazione dei privilegi.

#### **Casi d’uso principali:**  
Apertura automatizzata di una taparella tramite trigger

**Descrizione**
Apertura automatizzata di una taparella sulla base di un orario specifico

**Pre-Condizioni**
Un utente ha definito tempo prima un'apertura parziale della tapparella di camera sua all'alba.
Nodered è in esecuzione sul master ed ha un flusso definito secondo il criterio sopra descritto.

**Sequenza**
1. La tapparella è chiusa, è notte.
2. Alle 6:00 scatta il trigger per l'apertura del 40% della tapparella
3. La tapparella si apre

**Post-condizioni**
Lo stato della tapparella viene aggiornato sulla shadow.

------------ 

Apertura manuale di una taparella tramite interfaccia web

**Descrizione**
Apertura manuale di una taparella sulla base dell'input dell'utente.

**Pre-Condizioni**
Un utente vuole farsi un riposino pomeridiano e decide di chiudere le tapparelle.

**Sequenza**
1. Apre l'interfaccia web e imposta la chiusura, sul momento gli viene chiesto dall'applicazione se desidera sospendere per tot tempo le automazioni.
2. Il backend riceve l'input e comanda l'esecuzione tramite nodered.
1. La tapparella è chiusa.

**Post-condizioni**
Lo stato della tapparella viene aggiornato sulla shadow.

---

### 2.2 Implementazione del sistema

**Fasi principali dell’implementazione:**

1. **Prototipazione del Dispositivo IoT:**  
   - Configurazione dell’ESP8266 connesso al sensore di luminosità e al motore passo-passo.
   - Sviluppo del firmware che consente l’elaborazione dei dati e l’invio degli aggiornamenti tramite mqtt.
2. ~~Integrazione con Node-RED e AWS IoT~~  
   - ~~Configurazione di Node-RED per gestire il flusso di dati dall’ESP8266 verso AWS IoT Shadow.~~
   - ~~Sviluppo di flussi che gestiscono le richieste di comando dal backend Java e la sincronizzazione dello stato.~~  

3. **Sviluppo del Backend e Frontend in Java:**  
   - **Backend:** ~~Comunicazione con Node-RED e~~ operazioni CRUD per la gestione degli utenti (salvate su PostgreSQL) e per la programmazione delle operazioni.
   - **Frontend:** Realizzazione di un’interfaccia web in Java che permetta la visualizzazione dello stato dei dispositivi e la configurazione delle automazioni.
4. **Database e Storage:**  
   - **PostgreSQL:** Utilizzato per gestire dati degli utenti, log-in, registrazioni e configurazioni di sistema.
   - **DynamoDB:** Utilizzato per la memorizzazione in tempo reale dei dati provenienti dai sensori.

---

#### 2.2.1 architettura HW-SW
**Flusso di Dati** 
1. Il **sensore di luminosità** invia i dati all'**ESP8266**.  
2. L'ESP8266 trasmette i dati a ~~**Node-RED**~~ al **AWS IoT Shadow**.
3. ~~**Node-RED** aggiorna lo stato del dispositivo su **AWS IoT Shadow**.~~ 
4. Il **backend Java** interroga lo stato aggiornato.  
5. Il **frontend Java** visualizza in tempo reale lo stato delle tapparelle e consente il controllo manuale.

**Configurazione Hardware**  
- **Configurazione ESP8266**:  
  - Collegare il motore passo-passo e sensore di luce.  
  - Alimentazione a 5V; abilitare Wi-Fi per la comunicazione MQTT.  
- **Calibrazione del Motore**:  
  - Definire i passi per il movimento completo.  

**Configurazione AWS IoT**  
1. **Creazione IoT Things**:  
   - Registrare ogni ESP8266 come "Thing" in AWS IoT Core.  
   - Associare certificati per comunicazione MQTT sicura.  
2. **Configurazione Shadow**:  
   - Definire schemi JSON per `reported` (stato attuale) e `desired` (stato target).  

**Flussi Node-RED**  
- **Sottoscrizioni MQTT**:  
  - Ascoltare i topic ~~`$aws/things/{thingName}/shadow/update`~~.  
- **Logica di Automazione**:  
  - Confrontare i livelli di luce con le soglie; pubblicare cambiamenti dello stato `desired`.  
  - Inoltrare comandi dal backend Java ai dispositivi.  
- **Endpoint API**:  
  - Esporre API REST per permettere al backend Java di attivare override manuali.  

**Backend & Frontend (Java)**  
- **Backend Spring Boot**:  
  - API REST per autenticazione utenti, controllo tapparelle e gestione programmi.  
  - Integrazione con PostgreSQL.  
  - Recuperare dati dai sensori in DynamoDB.  
- **Frontend**:  
  - Template Thymeleaf per rendering lato server.  
  - Dashboard interattiva con aggiornamenti in tempo reale.  

**Integrazione Database**  
- **PostgreSQL**:  
  - Tabelle per la gestione utenti e ruoli.  
- **DynamoDB**:  
  - Tabella per i dati dei sensori.  

---

#### 2.2.2 Tecnologie utilizzate


| **Componente**              | **Tecnologia**                    | **Connessione**              | **Scopo / Descrizione**                                                                                                                                                   |
|-----------------------------|-----------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Microcontrollore**       | ESP8266                           | Wi-Fi                        | Controllo dei dispositivi e raccolta dei dati dai sensori; comunica con Node-RED per l'invio dei dati e il controllo del motore.                                           |                                                                       |
| ~~**Logica Automazione**~~    | ~~Node-RED~~                         | ~~HTTP/MQTT~~                    | ~~Implementa l'automazione basata su regole e funge da gateway API, interfacciando ESP8266 e AWS IoT per l'aggiornamento dello stato.~~                                      |
| **Database Temporale**            | DynamoDB                    | NoSQL API              | Memorizza le letture dei sensori in modo scalabile.                |  
| **IoT Shadow**      | AWS IoT Shadow              | HTTP                  | Memorizza e sincronizza lo stato desiderato/effettivo dei dispositivi. | 
| **Backend**                 | Java/Spring Boot                  | REST API                     | Gestisce l'autenticazione, la logica API; interagisce con Node-RED e PostgreSQL per la gestione dei dati e degli utenti.                           |
| **Frontend**                | Java/Thymeleaf         | WebSocket/API                | Fornisce un'interfaccia web per il monitoraggio e il controllo interattivo, con aggiornamenti in tempo reale.                                                               |
| **Database Permanente**    | PostgreSQL                        | SQL Queries                  | Gestisce le credenziali degli utenti, i processi di login, registrazione e la gestione dei programmi.                                                                      |

---


## 3 Contesto, problematiche da affrontare, motivazione delle scelte progettuali svolte
Abbiamo scelto di utilizzare java per poter programmare con un unico linguaggio e soprattutto del quale avessimo conoscenze pregresse.

~~L'utilizzo delle api di nodered ci permette un controllo diretto sull'esecuzione del flusso di lavoro.~~

Tutti i programmi vengono eseguiti su docker per poter avere una gestione migliore dei diversi ambienti e permettere un porting su qualsiasi macchina.



## 4 Validazione e sperimentazione
Il focus sarà incentrato su:
    

La fase di validazione ha lo scopo di verificare che il sistema soddisfi i requisiti funzionali, garantendo affidabilità, performance. I test sono suddivisi in:  
- **Test Funzionali**: Verificare il corretto funzionamento di ciascun caso d'uso.  
- **Test di Integrazione**: Controllare la corretta interazione tra i vari componenti (dispositivo, ~~Node-RED~~, AWS IoT, backend e frontend).  
- **Test di Performance e Scalabilità**: Valutare la latenza nelle comunicazioni, la capacità di gestione simultanea di più dispositivi e l'efficienza nell'aggiornamento in tempo reale. 


- **Test sul Campo**:  
  - Simulazione delle condizioni di luminosità variabile per verificare la reazione del dispositivo ~~e il corretto invio dei dati a Node-RED~~. 
  - Verifica del funzionamento del motore passo-passo in risposta ai comandi automatizzati e manuali.
  - movimento fluido della tapparella
  - gestione corretta dei dati del sensore, per esempio evitare di scambiare istanti di buio dovuti ad fattori accidentali (nuvola che passa per pochi secondi) e quindi implementare controlli o utilizzo di intervalli temporali etc.
- **Test Software**:  
  - **Unit Test**: Validazione delle funzioni individuali del backend Java e dei moduli di Node-RED.  
  - **Integration Test**: Controllo dell'interazione tra ESP8266 ~~, Node-RED~~ e AWS IoT Shadow, verificando la corretta sincronizzazione dei dati. Coerenza nel cambiamento degli stati, es. lo stato chiuso deve apparire una volta che la tapparella ha completato l'operazione e non durante o prima per evitare sitauzioni incongruenti. 
  - **End-to-End Test**: Simulazione del flusso completo, dall'acquisizione dei dati dal sensore fino alla visualizzazione e controllo tramite l'interfaccia web.
- **Test di Sicurezza**:  
  - Verifica dell'autenticazione e della gestione dei privilegi tramite PostgreSQL. 



