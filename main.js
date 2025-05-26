// Function to format text
function formatTextToBullets(text) {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    let html = '';
    let inList = false;
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // --- 1. Detect and process list items first ---
      // Detect numbered list
      if (/^\d+\.\s+/.test(line)) {
        if (!inList || listType !== 'ol') {
          if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
          html += '<ol>';
          inList = true;
          listType = 'ol';
        }
        // Remove the list marker and then apply inline formatting
        let listItemContent = line.replace(/^\d+\.\s+/, '');
        const formattedItem = listItemContent
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Apply bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Apply italic
        html += `<li>${formattedItem}</li>`;
      }
      // Detect unordered list
      else if (/^[-*]\s+/.test(line)) {
        if (!inList || listType !== 'ul') {
          if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        // Remove the list marker and then apply inline formatting
        let listItemContent = line.replace(/^[-*]\s+/, '');
        const formattedItem = listItemContent
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Apply bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Apply italic
        html += `<li>${formattedItem}</li>`;
      }
      // --- 2. If not a list item, check for headers ---
      // Detect bold headers (like **Section Title:**)
      else if (/^\*\*(.+?)\*\*:?$/.test(line)) {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
          listType = null;
        }
        const match = line.match(/^\*\*(.+?)\*\*:?$/);
        const title = match[1]; // Access the first captured group (content without stars)
        html += `<h4><strong>${title}</strong></h4>`; // Wrap in <strong> for bolding
      }
      // --- 3. Otherwise, it's a plain paragraph ---
      else {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
          listType = null;
        }

        // Inline bold + italic formatting for plain paragraphs
            const formatted = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

            if (formatted.trim().length > 0) {
                html += `<p>${formatted}</p>`;
            }
      }
    }

    // Close any open list tags at the end of the text
    if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';

    return html;
}

const chatWindow = document.querySelector('.chat-window .chat');
const userInputElement = document.querySelector(".chat-window input");
const sendButton = document.querySelector(".chat-window .input-area button");

// Initialize messages history for sending to backend
let messagesHistory = [];

async function sendMessage() {
    const userMessage = userInputElement.value.trim();

    if (userMessage.length === 0) return;

    try {
        userInputElement.value = "";
        chatWindow.insertAdjacentHTML("beforeend",`
            <div class="user">
                <p>${userMessage}</p>
            </div>
        `);

        chatWindow.insertAdjacentHTML("beforeend",`
            <div class="loader"></div>
        `);

        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Add user message to history before sending to backend
        messagesHistory.push({
            role: "user",
            parts: [{ text: userMessage }],
        });

        // Make the request to your Netlify Function proxy
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userMessage: userMessage,
                history: messagesHistory, // Send the current history to the backend
            }),
        });

        // Remove the loader
        const loader = document.querySelector(".chat-window .chat .loader");
        if (loader) {
            loader.remove();
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const modelResponseText = data.response; // Get the full response from your function

        chatWindow.insertAdjacentHTML("beforeend",`
            <div class="model">
                ${formatTextToBullets(modelResponseText)}
            </div>
        `);

        // Add model response to history for subsequent turns
        messagesHistory.push({
            role: "model",
            parts: [{ text: modelResponseText }],
        });

        chatWindow.scrollTop = chatWindow.scrollHeight;

    } catch (error) {
        console.error("Error sending message:", error);
        const loader = document.querySelector(".chat-window .chat .loader");
        if (loader) {
            loader.remove();
        }
        chatWindow.insertAdjacentHTML("beforeend",`
            <div class="error">
                <p>The message could not be sent. Please try again.</p>
            </div>
        `);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// Event listeners
sendButton.addEventListener("click", sendMessage);

userInputElement.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// // Initial model message on load
// document.addEventListener('DOMContentLoaded', () => {
//     document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend",`
//         <div class="model">
//             <p>How can I help your home today?</p>
//         </div>
//     `);
// });

document.querySelector(".chat-button")
.addEventListener("click", ()=>{
    document.querySelector("body").classList.add("chat-open");
});

document.querySelector(".chat-window button.close")
.addEventListener("click", ()=>{
    document.querySelector("body").classList.remove("chat-open");
});