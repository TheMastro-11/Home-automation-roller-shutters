- Creare login/registrazione :
    - PostGres (Utente: nome utente - password - ruolo)
    - Interfaccia (login - logout)

- Tabelle PostGres: (Dispositivi: Id - nome - percentuale apertura - abitazione / Abitazioni: id - località - proprietario / storico: stato - chiave esterno dispositivo - timestamp / RelazioneUtenteAbitazione: nome abitazione - utente)

- Operazioni Utente
    - Verifica e controllo
        1. Verificare le proprie abitazioni (elenco di tutte e seleziona quella che gli interessa)
        2. Verificare status tapparelle e sensore in tempo reale. (elenco dispositivi: nome - percentuale apertura ...)
        2. Comandare la singola tapparella (... solleva di x - abbassa di y - apri tutta - chiudi tutta)
    - Creare automazioni
        - Vedere quelle già presenti (elenco con nome - dispositivo utilizzato) e selzionare quella che desidera modificare
        - aggiungerne (tasto + in alto a destra) una nuova (nome - dispositivo/i - trigger - azione)

- Operazioni Admin:
    - Gestire le abitazioni (elenco nome):
        - Selezionarne una e vedere elenco dispositivi e elenco utenti
            - Aggiungere o rimuovere
