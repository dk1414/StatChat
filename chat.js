const API_BASE_URL = "https://statcast-analytics-695594480233.us-central1.run.app"; 
const intro_message = `

Hello! I'm an MLB baseball analyst bot here to help you explore and understand baseball data. Whether you're curious about player performances, statistics, or want visual insights through charts and visualizations, I've got you covered.

Here are some examples of what you might ask me:

- "Who hit the most home runs in the 2022 regular season?"
- "Which pitchers had the highest fastball velocity in 2023?"
- "Can you show a heatmap of pitch locations for Gerrit Cole in 2021?"
- "Can you show me how Ohtani performs against different kinds of pitches?"
- "Show me a trend line of Aaron Judge's home runs from 2015 to 2023."
- "What teams had the highest slugging percentage in 2021?"

If you're interested in specific stats from the Statcast era (2015-mid 2024), feel free to ask! I'm here to help you explore the numbers and gain a deeper understanding of the game of baseball. Let me know what you'd like to know!
(Note): Certain stats like WAR and stolen bases are very difficult to compute from pitch-level statcast data, so queries on these kinds of metrics may not be reliable.
`;

let threadId = null;

// We'll store a reference to a "typing" message div if we add one
let typingIndicatorDiv = null;

window.addEventListener("DOMContentLoaded", async () => {
  try {

    addMessageToChat({
        role: "assistant",
        text: intro_message
      });

    // Warm up container
    await fetch(`${API_BASE_URL}/health`);
    console.log("Container warmed up.");

    // Create thread
    const threadResp = await fetch(`${API_BASE_URL}/create_thread`, { method: "POST" });
    const threadData = await threadResp.json();
    threadId = threadData.thread_id;
    console.log("Got thread_id:", threadId);

  } catch (err) {
    console.error("Startup error:", err);
    alert("Could not initialize chat. See console for details.");
  }


  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");

  sendBtn.addEventListener("click", async () => {
    const messageText = userInput.value.trim();
    if (!messageText) return;

    // 1) Display user message
    addMessageToChat({
      role: "user",
      text: messageText
    });

    userInput.value = "";

    // 2) Show typing indicator
    showTypingIndicator();

    try {
      // 3) Call add_message
      const resp = await fetch(`${API_BASE_URL}/add_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, user_message: messageText })
      });
      const data = await resp.json();

      // 4) Remove typing indicator
      hideTypingIndicator();

      // 5) Render the returned messages
      if (data.messages) {
        for (const msg of data.messages) {
          addMessageToChat(msg);
        }
      }
    } catch (err) {
      console.error("Send error:", err);
      hideTypingIndicator(); // remove the spinner
      addMessageToChat({
        role: "assistant",
        text: "Sorry, something went wrong on the server."
      });
    }
  });
});

// chat.js excerpt
function addMessageToChat(msg) {
    const chatWindow = document.getElementById("chat-window");
  
    const msgWrapper = document.createElement("div");
    msgWrapper.classList.add("message");
  
    // If it's user role & no image => right bubble, else left
    const isUserBubble = (msg.role === "user" && !msg.image);
  
    if (isUserBubble) {
      msgWrapper.classList.add("user-msg");
    } else {
      msgWrapper.classList.add("assistant-msg");
    }
  
    if (isUserBubble) {
      // user bubble
      const bubbleDiv = document.createElement("div");
      bubbleDiv.classList.add("user-bubble");
      bubbleDiv.textContent = msg.text;
      msgWrapper.appendChild(bubbleDiv);
    } else {
      // left side (assistant or user with image)
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("assistant-content");
  
      if (msg.image) {
        // ignore text, just show image
        const imgElem = document.createElement("img");
        imgElem.src = `data:image/png;base64,${msg.image}`;
        imgElem.alt = "Chart Image";
        contentDiv.appendChild(imgElem);
      } else {
        // parse text as markdown
        const html = marked.parse(msg.text || "");
        contentDiv.innerHTML = html;
      }
      msgWrapper.appendChild(contentDiv);
    }
  
    chatWindow.appendChild(msgWrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  

function showTypingIndicator() {
  if (typingIndicatorDiv) return; // already showing

  const chatWindow = document.getElementById("chat-window");

  typingIndicatorDiv = document.createElement("div");
  typingIndicatorDiv.classList.add("message", "assistant-msg");

  // Make a small "assistant-content" container with a spinner or dots
  const contentDiv = document.createElement("div");
  contentDiv.classList.add("assistant-content", "typing-indicator");
  contentDiv.textContent = "Thinking...";

  typingIndicatorDiv.appendChild(contentDiv);
  chatWindow.appendChild(typingIndicatorDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTypingIndicator() {
  if (!typingIndicatorDiv) return;
  typingIndicatorDiv.remove();
  typingIndicatorDiv = null;
}

