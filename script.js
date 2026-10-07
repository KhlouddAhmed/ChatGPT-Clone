const storageKey = "chatgptCloneSessions";
let sessions = [];
let currentSessionId = null;
let isWaitingForReply = false;

window.addEventListener("DOMContentLoaded", () => {
  loadSessions();
  if (!sessions.length) {
    createNewChat();
  } else {
    currentSessionId = sessions[0].id;
    renderSessionList();
    renderCurrentSession();
  }
});

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadSessions() {
  const raw = localStorage.getItem(storageKey);
  try {
    sessions = raw ? JSON.parse(raw) : [];
  } catch (error) {
    sessions = [];
  }
}

function saveSessions() {
  localStorage.setItem(storageKey, JSON.stringify(sessions));
}

function getCurrentSession() {
  return sessions.find((session) => session.id === currentSessionId);
}

function createNewChat() {
  const title = `Chat ${sessions.length + 1}`;
  const session = {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      }
    ]
  };

  sessions.unshift(session);
  currentSessionId = session.id;
  saveSessions();
  renderSessionList();
  renderCurrentSession();
}

function renderSessionList() {
  const history = document.getElementById("history-list");
  history.innerHTML = "";

  sessions.forEach((session) => {
    const activeClass = session.id === currentSessionId ? "history-item active" : "history-item";
    const item = document.createElement("button");
    item.type = "button";
    item.className = activeClass;
    item.innerHTML = `
      <strong>${session.title}</strong>
      <span>${new Date(session.createdAt).toLocaleString()}</span>
    `;
    item.onclick = () => selectSession(session.id);
    history.appendChild(item);
  });
}

function renderCurrentSession() {
  const session = getCurrentSession();
  const title = document.getElementById("chat-title");
  const subtitle = document.querySelector(".subtitle");
  const chatContainer = document.getElementById("chat-container");

  if (!session) {
    title.textContent = "No session selected";
    subtitle.textContent = "Create a new chat to start.";
    chatContainer.innerHTML = "";
    return;
  }

  title.textContent = session.title;
  subtitle.textContent = "Full conversation history is saved locally.";
  chatContainer.innerHTML = "";

  session.messages.forEach((message) => {
    if (message.role === "system") {
      return;
    }

    const bubble = document.createElement("div");
    bubble.className = `message ${message.role === "user" ? "user" : "bot"}`;
    bubble.textContent = message.content;
    chatContainer.appendChild(bubble);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function selectSession(sessionId) {
  if (isWaitingForReply) return;
  currentSessionId = sessionId;
  renderSessionList();
  renderCurrentSession();
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  const session = getCurrentSession();

  if (!message || !session || isWaitingForReply) return;

  session.messages.push({ role: "user", content: message });
  saveSessions();
  renderCurrentSession();
  input.value = "";
  input.focus();

  addTypingIndicator();
  isWaitingForReply = true;
  document.getElementById("send-button").disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: session.messages })
    });

    const data = await response.json();
    removeTypingIndicator();

    if (!response.ok) {
      const errorMessage = data.error?.message || "Unable to get a reply.";
      session.messages.push({ role: "assistant", content: `Error: ${errorMessage}` });
    } else {
      // FIX: Correct Gemini API response structure
      const assistantText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from the model.";
      session.messages.push({ role: "assistant", content: assistantText.trim() });
    }

    saveSessions();
    renderCurrentSession();
  } catch (error) {
    removeTypingIndicator();
    session.messages.push({ role: "assistant", content: "There was a network error. Please try again." });
    saveSessions();
    renderCurrentSession();
  } finally {
    isWaitingForReply = false;
    document.getElementById("send-button").disabled = false;
  }
}

function addTypingIndicator() {
  const chatContainer = document.getElementById("chat-container");
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.id = "typing-indicator";
  typing.textContent = "Thinking...";
  chatContainer.appendChild(typing);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typing-indicator");
  if (typing) {
    typing.remove();
  }
}