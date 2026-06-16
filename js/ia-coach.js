/* ═══════════════════════════════════════════
   THYMOS — IA COACH (Ollama Local + RAG)
   Modele: thymos-mma (Llama 3.1 8B)
   Knowledge: injection contextuelle MMA
   Endpoint: http://localhost:11434/api/chat
════════════════════════════════════════════ */

const OLLAMA_API = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'thymos-mma';
const KNOWLEDGE_BASE_PATH = 'ia/knowledge/';

// ─── Knowledge Base (RAG) ───────────────────────────
let knowledgeIndex = null;
let knowledgeCache = {};

async function loadKnowledgeIndex() {
  if (knowledgeIndex) return knowledgeIndex;
  try {
    const res = await fetch(KNOWLEDGE_BASE_PATH + 'index.json');
    knowledgeIndex = await res.json();
    return knowledgeIndex;
  } catch (e) {
    console.warn('Knowledge index not found, running without RAG');
    return null;
  }
}

async function loadKnowledgeFile(fileId, path) {
  if (knowledgeCache[fileId]) return knowledgeCache[fileId];
  try {
    const res = await fetch(KNOWLEDGE_BASE_PATH + path);
    const text = await res.text();
    knowledgeCache[fileId] = text;
    return text;
  } catch (e) {
    return null;
  }
}

// Determine which knowledge files are relevant to the user's question
function getRelevantFiles(question, index) {
  if (!index || !index.files) return [];

  const questionLower = question.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents

  const scores = index.files.map(file => {
    let score = 0;
    for (const keyword of file.keywords) {
      const kwLower = keyword.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (questionLower.includes(kwLower)) {
        score += kwLower.length > 4 ? 3 : 1; // Longer keywords = more specific = higher score
      }
    }
    return { ...file, score };
  });

  // Return files with score > 0, sorted by relevance
  return scores
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Build knowledge context from relevant files
async function buildKnowledgeContext(question) {
  const index = await loadKnowledgeIndex();
  if (!index) return '';

  const relevant = getRelevantFiles(question, index);
  if (relevant.length === 0) {
    // If no specific match, load a bit of each (first 2000 chars)
    let ctx = '\n\n[BASE DE CONNAISSANCES MMA - Extraits]\n';
    for (const file of index.files) {
      const content = await loadKnowledgeFile(file.id, file.path);
      if (content) {
        ctx += '\n--- ' + file.id.toUpperCase() + ' ---\n';
        ctx += content.substring(0, 2000) + '\n...\n';
      }
    }
    return ctx;
  }

  // Load the most relevant files (up to 2, to stay within context)
  let ctx = '\n\n[BASE DE CONNAISSANCES MMA]\n';
  const maxFiles = Math.min(relevant.length, 2);

  for (let i = 0; i < maxFiles; i++) {
    const file = relevant[i];
    const content = await loadKnowledgeFile(file.id, file.path);
    if (content) {
      // For very large files, take the most relevant section
      const section = extractRelevantSection(content, question);
      ctx += '\n--- ' + file.id.toUpperCase() + ' ---\n';
      ctx += section + '\n';
    }
  }

  return ctx;
}

// Extract the most relevant ~4000 char section from a large knowledge file
function extractRelevantSection(content, question) {
  const maxChars = 6000;
  if (content.length <= maxChars) return content;

  const questionWords = question.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Split content into sections by headers
  const sections = content.split(/^## /m);
  if (sections.length <= 1) return content.substring(0, maxChars);

  // Score each section
  const scored = sections.map(section => {
    const sectionLower = section.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let score = 0;
    for (const word of questionWords) {
      const occurrences = (sectionLower.match(new RegExp(word, 'g')) || []).length;
      score += occurrences;
    }
    return { text: '## ' + section, score };
  });

  // Sort by relevance and take top sections that fit within maxChars
  scored.sort((a, b) => b.score - a.score);

  let result = '';
  for (const section of scored) {
    if (result.length + section.text.length > maxChars) {
      if (result.length === 0) {
        result = section.text.substring(0, maxChars);
      }
      break;
    }
    result += section.text + '\n';
  }

  return result || content.substring(0, maxChars);
}

// ─── Fighter Context ────────────────────────────────
let fighterContext = null;

function setFighterContext(fighter) {
  fighterContext = fighter;
}

function buildFighterContextMessage() {
  if (!fighterContext) return '';

  let ctx = `\n\n[CONTEXTE COMBATTANT ACTUEL]\n`;
  ctx += `Nom: ${fighterContext.name || 'Inconnu'}\n`;
  if (fighterContext.weight) ctx += `Poids actuel: ${fighterContext.weight}kg\n`;
  if (fighterContext.category) ctx += `Categorie: ${fighterContext.category}\n`;
  if (fighterContext.style) ctx += `Style: ${fighterContext.style}\n`;
  if (fighterContext.wins !== undefined) ctx += `Record: ${fighterContext.wins}V - ${fighterContext.losses}D\n`;
  if (fighterContext.physical_score !== undefined) ctx += `Score physique: ${fighterContext.physical_score}/100\n`;
  if (fighterContext.mental_score !== undefined) ctx += `Score mental: ${fighterContext.mental_score}/100\n`;
  if (fighterContext.next_combat) ctx += `Prochain combat: ${fighterContext.next_combat}\n`;
  if (fighterContext.notes) ctx += `Notes coach: ${fighterContext.notes}\n`;

  return ctx;
}

// ─── Conversation ───────────────────────────────────
let conversationHistory = [];

function resetConversation() {
  conversationHistory = [];
}

// ─── Send to IA with RAG ────────────────────────────
async function sendToIA(userMessage, onChunk) {
  // Build knowledge context based on the question
  const knowledgeCtx = await buildKnowledgeContext(userMessage);

  // Build full message with context
  let messageContent = userMessage;
  if (conversationHistory.length === 0) {
    // First message: inject fighter context + knowledge
    messageContent += buildFighterContextMessage();
    if (knowledgeCtx) {
      messageContent += knowledgeCtx;
      messageContent += '\n\n[INSTRUCTION: Utilise les connaissances ci-dessus pour repondre de maniere precise et detaillee. Cite des exemples concrets, des combattants reels, des techniques specifiques quand c\'est pertinent.]';
    }
  } else if (knowledgeCtx) {
    // Subsequent messages: still inject relevant knowledge
    messageContent += knowledgeCtx;
  }

  conversationHistory.push({
    role: 'user',
    content: messageContent
  });

  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: conversationHistory,
        stream: true
      })
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('MODEL_NOT_FOUND');
      throw new Error(`Ollama error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message && data.message.content) {
            fullResponse += data.message.content;
            if (onChunk) onChunk(data.message.content, fullResponse);
          }
        } catch (e) { /* skip invalid JSON */ }
      }
    }

    conversationHistory.push({
      role: 'assistant',
      content: fullResponse
    });

    return fullResponse;

  } catch (err) {
    conversationHistory.pop();
    throw err;
  }
}

// ─── Check Ollama Status ────────────────────────────
async function checkOllamaStatus() {
  try {
    const res = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return { running: false, model: false };

    const data = await res.json();
    const hasModel = data.models && data.models.some(m => m.name.startsWith(MODEL_NAME));
    return { running: true, model: hasModel };
  } catch {
    return { running: false, model: false };
  }
}

// ─── UI Chat Widget ─────────────────────────────────
function initIAChat(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { fighterData, placeholder } = options;
  if (fighterData) setFighterContext(fighterData);

  // Preload knowledge index
  loadKnowledgeIndex();

  container.innerHTML = `
    <div class="ia-chat-widget">
      <div class="ia-chat__header">
        <div class="ia-chat__status" id="iaStatus">
          <span class="ia-status-dot"></span>
          <span class="ia-status-text">Connexion...</span>
        </div>
        <button class="ia-chat__reset" id="iaReset" title="Nouvelle conversation">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>
      <div class="ia-chat__messages" id="iaMessages">
        <div class="ia-msg ia-msg--system">
          <span class="ia-msg__tag">THYMOS IA</span>
          <span>Expert MMA a ton service. Pose-moi n'importe quelle question : technique, preparation, nutrition, gameplan, analyse d'adversaire, coupe de poids, mental... Je connais le MMA sur le bout des gants.</span>
        </div>
      </div>
      <form class="ia-chat__input" id="iaForm">
        <input type="text" id="iaInput" placeholder="${placeholder || 'Technique, preparation, nutrition, gameplan...'}" autocomplete="off" />
        <button type="submit" id="iaSend" aria-label="Envoyer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  `;

  const messagesEl = document.getElementById('iaMessages');
  const form = document.getElementById('iaForm');
  const input = document.getElementById('iaInput');
  const sendBtn = document.getElementById('iaSend');
  const resetBtn = document.getElementById('iaReset');
  const statusEl = document.getElementById('iaStatus');

  // Check status
  checkOllamaStatus().then(status => {
    const dot = statusEl.querySelector('.ia-status-dot');
    const text = statusEl.querySelector('.ia-status-text');
    if (status.running && status.model) {
      dot.classList.add('ia-status-dot--online');
      text.textContent = 'THYMOS IA en ligne';
    } else if (status.running && !status.model) {
      dot.classList.add('ia-status-dot--warn');
      text.textContent = 'Modele non installe — lance setup-ollama.bat';
    } else {
      dot.classList.add('ia-status-dot--offline');
      text.textContent = 'Ollama non detecte — lance Ollama';
    }
  });

  // Send message
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage('user', msg);
    input.value = '';
    sendBtn.disabled = true;
    input.disabled = true;

    const typingEl = appendMessage('assistant', '', true);

    try {
      let firstChunk = true;
      await sendToIA(msg, (chunk, full) => {
        if (firstChunk) {
          typingEl.querySelector('.ia-msg__content').textContent = '';
          firstChunk = false;
        }
        typingEl.querySelector('.ia-msg__content').textContent = full;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    } catch (err) {
      typingEl.querySelector('.ia-msg__content').textContent = getErrorMessage(err);
      typingEl.classList.add('ia-msg--error');
    }

    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    resetConversation();
    messagesEl.innerHTML = `
      <div class="ia-msg ia-msg--system">
        <span class="ia-msg__tag">THYMOS IA</span>
        <span>Conversation reinitalisee. Pose ta question.</span>
      </div>
    `;
  });

  function appendMessage(role, content, isTyping = false) {
    const div = document.createElement('div');
    div.className = `ia-msg ia-msg--${role}`;

    if (role === 'assistant') {
      div.innerHTML = `
        <span class="ia-msg__tag">THYMOS</span>
        <span class="ia-msg__content">${isTyping ? '<span class="ia-typing"><span></span><span></span><span></span></span>' : escapeHtml(content)}</span>
      `;
    } else {
      div.innerHTML = `<span class="ia-msg__content">${escapeHtml(content)}</span>`;
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  // escapeHtml() is defined globally in security.js

  function getErrorMessage(err) {
    if (err.message === 'MODEL_NOT_FOUND') {
      return 'Modele thymos-mma non trouve. Double-clique sur ia/setup-ollama.bat pour l\'installer.';
    }
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return 'Impossible de se connecter a Ollama. Verifie qu\'Ollama tourne (icone dans la barre des taches).';
    }
    return 'Erreur de connexion. Verifie qu\'Ollama est lance.';
  }
}

// ─── Public API ─────────────────────────────────────
window.THYMOS_IA = {
  init: initIAChat,
  send: sendToIA,
  check: checkOllamaStatus,
  reset: resetConversation,
  setContext: setFighterContext
};
