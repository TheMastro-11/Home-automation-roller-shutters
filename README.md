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

## 5 Scelta Database
La scelta di utilizzare un database locale come postgres è stata effettuata per motivi di sviluppo, in ogni caso è possibile integrare un database relazionale come Aurora o uno come DynamoDB, collegato allo shadow direttamente tramite aws per la gestione dei dati dei sensori (Già testati). La logica del backend rimane la stessa ed è quindi possibile per future implementazioni cambiare lo strumento di archiviazione.

## 6 Manuale Riuso
Il codice è suddiviso in 3 sottocartelle:
  - [Backend](Docs/Backend.md): sistema in java che gestisce tutte le chiamate REST e la logica delle entità.
  - [Frontend](Docs/Frontend.md): interfaccia in javascript e html per interazione utente e chiamate api.
  - [RoutineAgent](Docs/RoutineAgent.md) : sistema in java per la gestione delle routine basate sull'orario.

## 7 Build ed esecuzione
Il progetto è inteso per essere eseguito tramite docker compose, per facilitarne la costruzione abbiamo realizzato uno script denominato **start.sh**.


