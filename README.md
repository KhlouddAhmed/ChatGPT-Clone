# ChatGPT Clone

A lightweight browser-based chat interface powered by Google's Gemini API. The app supports multiple conversations and stores chat history in the browser's local storage.

## Features

- Create and switch between conversations
- Persist conversation history in browser local storage
- Send messages to the Gemini API through a small Express server
- Keep the Google API key on the server, outside the browser code

## Requirements

- Node.js 18 or newer
- A Google AI Studio API key with access to the Gemini API

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root. You can copy `.env.example` and replace its placeholder:

   ```env
   GOOGLE_API_KEY=your_google_api_key
   ```

3. Start the server:

   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API

The browser sends chat history to `POST /api/chat`. The Express server forwards it to Google's Gemini `gemini-3-flash-preview` model and returns the model response.

## Security

Keep API keys private. Do not commit `.env` or share its contents. If a key has been exposed, revoke it and create a replacement in Google AI Studio.
