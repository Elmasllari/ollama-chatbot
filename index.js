document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("input");
  inputField.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      let input = inputField.value;
      inputField.value = "";
      fetchAiResponseForUserInput(input);
    }
  });
});

function fetchAiStreamingForUserInput(inputText) {
  console.log("input is:", inputText);
  const botTextField = prepareChatUIAndGetBotTextContainer(inputText);
  ollamaStreamingRequest(inputText, (data) => {
    botTextField.append(data); // Appends each piece of response to the botTextField
  });
}

/**
 *
 * Unused currently. For now we're using fetchAiStreamingForUserInput to provide real-time streaming responses.
 * but that could easily be replaced with this that just awaits the full response before updating the UI.
 */
function fetchAiResponseForUserInput(inputText) {
  console.log("input is:", inputText);
  const botTextField = prepareChatUIAndGetBotTextContainer(inputText);
  addToConversation(USER_ROLE, inputText);

  ollamaApiCallChat(conversation)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(response);
      return response.json(); // Assuming the server responds with JSON
    })
    .then((data) => {
      const messageResponse = data.message.content;
      console.log("output text is:", data.message);
      botTextField.innerText = messageResponse;
      addToConversation(data.message.role, messageResponse);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function ollamaStreamingRequest(inputText, onStreamReceived) {
  var fetchedData = [];
  ollamaApiCall(inputText, true)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.body.getReader();
    })
    .then((reader) => {
      let partialData = "";

      // Read and process the NDJSON response
      return reader.read().then(function processResult(result) {
        if (result.done) {
          return;
        }

        partialData += new TextDecoder().decode(result.value, { stream: true });
        const lines = partialData.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const json = JSON.parse(lines[i]);
          onStreamReceived(json.response);
          fetchedData.push(json); // Store the parsed JSON object in the array
        }

        partialData = lines[lines.length - 1];

        return reader.read().then(processResult);
      });
    })
    .then(() => {
      // At this point, fetchedData contains all the parsed JSON objects
      console.log(fetchedData);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
}

function prepareChatUIAndGetBotTextContainer(input) {
  const messagesContainer = document.getElementById("messages");

  // User message
  let userDiv = document.createElement("div");
  userDiv.id = "user";
  userDiv.className = "user response";
  userDiv.innerHTML = `<img src="user.png" class="avatar"><span>${input}</span>`;
  messagesContainer.appendChild(userDiv);

  // Bot message setup
  let botDiv = document.createElement("div");
  let botImg = document.createElement("img");
  let botText = document.createElement("span");
  botDiv.id = "bot";
  botImg.src = "bot-mini.png";
  botImg.className = "avatar";
  botDiv.className = "bot response";
  botDiv.appendChild(botText);
  botDiv.appendChild(botImg);
  messagesContainer.appendChild(botDiv);
  // Keep messages at most recent
  messagesContainer.scrollTop =
    messagesContainer.scrollHeight - messagesContainer.clientHeight;

  return botText;
}

function ollamaApiCallChat(conversation) {
  return fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3",
      messages: conversation,
      stream: false,
    }),
  });
}

function ollamaApiCall(inputText, allowStreaming) {
  return fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Ensures that the server knows to expect JSON
    },
    body: JSON.stringify({
      model: "llama3", // model should be already installed in ollama
      prompt: inputText,
      stream: allowStreaming, // if stream is true, the model will send one word at a time.
    }),
  });
}
