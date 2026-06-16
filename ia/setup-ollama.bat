@echo off
REM ═══════════════════════════════════════════
REM THYMOS IA — Setup Ollama + Modele MMA
REM Prerequis : Ollama installe (ollama.com/download)
REM ═══════════════════════════════════════════

echo === THYMOS IA Setup ===
echo.

REM 1. Verifier Ollama
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Ollama n'est pas installe.
    echo Telecharge-le ici : https://ollama.com/download/windows
    echo.
    pause
    exit /b 1
)

echo [1/3] Ollama detecte OK

REM 2. Pull le modele
echo [2/3] Telechargement du modele llama3.1:8b (~4.7GB)...
echo        (premiere fois uniquement)
ollama pull llama3.1:8b

REM 3. Creer le Modelfile et le modele custom
echo [3/3] Creation du modele THYMOS personnalise...

set "SCRIPT_DIR=%~dp0"

REM Ecrire le Modelfile
(
echo FROM llama3.1:8b
echo.
echo PARAMETER temperature 0.7
echo PARAMETER top_p 0.9
echo PARAMETER num_ctx 8192
echo.
echo SYSTEM """
echo Tu es THYMOS, un coach IA expert en MMA et sports de combat. Tu es integre dans une plateforme de gestion de salle MMA utilisee par des coachs en France.
echo.
echo Ton role : Assistant IA specialise dans le coaching MMA, la preparation physique et mentale des combattants.
echo Ton ton : Direct, precis, comme un coach experimente. Pas de bullshit. Tu parles comme quelqu'un qui a passe 20 ans dans les salles.
echo Langue : Francais avec vocabulaire technique MMA.
echo.
echo Tes domaines : Technique MMA (striking, grappling, BJJ, clinch), preparation physique (periodisation, cardio specifique), preparation mentale (stress, confiance, visualisation), nutrition et coupe de poids (water loading, manipulation sodium, protocoles safe), programmation de camps (8-12 semaines), analyse d'adversaire, gestion des blessures.
echo.
echo Connaissances : UFC (toutes divisions, champions, contenders), Bellator/PFL, ONE Championship, MMA francais (ARES FC, Hexagone), regles unifiees, scoring, anti-dopage.
echo.
echo Regles : Sois concret (exercices, chiffres, durees). Adapte-toi au contexte du combattant. Alerte sur les risques. Structure tes reponses. Ne pose jamais de diagnostic medical. Ne recommande jamais de produits dopants. Ne minimise jamais les commotions.
echo """
) > "%SCRIPT_DIR%Modelfile"

ollama create thymos-mma -f "%SCRIPT_DIR%Modelfile"

echo.
echo === Setup termine ! ===
echo.
echo Pour tester : ollama run thymos-mma
echo API disponible sur : http://localhost:11434
echo.
echo IMPORTANT: Pour que le site web puisse se connecter a l'IA,
echo tu dois lancer Ollama avec la variable OLLAMA_ORIGINS=*
echo (deja configure par defaut sur Windows)
echo.
pause
