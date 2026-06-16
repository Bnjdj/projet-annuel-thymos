@echo off
echo ========================================
echo  THYMOS IA — Demarrage complet
echo ========================================
echo.

REM Set PATH
set PATH=%PATH%;C:\Users\VotreNom\AppData\Local\Programs\Ollama;C:\Users\VotreNom\ffmpeg

REM Set CORS for Ollama
set OLLAMA_ORIGINS=*

REM Check Ollama
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Ollama non trouve. Installe-le depuis ollama.com/download
    pause
    exit /b 1
)

REM Check models
echo [1/3] Verification des modeles...
ollama list 2>nul | findstr "thymos-mma" >nul
if %errorlevel% neq 0 (
    echo    Modele thymos-mma non trouve, creation...
    ollama create thymos-mma -f "%~dp0Modelfile"
)

ollama list 2>nul | findstr "llava" >nul
if %errorlevel% neq 0 (
    echo    Modele llava non trouve, telechargement (~4.7GB)...
    ollama pull llava:7b
)

echo    Modeles OK

REM Start IA API server
echo [2/3] Demarrage du serveur IA (port 8081)...
start "THYMOS IA Server" /min python "%~dp0server.py"

REM Start web server
echo [3/3] Demarrage du site web (port 8080)...
cd /d "%~dp0.."
start "THYMOS Web" /min python -m http.server 8080

echo.
echo ========================================
echo  THYMOS IA — Tout est lance !
echo ========================================
echo.
echo  Site web:    http://localhost:8080
echo  IA API:      http://localhost:8081
echo  Ollama:      http://localhost:11434
echo.
echo  Pour analyser une video MMA:
echo    python ia/video-analyzer.py "URL_YOUTUBE"
echo.
echo  Ferme cette fenetre pour tout arreter.
echo ========================================
pause
