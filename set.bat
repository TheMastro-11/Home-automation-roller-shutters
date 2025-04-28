@echo off
REM Script per compilare i progetti Backend e routineAgent e avviare Docker Compose

echo Entrando in Backend...
cd Backend
IF %ERRORLEVEL% NEQ 0 (
    echo Errore: Impossibile accedere alla cartella Backend.
    pause
    exit /b 1
)

echo Eseguendo Gradle build per Backend...
call gradlew.bat clean build
IF %ERRORLEVEL% NEQ 0 (
    echo Errore durante il build Gradle di Backend.
    pause
    exit /b 1
)

echo Tornando indietro e entrando in routineAgent...
cd ..\routineAgent
IF %ERRORLEVEL% NEQ 0 (
    echo Errore: Impossibile accedere alla cartella routineAgent.
    pause
    exit /b 1
)

echo Eseguendo Gradle build per routineAgent...
call gradlew.bat clean build
IF %ERRORLEVEL% NEQ 0 (
    echo Errore durante il build Gradle di routineAgent.
    pause
    exit /b 1
)

echo Tornando alla cartella principale...
cd ..
IF %ERRORLEVEL% NEQ 0 (
    echo Errore: Impossibile tornare alla cartella principale.
    pause
    exit /b 1
)

echo Avviando Docker Compose...
docker compose up --build
IF %ERRORLEVEL% NEQ 0 (
    echo Errore durante l'avvio di Docker Compose.
    pause
    exit /b 1
)

echo Script completato con successo.
pause REM Opzionale: Mantiene la finestra aperta alla fine per leggere l'output