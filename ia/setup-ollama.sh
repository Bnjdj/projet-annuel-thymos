#!/bin/bash
# ═══════════════════════════════════════════
# THYMOS IA — Setup Ollama + Modele MMA
# Prerequis : Ollama installe (ollama.com/download)
# ═══════════════════════════════════════════

echo "=== THYMOS IA Setup ==="
echo ""

# 1. Verifier Ollama
if ! command -v ollama &> /dev/null; then
    echo "ERREUR: Ollama n'est pas installe."
    echo "Telecharge-le ici : https://ollama.com/download"
    exit 1
fi

echo "[1/3] Ollama detecte ✓"

# 2. Pull le modele (Llama 3.1 8B — bon equilibre perf/qualite)
echo "[2/3] Telechargement du modele llama3.1:8b (~4.7GB)..."
echo "       (premiere fois uniquement, ensuite c'est instantane)"
ollama pull llama3.1:8b

# 3. Creer le modele custom THYMOS avec le system prompt
echo "[3/3] Creation du modele THYMOS personnalise..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYSTEM_PROMPT=$(cat "$SCRIPT_DIR/system-prompt.md")

cat > "$SCRIPT_DIR/Modelfile" << 'MODELFILE'
FROM llama3.1:8b

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 8192

SYSTEM """
MODELFILE

echo "$SYSTEM_PROMPT" >> "$SCRIPT_DIR/Modelfile"
echo '"""' >> "$SCRIPT_DIR/Modelfile"

ollama create thymos-mma -f "$SCRIPT_DIR/Modelfile"

echo ""
echo "=== Setup termine ! ==="
echo ""
echo "Pour tester : ollama run thymos-mma"
echo "API disponible sur : http://localhost:11434"
echo ""
echo "Pour autoriser le frontend a se connecter, lance Ollama avec :"
echo "  OLLAMA_ORIGINS=* ollama serve"
echo ""
