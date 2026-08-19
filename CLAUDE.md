# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal chatbot widget for the "Hospital Bravo" website (Quevedo, Ecuador). It has two parts:

- `chatbot-widget.js` — a self-contained, vanilla-JS chat bubble widget meant to be dropped into any HTML page via `<script src="chatbot-widget.js"></script>` before `</body>`. It renders the toggle button, chat window, and message history, and POSTs to a backend URL.
- `api/chat.js` — a Vercel serverless function (`POST /api/chat`) that proxies chat messages to the Google Gemini API (`gemini-flash-latest`), keeping the `GEMINI_API_KEY` server-side.

There is no build step, bundler, package manager, or test suite — this is plain JS deployed as static file + a Vercel function, per `vercel.json` (`{ "version": 2 }`).

## Development / running locally

No `npm install`, build, lint, or test commands exist in this repo. To work on it:

- Edit `chatbot-widget.js` / `api/chat.js` directly; there's no transpilation.
- To run the serverless function locally, use the Vercel CLI: `vercel dev` (requires a Vercel account/login and a `GEMINI_API_KEY` env var set, e.g. via `vercel env pull` or a local `.env`).
- Deployment is via Vercel (connect this repo to a Vercel project); `vercel.json` is the only deploy config.

## Architecture notes

- **Request flow**: browser widget → `POST {BACKEND_URL}/api/chat` with `{ message, history }` → `api/chat.js` builds a Gemini `contents` array from `history` + the new `message`, attaches a hardcoded `systemInstruction`, and calls the Gemini `generateContent` REST endpoint → returns `{ reply }` (or `{ error }`) to the widget.
- **`BACKEND_URL`** in `chatbot-widget.js` is hardcoded (`https://TU-PROYECTO.vercel.app/api/chat`) and must be updated to point at the actual deployed Vercel project URL when reusing this widget elsewhere.
- **History format**: the widget keeps an in-memory `history` array of `{ role: 'user' | 'bot', text }`. `api/chat.js` maps `bot` → Gemini's `model` role and `user` → `user` when building the `contents` payload.
- **System prompt (in `api/chat.js`)** is the actual business logic of the bot — it hardcodes, in Spanish:
  - Hospital identity, address, hours (24/7 emergencies, specialties by appointment), phone/WhatsApp numbers.
  - The full list of medical specialties and the doctor directory (name — specialty — notes).
  - Appointment-booking flow (no online booking; patients fill a form at `hospitalbravo.com/citas.html` which opens WhatsApp to `+593 96 339 0400`).
  - Strict output-format rules: **plain text only, no Markdown** (the chat UI can't render `**bold**`, `_italics_`, `#` headers, or `[text](links)`), since `chatbot-widget.js` renders bot replies via `textContent`.
  - Safety rules: never give medical diagnoses/treatment; redirect real emergencies to call/visit immediately; don't invent doctors/info not in the directory.
  - When updating hospital info (doctors, phone numbers, specialties, services), edit this prompt string in `api/chat.js` — it is the single source of truth, there's no separate data file or CMS.
- **CORS**: `api/chat.js` sets `Access-Control-Allow-Origin: *` and handles `OPTIONS` preflight itself; there's no auth on the endpoint beyond the server-side Gemini key.
- **Error handling contract**: the function returns JSON `{ error: string }` with the relevant HTTP status (400 missing message, 405 wrong method, 500 missing API key / internal error, or Gemini's own status on failure); the widget just displays `data.reply || data.error || 'Error'`.
