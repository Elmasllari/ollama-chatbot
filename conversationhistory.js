//CONSTANTS
const USER_ROLE = "user";
const OLLAMA_ROLE = "assistant";
/**
 * [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hello."
    }
  ]
 */
const conversation = [
  {
    role: "user",
    content: "Hello",
  },
  {
    role: "assistant",
    content: "Hello",
  },
];

function addToConversation(role, text) {
  conversation.push({
    role: role,
    content: text,
  });
}
