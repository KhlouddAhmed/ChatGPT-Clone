const express = require("express");
const cors = require("cors");
const path = require("path");
const { config } = require("dotenv");

config();

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("Missing GOOGLE_API_KEY in environment. Create a .env file with GOOGLE_API_KEY=your_api_key");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages is required and must be an array" });
    }

    const formattedText = messages
      .map((message) => {
        if (message.role === "system") {
          return `System: ${message.content}`;
        }
        if (message.role === "user") {
          return `User: ${message.content}`;
        }
        return `Assistant: ${message.content}`;
      })
      .join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(GOOGLE_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: formattedText }
              ]
            }
          ],
          generationConfig: {
            temperature: temperature ?? 0.7,
            maxOutputTokens: 512
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Google API request failed", error);
    res.status(500).json({ error: error.message || "Server error sending request to Google" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});